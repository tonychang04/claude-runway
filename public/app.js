const $=s=>document.querySelector(s);
const fragment=new URLSearchParams(location.hash.slice(1));
if(fragment.has('access')){sessionStorage.setItem('switchboard-key',fragment.get('access'));history.replaceState(null,'',location.pathname)}
const key=sessionStorage.getItem('switchboard-key');
let snapshot,terminalId,loginId,replaceId=null,loading=false,loginPolling=false;
function notice(message){$('#notice').textContent=message;$('#notice').hidden=!message}
async function api(route,data){const r=await fetch('/api/'+route,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+key,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});const result=await r.json();if(!r.ok)throw Error(result.error);return result}
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
function button(text,action,cls='secondary'){const n=el('button',text,cls);n.onclick=()=>act(action);return n}
async function act(fn){try{notice('');await fn();await load()}catch(e){notice(e.message)}}
function ago(date){if(!date)return 'Not measured';const seconds=Math.max(0,Math.round((Date.now()-Date.parse(date))/1000));return seconds<60?`${seconds}s ago`:`${Math.floor(seconds/60)}m ago`}
function reset(date){if(!date)return 'Reset time unavailable';const minutes=Math.ceil((Date.parse(date)-Date.now())/60000);return minutes<=0?'Reset due; awaiting fresh usage':minutes>=1440?`Resets in ${Math.floor(minutes/1440)}d ${Math.floor(minutes%1440/60)}h`:`Resets in ${Math.floor(minutes/60)}h ${minutes%60}m`}
function connectAccount(account=null){replaceId=account?.id||null;$('#account-form').reset();if(account)$('#account-form').elements.name.value=account.name;$('#account-dialog').showModal()}
async function copy(text){await navigator.clipboard.writeText(text);notice('Copied. Paste this command in a terminal on this Mac.')}
function render(s){
 snapshot=s;$('#selected').textContent=s.accounts.find(a=>a.id===s.activeId)?.name||'No account selected';$('#available').textContent=s.accounts.filter(a=>a.eligible).length+' / '+s.accounts.length;$('#auto').checked=s.autoSwitch;$('#threshold').value=s.threshold;$('#account-count').textContent=s.accounts.length+' connected';$('#updated').textContent=s.refreshing?'Refreshing account usage…':'Only recently verified quota counts';
 $('#accounts').replaceChildren();if(!s.accounts.length)$('#accounts').append(el('div','Connect your first account. Sign-in stays on your Mac.','empty'));
 for(const a of s.accounts){
  const expired=a.auth==='expired'||(a.expiresAt&&a.expiresAt<=Date.now());const stale=!a.observedAt||Date.now()-Date.parse(a.observedAt)>=300000;
  const card=el('article',undefined,'card'+(a.id===s.activeId?' active':''));const head=el('div',undefined,'card-head');head.append(el('span',a.name.slice(0,2).toUpperCase(),'avatar'),el('h3',a.name),el('span',expired?'Reconnect':!a.enabled?'Tracking only':a.id===s.activeId?'Selected':a.eligible?'Ready':!a.windows?.length?'Quota unavailable':stale?'Quota stale':'Not ready','badge'+(!a.eligible?' warning':'')));card.append(head);
  for(const w of a.windows||[]){const row=el('div',undefined,'window'+(w.used>=95?' exhausted':'')),label=el('div',undefined,'window-label');label.append(el('span',w.label),el('strong',w.used===null?'Unknown':Math.round(w.used)+'%'));const meter=el('div',undefined,'meter'),p=el('progress');p.max=100;p.value=w.used||0;p.setAttribute('aria-label',w.label);meter.append(p);row.append(label,meter,el('small',reset(w.resetsAt)));card.append(row)}
  if(!a.windows?.length)card.append(el('p','Credential saved. Quota has not been verified, so this account cannot be selected automatically. A managed response may supply usage telemetry.','muted'));
  const note=el('div',undefined,'account-note');note.append(el('span',(stale?'Stale reading':a.error?'Last known usage':'Usage observed')+' · '+ago(a.observedAt),'freshness'));
  if(a.error)note.append(el('div',a.error.includes('rate limited')?'Usage lookup throttled—not proof of exhausted quota. Retrying automatically.':a.error));
  note.append(el('div',a.expiresAt?(expired?'Expired ':'Credential expires ')+new Date(a.expiresAt).toLocaleString():'Expiry unknown · reconnect if revoked or expired'));
  if(a.expiresAt>Date.now()&&a.expiresAt-Date.now()<86400000)note.append(el('div','Expires within 24 hours · reconnect soon','renew-warning'));
  if(a.connectionCheck)note.append(el('div',(a.connectionCheck.ok?'Connection passed':'Connection check failed')+' · '+ago(a.connectionCheck.at)));
  card.append(note);
  const actions=el('div',undefined,'account-actions');actions.append(button('Test connection',async()=>{if(!confirm('Send one small Haiku test request with this account? This uses a little quota and does not switch your working sessions.'))return;notice('Testing with official Claude… This may take up to 45 seconds.');const result=await api('accounts/verify',{id:a.id});notice(result.detail+(result.ok?' Quota availability is checked separately.':''))},'secondary'),button('Reconnect',()=>connectAccount(a),'text-button'));card.append(actions);
  const foot=el('div',undefined,'card-footer'),label=el('label'),check=el('input');check.type='checkbox';check.checked=a.enabled;check.onchange=()=>act(()=>api('accounts/update',{id:a.id,enabled:check.checked}));label.append(check,document.createTextNode('Use automatically'));const sw=button(a.id===s.activeId?'Selected':'Switch here',()=>api('switch',{id:a.id}));sw.disabled=!a.enabled||a.auth==='expired'||a.id===s.activeId;foot.append(label,sw);card.append(foot);$('#accounts').append(card);
 }
 const add=button('',()=>connectAccount(),'add-card');add.append(el('span','＋'),el('strong','Connect another account'),el('small','Official sign-in or setup token'));$('#accounts').append(add);
 $('#session-count').textContent=s.sessions.length+' managed';
 $('#sessions').replaceChildren();if(!s.sessions.length)$('#sessions').append(el('div','No managed sessions yet. Select an account, then start a session.','empty'));
 for(const session of s.sessions){const row=el('article',undefined,'session'),info=el('div',undefined,'session-info');info.append(el('strong',session.cwd.split('/').filter(Boolean).at(-1)||session.cwd),el('small',session.cwd),el('small',session.running?(session.activity?.busy?'Working · managed':'Idle · managed'):'Stopped · conversation retained'));row.append(el('span','›_','terminal-symbol'),info,el('small',session.model));if(session.running)row.append(button('Copy attach',()=>copy(session.attach)),button('Open terminal',async()=>{terminalId=session.id;$('#terminal-dialog').showModal();await terminal()}));row.append(button(session.running?'Stop':'Archive',async()=>{if(!session.running||confirm('Stop this Claude terminal? Its conversation is retained.'))await api('sessions/'+(session.running?'stop':'archive'),{id:session.id})}));$('#sessions').append(row)}
 $('#external-sessions').replaceChildren();const local=s.localProcesses;
 if(local?.error)$('#external-sessions').append(el('p',local.error,'muted'));
 else if(!local?.processes?.length)$('#external-sessions').append(el('p','No additional native Claude processes detected.','muted'));
 for(const process of local?.processes||[]){const row=el('article',undefined,'session'),info=el('div',undefined,'session-info');info.append(el('strong','Claude · PID '+process.pid),el('small',process.tty?'Terminal '+process.tty:'No attached terminal'),el('small','Visible only · login, quota and conversation not inspected'));row.append(el('span','○','badge'),info,el('span','Outside Runway','badge warning'));$('#external-sessions').append(row)}
 $('#events').replaceChildren(...s.events.slice(0,12).map(e=>{const row=el('div',undefined,'event');row.append(el('span',e.message),el('time',new Date(e.at).toLocaleTimeString()));return row}));if(!s.events.length)$('#events').append(el('p','Account changes will appear here.','muted'));
 $('#connection').textContent='● Connected · refreshed '+new Date().toLocaleTimeString();
}
async function load(){if(loading)return;loading=true;try{render(await api('status'))}catch(e){notice(e.message);$('#connection').textContent='Disconnected'}finally{loading=false}}
async function terminal(){if(!terminalId||!$('#terminal-dialog').open)return;try{$('#terminal').textContent=(await api('screen?id='+encodeURIComponent(terminalId))).screen}catch(e){$('#terminal').textContent=e.message}}
$('#connect').onclick=()=>connectAccount();$('#new-session').onclick=()=>$('#session-dialog').showModal();
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$('#'+b.dataset.close).close();
$('#refresh').onclick=()=>act(()=>api('refresh',{}));$('#auto').onchange=e=>act(()=>api('settings',{autoSwitch:e.target.checked}));$('#threshold').onchange=e=>act(()=>api('settings',{threshold:Number(e.target.value)}));
$('#save-token').onclick=()=>act(async()=>{const f=new FormData($('#account-form'));await api('accounts',{name:f.get('name'),token:f.get('token'),replaceId});$('#account-form').reset();$('#account-dialog').close();notice('Credential saved. Next: Test connection, then choose Switch here. Adding an account does not switch existing sessions.')});
$('#account-form').onsubmit=e=>{e.preventDefault();act(async()=>{const f=new FormData(e.target);loginId=(await api('login',{name:f.get('name'),replaceId})).id;$('#login-flow').hidden=false;await pollLogin()})};
async function pollLogin(){if(!loginId||loginPolling)return;loginPolling=true;try{const job=await api('login?id='+loginId);if(job.state==='complete'){loginId=null;$('#account-dialog').close();$('#account-form').reset();$('#login-flow').hidden=true;notice('Credential saved. Next: Test connection, then choose Switch here. Adding an account does not switch existing sessions.');await load();return}$('#login-screen').textContent=job.screen;$('#login-link').hidden=!job.url;if(job.url)$('#login-link').href=job.url}catch(e){notice(e.message)}finally{loginPolling=false}}
$('#login-code-form').onsubmit=e=>{e.preventDefault();act(async()=>{await api('login/input',{id:loginId,text:$('#login-code').value});$('#login-code').value='';await pollLogin()})};
$('#cancel-login').onclick=()=>act(async()=>{await api('login/cancel',{id:loginId});loginId=null;$('#login-flow').hidden=true});
$('#session-form').onsubmit=e=>{e.preventDefault();act(async()=>{const f=new FormData(e.target);const s=await api('sessions',{cwd:f.get('cwd'),model:f.get('model')});$('#session-dialog').close();terminalId=s.id;$('#terminal-dialog').showModal();await terminal()})};
$('#terminal-form').onsubmit=e=>{e.preventDefault();act(async()=>{await api('input',{id:terminalId,text:$('#message').value});$('#message').value='';await terminal()})};
for(const b of document.querySelectorAll('[data-key]'))b.onclick=()=>act(async()=>{await api('input',{id:terminalId,key:b.dataset.key});await terminal()});
await load();setInterval(load,5000);setInterval(terminal,2000);setInterval(pollLogin,2500);
