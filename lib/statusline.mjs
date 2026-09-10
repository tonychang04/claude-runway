import path from 'node:path';
import {atomicJSON,readJSON} from './core.mjs';
let text='';for await(const c of process.stdin)text+=c;
try{
 const input=JSON.parse(text),root=process.argv[2],active=readJSON(path.join(root,'runtime','active.json'));
 const activity=readJSON(path.join(root,'activity',input.session_id+'.json'));
 const windows=Object.entries(input.rate_limits||{}).filter(([k,v])=>['five_hour','seven_day'].includes(k)&&Number.isFinite(v?.used_percentage)).map(([key,v])=>({key,label:key==='five_hour'?'5 hours':'7 days',used:v.used_percentage,resetsAt:v.resets_at?new Date(v.resets_at*1000).toISOString():null}));
 if(/^[a-f0-9-]{36}$/.test(input.session_id)&&windows.length&&activity?.accountId===active?.id&&activity.at>active.at)atomicJSON(path.join(root,'telemetry',input.session_id+'.json'),{accountId:active.id,at:Date.now(),windows});
 console.log(`Switchboard · ${active?.name||'No account'} · ${windows.map(w=>`${w.label}: ${w.used}%`).join(' · ')||'usage pending'}`);
}catch{console.log('Switchboard · usage pending')}
