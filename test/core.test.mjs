import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {eligible,chooseAccount,windowsFromUsage,seal,unseal,cleanEnv,redact} from '../lib/core.mjs';
const now=Date.now();
const account=(id,used,extra={})=>({id,name:id,enabled:true,auth:'ok',observedAt:new Date(now).toISOString(),windows:[{key:'five_hour',used}],...extra});
test('routing excludes disabled, expired, stale, unknown, cooling and exhausted accounts',()=>{
 for(const a of [account('a',1,{enabled:false}),account('a',1,{auth:'expired'}),account('a',1,{observedAt:new Date(now-600000).toISOString()}),account('a',null),account('a',1,{cooldownUntil:now+1000}),account('a',100),account('a',1,{expiresAt:now+30000})])assert.equal(!!eligible(a,95,now),false);
 const active=account('active',95),ready=account('ready',10),other=account('other',50);
 assert.equal(chooseAccount([active,ready,other],active.id,95,now).id,'ready');
 assert.equal(chooseAccount([active],active.id,95,now),null);
});
test('weekly exhaustion prevents selecting an account with empty five-hour quota',()=>{const a=account('a',0);a.windows.push({key:'seven_day',used:100});assert.equal(eligible(a,95,now),false)});
test('provider null windows do not become zero-percent quota',()=>{assert.deepEqual(windowsFromUsage({five_hour:{utilization:null},seven_day:null}),[{key:'five_hour',label:'5 hours',used:null,resetsAt:null}])});
test('vault round trip and tamper rejection',()=>{const key=crypto.randomBytes(32),value={accessToken:'private'};const c=seal(value,key);assert.deepEqual(unseal(c,key),value);c.tag=crypto.randomBytes(16).toString('base64');assert.throws(()=>unseal(c,key))});
test('managed launches clear competing credentials and provider overrides',()=>{const env=cleanEnv({PATH:'/bin',ANTHROPIC_API_KEY:'secret',ANTHROPIC_BASE_URL:'proxy',CLAUDE_CODE_OAUTH_TOKEN:'token',CLAUDE_CODE_HOST_CREDS_FILE:'file',CLAUDE_CONFIG_DIR:'old',CLAUDE_CODE_USE_BEDROCK:'1'},'/runtime');assert.deepEqual(env,{PATH:'/bin',CLAUDE_CONFIG_DIR:'/runtime'})});
test('terminal output redacts subscription credentials',()=>{assert.equal(redact('token sk-ant-oat01-abcd_123-X'),'token [credential hidden]')});
