import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);

// Never inspect arguments, environment variables, credentials, or transcripts.
export function parseProcesses(text){
 return text.split('\n').flatMap(line=>{
  const m=line.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/);
  return m?[{pid:Number(m[1]),ppid:Number(m[2]),tty:m[3],command:m[4]}]:[];
 });
}
export function externalProcesses(processes,managedPids){
 const byPid=new Map(processes.map(p=>[p.pid,p]));
 const isClaude=p=>p&&(/(?:^|\/)claude$/.test(p.command)||/\/claude\/versions\/[^/]+$/.test(p.command));
 return processes.filter(p=>isClaude(p)&&!managedPids.has(p.pid)).filter(p=>{
  const seen=new Set([p.pid]);let parent=byPid.get(p.ppid);
  while(parent&&!seen.has(parent.pid)){if(isClaude(parent)||managedPids.has(parent.pid))return false;seen.add(parent.pid);parent=byPid.get(parent.ppid)}
  return true;
 }).map(({pid,tty})=>({pid,tty:tty==='??'?null:tty,managed:false}));
}
export async function discoverLocal(manager){
 if(process.platform!=='darwin')return {processes:[],error:'Local process discovery is currently available on macOS.'};
 try{
  const {stdout}=await exec('/bin/ps',['-U',String(process.getuid()),'-o','pid=,ppid=,tty=,comm='],{timeout:4000,maxBuffer:1024*1024});
  let panes='';try{panes=await manager.tm('list-panes','-a','-F','#{pane_pid}')}catch{
   if(manager.state.sessions.some(s=>s.running))throw Error('Managed process identification unavailable');
  }
  return {processes:externalProcesses(parseProcesses(stdout),new Set(panes.trim().split(/\s+/).map(Number))),error:null};
 }catch{return {processes:[],error:'Local process discovery unavailable. Managed sessions are still listed.'}}
}
