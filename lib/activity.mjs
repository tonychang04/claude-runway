import path from 'node:path';
import {atomicJSON,readJSON} from './core.mjs';
let text='';for await(const c of process.stdin)text+=c;
try{const input=JSON.parse(text);if(/^[a-f0-9-]{36}$/.test(input.session_id)){const active=readJSON(path.join(process.argv[2],'runtime','active.json'));atomicJSON(path.join(process.argv[2],'activity',input.session_id+'.json'),{busy:process.argv[3]==='start',at:Date.now(),accountId:active?.id});}}catch{}
