import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {readJSON} from './lib/core.mjs';
const root=path.resolve(process.env.SWITCHBOARD_DATA||path.join(import.meta.dirname,'.state'));
const server=readJSON(path.join(root,'server.json'));
const key=fs.existsSync(path.join(root,'dashboard.key'))?fs.readFileSync(path.join(root,'dashboard.key'),'utf8'):null;
async function request(route,data){const r=await fetch(server.origin+route,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+key,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});const b=await r.json();if(!r.ok)throw Error(b.error);return b}
try{
 if(!server||!key)throw Error('Start the manager first: npm start');
 if(process.argv[2]==='open'){const url=server.origin+'/#access='+key;const r=spawnSync('open',[url]);if(r.status!==0)throw Error('Could not open browser');}
 else if(process.argv[2]==='status'){const s=await request('/api/status');console.log(JSON.stringify(s,null,2));}
 else if(process.argv[2]==='launch'){const profileId=process.argv[3];if(!profileId)throw Error('Usage: node cli.mjs launch <profile-id> [sonnet|opus|haiku]');const s=await request('/api/sessions',{profileId,cwd:process.cwd(),model:process.argv[4]||'sonnet'});const socket='runway-native-'+(await import('node:crypto')).createHash('sha256').update(root).digest('hex').slice(0,12);const r=spawnSync(process.env.SWITCHBOARD_TMUX||'tmux',['-L',socket,'attach','-t',s.name],{stdio:'inherit'});process.exitCode=r.status||0;}
 else console.log('Usage: node cli.mjs open | status | launch <profile-id> [sonnet|opus|haiku]');
}catch(e){console.error(e.message);process.exitCode=1}
