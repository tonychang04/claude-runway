import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {atomicJSON,readJSON,cleanEnv} from './core.mjs';
const run=promisify(execFile);
const quote=s=>"'"+String(s).replaceAll("'","'\\''")+"'";
export function authMetadata(value){
 return {loggedIn:value.loggedIn===true,authMethod:typeof value.authMethod==='string'?value.authMethod:null,email:typeof value.email==='string'?value.email:null,subscriptionType:typeof value.subscriptionType==='string'?value.subscriptionType:null,checkedAt:new Date().toISOString()};
}
export class NativeManager{
 constructor(root,{exec=run,claude=process.env.SWITCHBOARD_CLAUDE||path.join(os.homedir(),'.local/bin/claude')}={}){
  this.root=root;this.claude=claude;this.exec=exec;this.tmux=process.env.SWITCHBOARD_TMUX||'tmux';
  this.socket='runway-native-'+crypto.createHash('sha256').update(root).digest('hex').slice(0,12);
  fs.mkdirSync(root,{recursive:true,mode:0o700});
  this.file=path.join(root,'native-state.json');this.state=readJSON(this.file,{profiles:[],sessions:[],events:[]});
  // Metadata only. Never open the old vault, key, credential file or transcripts.
  const old=readJSON(path.join(root,'state.json'),{});
  this.legacyCount=old.accounts?.length||0;this.legacySessions=(old.sessions||[]).map(({id,cwd,name})=>({id,cwd,name}));
 }
 save(){atomicJSON(this.file,this.state)}
 event(message){this.state.events.unshift({at:new Date().toISOString(),message});this.state.events=this.state.events.slice(0,50);this.save()}
 profile(id){const p=this.state.profiles.find(p=>p.id===id);if(!p)throw Error('Profile not found');return p}
 configDir(id){this.profile(id);return path.join(this.root,'native-profiles',id)}
 async tm(...args){return (await this.exec(this.tmux,['-L',this.socket,...args],{timeout:10000,maxBuffer:1024*1024})).stdout}
 createProfile(name){
  const id=crypto.randomUUID(),label=String(name||'').trim()||'Claude profile '+(this.state.profiles.length+1);
  if(label.length>100)throw Error('Nickname must be 100 characters or fewer');
  const p={id,name:label,createdAt:new Date().toISOString(),auth:null};this.state.profiles.push(p);
  fs.mkdirSync(this.configDir(id),{recursive:true,mode:0o700});this.event(`Created ${label}`);return p;
 }
 async checkProfile(id){
  const p=this.profile(id),dir=this.configDir(id);let stdout;
  try{({stdout}=await this.exec(this.claude,['auth','status','--json'],{cwd:dir,env:cleanEnv(process.env,dir),timeout:15000,maxBuffer:65536}))}
  catch(e){if(typeof e.stdout==='string'&&e.stdout.trim())stdout=e.stdout;else throw Error('Official Claude status could not run. Open its terminal and check your installation or sign-in.')}
  let parsed;try{parsed=JSON.parse(stdout)}catch{throw Error('Official Claude returned an unreadable status. No account status was changed.')}
  if(typeof parsed.loggedIn!=='boolean')throw Error('Claude status did not include a login result');
  p.auth=authMetadata(parsed);this.save();return p.auth;
 }
 async startLogin(id){
  const p=this.profile(id),existing=this.state.sessions.find(s=>s.profileId===id&&s.kind==='login'&&s.running);
  if(existing)return existing;
  if(this.state.sessions.some(s=>s.profileId===id&&s.kind==='work'&&s.running))throw Error('This profile has running work. Use /login in its existing Claude terminal, or create a separate profile for a different account.');
  return this.start(p,{cwd:this.configDir(id),kind:'login'});
 }
 async launch({profileId,cwd,model='sonnet'}){
  const p=this.profile(profileId);if(!path.isAbsolute(cwd||'')||!fs.statSync(cwd).isDirectory())throw Error('Choose an existing absolute project folder');
  if(!['sonnet','opus','haiku'].includes(model))throw Error('Choose a supported model');
  // No cached login gate: Claude itself decides whether login is needed and owns renewal.
  return this.start(p,{cwd:fs.realpathSync(cwd),kind:'work',model});
 }
 async start(p,{cwd,kind,model}){
  const id=crypto.randomUUID(),name='native-'+id.slice(0,8),dir=this.configDir(p.id);
  const args=kind==='login'?['auth','login']:['--model',model,'--session-id',id,'--settings',JSON.stringify({statusLine:{type:'command',command:`${quote(process.execPath)} ${quote(path.join(import.meta.dirname,'native-statusline.mjs'))} ${quote(this.root)} ${quote(id)}`}})];
  // Supply the environment per process, never via a reusable tmux server's ambient config.
  const env=cleanEnv(process.env,dir);
  await this.exec(this.tmux,['-L',this.socket,'new-session','-d','-s',name,'-x','120','-y','36','-c',cwd,'env',`CLAUDE_CONFIG_DIR=${dir}`,this.claude,...args],{env,timeout:10000,maxBuffer:65536});
  const s={id,name,profileId:p.id,cwd,kind,model:model||null,running:true,createdAt:new Date().toISOString()};this.state.sessions.push(s);this.event(`${kind==='login'?'Opened official sign-in':'Started Claude'}: ${p.name}`);return s;
 }
 session(id){const s=this.state.sessions.find(s=>s.id===id);if(!s)throw Error('Session not found');return s}
 async openTerminal(id){
  const s=this.session(id);if(!s.running)throw Error('This terminal has exited. Start a new sign-in or work session.');
  if(process.platform!=='darwin')throw Error('Use Copy terminal command on this platform.');
  const file=path.join(this.root,'terminal-launchers',s.id+'.command');fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  fs.writeFileSync(file,`#!/bin/sh\nexport PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin\nexec ${quote(this.tmux)} -L ${quote(this.socket)} attach -t ${quote(s.name)}\n`,{mode:0o700});
  await this.exec('/usr/bin/open',['-a','Terminal',file],{timeout:10000});return {ok:true};
 }
 async refreshSessions(){for(const s of this.state.sessions){try{await this.tm('has-session','-t',s.name);s.running=true}catch{s.running=false}}this.save()}
 snapshot(){return {mode:'native',profiles:this.state.profiles,sessions:this.state.sessions.map(s=>({...s,attach:`${quote(this.tmux)} -L ${quote(this.socket)} attach -t ${quote(s.name)}`,telemetry:readJSON(path.join(this.root,'native-telemetry',s.id+'.json'))})),events:this.state.events,legacy:{accounts:this.legacyCount,sessions:this.legacySessions}}}
}
