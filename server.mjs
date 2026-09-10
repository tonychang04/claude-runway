import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Manager} from './lib/manager.mjs';
import {discoverLocal} from './lib/discovery.mjs';
import {atomicJSON,readJSON,safeEqual} from './lib/core.mjs';
const root=path.resolve(process.env.SWITCHBOARD_DATA||path.join(import.meta.dirname,'.state'));
const manager=new Manager(root);
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
  const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/refinements.css':'refinements.css'};const file=files[url.pathname];if(!file||req.method!=='GET')return json(res,404,{error:'Not found'});
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');return fs.createReadStream(path.join(import.meta.dirname,'public',file)).pipe(res);
 }
 if(!safeEqual(req.headers.authorization,'Bearer '+secret))return json(res,401,{error:'Open this dashboard with its private access link'});
 if(req.method==='POST'&&req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
 try{
  const b=req.method==='POST'?await body(req):{};
  if(req.method==='GET'&&url.pathname==='/api/status')return json(res,200,{...manager.snapshot(),localProcesses});
  if(req.method==='POST'&&url.pathname==='/api/accounts'){const id=await manager.addAccount(b);return json(res,201,{id})}
  if(req.method==='POST'&&url.pathname==='/api/accounts/verify')return json(res,200,await manager.verifyAccount(b.id));
  if(req.method==='POST'&&url.pathname==='/api/accounts/update'){const a=manager.getAccount(b.id);if(typeof b.enabled==='boolean')a.enabled=b.enabled;manager.save();return json(res,200,{ok:true})}
  if(req.method==='POST'&&url.pathname==='/api/switch'){await manager.switchTo(b.id);return json(res,200,{ok:true})}
  if(req.method==='POST'&&url.pathname==='/api/settings'){if(typeof b.autoSwitch==='boolean')manager.state.autoSwitch=b.autoSwitch;if(b.threshold!==undefined){if(!Number.isInteger(b.threshold)||b.threshold<50||b.threshold>100)throw Error('Threshold must be 50–100');manager.state.threshold=b.threshold}manager.save();return json(res,200,{ok:true})}
  if(req.method==='POST'&&url.pathname==='/api/refresh'){void manager.refresh();return json(res,202,{ok:true})}
  if(req.method==='POST'&&url.pathname==='/api/sessions')return json(res,201,await manager.launch(b));
  if(req.method==='POST'&&url.pathname==='/api/sessions/stop'){await manager.stopSession(b.id);return json(res,200,{ok:true})}
  if(req.method==='POST'&&url.pathname==='/api/sessions/archive'){manager.archiveSession(b.id);return json(res,200,{ok:true})}
  if(req.method==='GET'&&url.pathname==='/api/screen')return json(res,200,{screen:await manager.sessionScreen(url.searchParams.get('id'))});
  if(req.method==='POST'&&url.pathname==='/api/input'){await manager.send(b.id,b.text,b.key);return json(res,200,{ok:true})}
  if(req.method==='POST'&&url.pathname==='/api/login')return json(res,201,{id:await manager.startLogin(b.name,b.replaceId)});
  if(req.method==='GET'&&url.pathname==='/api/login')return json(res,200,await manager.loginStatus(url.searchParams.get('id')));
  if(req.method==='POST'&&url.pathname==='/api/login/input'){await manager.loginInput(b.id,b.text);return json(res,200,{ok:true})}
  if(req.method==='POST'&&url.pathname==='/api/login/cancel'){await manager.cancelLogin(b.id);return json(res,200,{ok:true})}
  json(res,404,{error:'Not found'});
 }catch(e){json(res,400,{error:e.message?.startsWith('Command failed')?'Claude terminal command failed. Check that the session is still running.':e.message||'Request failed'})}
});
server.listen(port,'127.0.0.1',()=>{atomicJSON(path.join(root,'server.json'),{pid:process.pid,origin});console.log(`Switchboard listening at ${origin}. Run "node cli.mjs open" for the private dashboard.`);void manager.refresh()});
const refresh=setInterval(()=>void manager.refresh().catch(()=>{}),90000);
const tick=setInterval(()=>void manager.tick().catch(()=>{}),3000);
process.on('SIGTERM',()=>{clearInterval(discovery);clearInterval(refresh);clearInterval(tick);server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),2000).unref()});
