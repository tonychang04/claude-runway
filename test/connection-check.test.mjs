import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyCheck} from '../lib/connection-check.mjs';
test('connection checks require an actual successful marker',()=>{
 assert.equal(classifyCheck(JSON.stringify({subtype:'success',is_error:false,result:'RUNWAY_OK'})).ok,true);
 assert.equal(classifyCheck(JSON.stringify({subtype:'success',is_error:true,result:'RUNWAY_OK'})).ok,false);
 assert.equal(classifyCheck('not JSON').ok,false);
 assert.equal(classifyCheck(JSON.stringify({is_error:true,result:'401 Invalid bearer token'})).expired,true);
 const r=classifyCheck(JSON.stringify({is_error:true,result:"You've hit your session limit"}));assert.equal(r.ok,false);assert.match(r.detail,/limit/);
});
