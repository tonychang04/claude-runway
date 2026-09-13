import path from 'node:path';
import {atomicJSON} from './core.mjs';
let text='';for await(const chunk of process.stdin){text+=chunk;if(text.length>1048576)process.exit(0)}
try{
 const data=JSON.parse(text),[root,id]=process.argv.slice(2);
 if(!/^[a-f0-9-]{36}$/.test(id)||data.session_id!==id)process.exit(0);
 const windows=Object.entries(data.rate_limits||{}).filter(([key,v])=>['five_hour','seven_day'].includes(key)&&Number.isFinite(v?.used_percentage)).map(([key,v])=>({key,used:v.used_percentage,resetsAt:Number.isFinite(v.resets_at)?v.resets_at:null}));
 // Only documented non-secret fields supplied by Claude. No API calls or auth inspection.
 atomicJSON(path.join(root,'native-telemetry',id+'.json'),{at:new Date().toISOString(),windows});
 console.log('Runway · '+(windows.map(w=>`${w.key==='five_hour'?'5h':'7d'} ${w.used}%`).join(' · ')||'Check /usage in Claude'));
}catch{console.log('Runway · Claude manages this session')}
