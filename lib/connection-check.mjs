import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {atomicJSON,cleanEnv} from './core.mjs';
const exec=promisify(execFile);

export function classifyCheck(output){
 let result;try{result=JSON.parse(output)}catch{return {ok:false,detail:'Claude did not return a readable result. Check the CLI installation or try again.'}}
 if(!result.is_error&&result.subtype==='success'&&String(result.result).trim()==='RUNWAY_OK')return {ok:true,detail:'Official Claude answered a test request using this credential.'};
 const text=String(result.result||'');
 if(/401|invalid bearer|authentication|login expired/i.test(text))return {ok:false,expired:true,detail:'Claude rejected this credential. Reconnect the account.'};
 if(/limit|429/i.test(text))return {ok:false,detail:'Claude reported a limit. This credential is not ready for work right now.'};
 return {ok:false,detail:'Claude did not complete the test request. Access, model availability, policy or networking may be blocking it.'};
}

export async function checkConnection(claude,credential){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'runway-check-'));fs.chmodSync(dir,0o700);
 try{
  atomicJSON(path.join(dir,'.credentials.json'),{claudeAiOauth:{...credential,expiresAt:credential.expiresAt||Date.now()+86400000}});
  atomicJSON(path.join(dir,'.claude.json'),{hasCompletedOnboarding:true,theme:'dark'});
  const args=['-p','Reply with exactly RUNWAY_OK.','--model','haiku','--output-format','json','--safe-mode','--tools','','--no-session-persistence','--system-prompt','You are a connection test. Reply only with the requested marker.'];
  try{const {stdout}=await exec(claude,args,{cwd:dir,env:cleanEnv(process.env,dir),timeout:45000,maxBuffer:1024*1024});return classifyCheck(stdout)}
  catch(e){return e.stdout?classifyCheck(e.stdout):{ok:false,detail:'Connection check could not finish within 45 seconds or Claude could not start. Retry after checking connectivity.'}}
 }finally{
  // This unique directory belongs exclusively to this check. It contains no user work.
  fs.rmSync(dir,{recursive:true,force:true});
 }
}
