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
 else if(process.argv[2]==='launch'){const s=await request('/api/sessions',{cwd:process.cwd(),model:process.argv[3]||'sonnet'});const state=await request('/api/status');const entry=state.sessions.find(x=>x.id===s.id);const args=entry.attach.split(' ');const r=spawnSync(args[0],args.slice(1),{stdio:'inherit'});process.exitCode=r.status||0;}
 else console.log('Usage: node cli.mjs open | status | launch [sonnet|opus|haiku]');
}catch(e){console.error(e.message);process.exitCode=1}
