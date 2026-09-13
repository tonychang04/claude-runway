import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {NativeManager} from './lib/native-manager.mjs';
import {discoverLocal} from './lib/discovery.mjs';
import {atomicJSON,readJSON,safeEqual} from './lib/core.mjs';
const root=path.resolve(process.env.SWITCHBOARD_DATA||path.join(import.meta.dirname,'.state'));
const manager=new NativeManager(root);
let localProcesses={processes:[],error:'Scanning local Claude processes…'};
let scanning=false;
async function scan(){if(scanning)return;scanning=true;try{localProcesses=await discoverLocal(manager)}finally{scanning=false}}
void scan();const discovery=setInterval(()=>void scan(),15000);
const port=Number(process.env.PORT||43127);
const secretFile=path.join(root,'dashboard.key');if(!fs.existsSync(secretFile))fs.writeFileSync(secretFile,crypto.randomBytes(32).toString('hex'),{mode:0o600});
const secret=fs.readFileSync(secretFile,'utf8');
const origin=`http://127.0.0.1:${port}`;
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
async function body(req){let buf='';for await(const c of req){buf+=c;if(buf.length>32000)throw Error('Request too large')}return buf?JSON.parse(buf):{}}
const server=http.createServer(async(req,res)=>{
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 if(req.headers.host!==`127.0.0.1:${port}`)return json(res,403,{error:'Use the 127.0.0.1 dashboard address'});
 const url=new URL(req.url,origin);
 if(req.headers.origin&&req.headers.origin!==origin)return json(res,403,{error:'Cross-origin request rejected'});
 if(!url.pathname.startsWith('/api/')){
  const files={'/':'native.html','/native.js':'native.js','/style.css':'style.css','/refinements.css':'refinements.css'};const file=files[url.pathname];if(!file||req.method!=='GET')return json(res,404,{error:'Not found'});
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');return fs.createReadStream(path.join(import.meta.dirname,'public',file)).pipe(res);
 }
 if(!safeEqual(req.headers.authorization,'Bearer '+secret))return json(res,401,{error:'Open this dashboard with its private access link'});
 if(req.method==='POST'&&req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
 try{
  const b=req.method==='POST'?await body(req):{};
  if(req.method==='GET'&&url.pathname==='/api/status')return json(res,200,{...manager.snapshot(),localProcesses});
  if(req.method==='POST'&&url.pathname==='/api/profiles')return json(res,201,manager.createProfile(b.name));
  if(req.method==='POST'&&url.pathname==='/api/profiles/check')return json(res,200,await manager.checkProfile(b.id));
  if(req.method==='POST'&&url.pathname==='/api/profiles/login')return json(res,201,await manager.startLogin(b.id));
  if(req.method==='POST'&&url.pathname==='/api/profiles/usage')return json(res,201,await manager.usage(b.id));
  if(req.method==='POST'&&url.pathname==='/api/refresh'){await manager.refreshSessions();return json(res,200,{ok:true})}
  if(req.method==='POST'&&url.pathname==='/api/sessions')return json(res,201,await manager.launch(b));
  if(req.method==='POST'&&url.pathname==='/api/sessions/open')return json(res,200,await manager.openTerminal(b.id));
  if(['/api/accounts','/api/accounts/verify','/api/accounts/update','/api/switch','/api/settings','/api/login','/api/login/input','/api/login/cancel','/api/input','/api/screen'].includes(url.pathname))return json(res,410,{error:'Credential handling and terminal proxying were removed. Sign in directly through official Claude Code.'});
  json(res,404,{error:'Not found'});
 }catch(e){json(res,400,{error:e.message?.startsWith('Command failed')?'Claude terminal command failed. Check that the session is still running.':e.message||'Request failed'})}
});
server.listen(port,'127.0.0.1',()=>{atomicJSON(path.join(root,'server.json'),{pid:process.pid,origin});console.log(`Runway native launcher listening at ${origin}`);void manager.refreshSessions()});
const tick=setInterval(()=>void manager.refreshSessions().catch(()=>{}),10000);
process.on('SIGTERM',()=>{clearInterval(discovery);clearInterval(tick);server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),2000).unref()});
