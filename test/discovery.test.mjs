import test from 'node:test';
import assert from 'node:assert/strict';
import {parseProcesses,externalProcesses} from '../lib/discovery.mjs';
test('discovery excludes managed descendants, helpers and unrelated processes',()=>{
 const processes=parseProcesses('10 1 ttys001 /bin/zsh\n11 10 ttys001 claude\n12 11 ttys001 /Users/a/.local/share/claude/versions/2.1.268\n20 1 ?? /bin/zsh\n21 20 ?? claude\n30 1 ?? claude bg-spare\n40 1 ?? node\n50 1 ?? /Users/a/.local/bin/claude');
 assert.deepEqual(externalProcesses(processes,new Set([20])),[{pid:11,tty:'ttys001',managed:false},{pid:50,tty:null,managed:false}]);
});
