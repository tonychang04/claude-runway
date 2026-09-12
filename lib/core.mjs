import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function atomicJSON(file,value){
 fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
 const tmp=file+'.'+crypto.randomUUID()+'.tmp';
 fs.writeFileSync(tmp,JSON.stringify(value,null,2),{mode:0o600});fs.renameSync(tmp,file);
}
export function readJSON(file,fallback=null){try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return fallback}}
export function seal(value,key){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);const body=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return {iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),body:body.toString('base64')}}
export function unseal(value,key){const d=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(value.iv,'base64'));d.setAuthTag(Buffer.from(value.tag,'base64'));return JSON.parse(Buffer.concat([d.update(Buffer.from(value.body,'base64')),d.final()]))}
export function windowsFromUsage(usage){return Object.entries(usage).filter(([k,v])=>/^(five_hour|seven_day)/.test(k)&&v&&typeof v==='object').map(([key,v])=>({key,label:key==='five_hour'?'5 hours':key==='seven_day'?'7 days':key.replaceAll('_',' '),used:typeof v.utilization==='number'?v.utilization:null,resetsAt:v.resets_at||null}))}
export function eligible(account,threshold,now=Date.now()){
 return account.enabled&&account.auth==='ok'&&(!account.expiresAt||account.expiresAt>now+60000)&&account.observedAt&&now-Date.parse(account.observedAt)<300000&&account.windows?.some(w=>w.key==='five_hour')&&account.windows.every(w=>Number.isFinite(w.used)&&w.used<threshold&&(!w.observedAt||now-Date.parse(w.observedAt)<300000))&&(!account.cooldownUntil||account.cooldownUntil<now);
}
export function chooseAccount(accounts,currentId,threshold,now=Date.now()){
 return accounts.filter(a=>a.id!==currentId&&eligible(a,threshold,now)).sort((a,b)=>Math.max(...a.windows.map(w=>w.used))-Math.max(...b.windows.map(w=>w.used))||a.name.localeCompare(b.name))[0]||null;
}
export function retryDelay(value,now=Date.now()){
 const seconds=Number(value),date=Date.parse(value);
 const ms=value&&Number.isFinite(seconds)?seconds*1000:Number.isFinite(date)?date-now:90000;
 return Math.min(86400000,Math.max(90000,ms));
}
export function mergeWindows(previous,next,previousAt,nextAt){const windows=new Map((previous||[]).map(w=>[w.key,{...w,observedAt:w.observedAt||previousAt}]));for(const w of next)windows.set(w.key,{...w,observedAt:nextAt});return [...windows.values()]}
export function cleanEnv(source,runtime){const env={...source,CLAUDE_CONFIG_DIR:runtime};for(const k of Object.keys(env))if(/^(ANTHROPIC_|CLAUDE_CODE_OAUTH_TOKEN|CLAUDE_CODE_USE_|CLAUDE_CODE_HOST_CREDS_FILE|CLAUDECODE|CLAUDE_CONFIG_DIR)/.test(k)&&k!=='CLAUDE_CONFIG_DIR')delete env[k];return env}
export const redact=text=>String(text).replace(/sk-ant-[A-Za-z0-9_-]+/g,'[credential hidden]');
export function safeEqual(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&crypto.timingSafeEqual(x,y)}
