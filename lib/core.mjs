import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function atomicJSON(file,value){
 fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
 const tmp=file+'.'+crypto.randomUUID()+'.tmp';
 fs.writeFileSync(tmp,JSON.stringify(value,null,2),{mode:0o600});fs.renameSync(tmp,file);
}
export function readJSON(file,fallback=null){try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return fallback}}
export function cleanEnv(source,runtime){const env={...source,CLAUDE_CONFIG_DIR:runtime};for(const k of Object.keys(env))if(/^(ANTHROPIC_|CLAUDE_CODE_OAUTH_TOKEN|CLAUDE_CODE_USE_|CLAUDE_CODE_HOST_CREDS_FILE|CLAUDECODE|CLAUDE_CONFIG_DIR)/.test(k)&&k!=='CLAUDE_CONFIG_DIR')delete env[k];return env}
export function safeEqual(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&crypto.timingSafeEqual(x,y)}
