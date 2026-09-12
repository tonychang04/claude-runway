import {execFileSync} from 'node:child_process';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024});
const objects=git('rev-list','--objects','--all').trim().split('\n');
const forbiddenPath=/(^|\/)(\.state|node_modules|test-results)(\/|$)|(^|\/)\.env($|\.)|dashboard.*\.png$/;
const patterns=[/sk-ant-[A-Za-z0-9_-]{35,}/,/gh[pousr]_[A-Za-z0-9]{30,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/[#?]access=[a-f0-9]{32,}/,/\/Users\/gary\//,/tony\.chang[^\s]*@insforge\.dev/];
let failures=0,blobs=0;
for(const line of objects){const [id,...parts]=line.split(' '),name=parts.join(' ');if(git('cat-file','-t',id).trim()!=='blob')continue;blobs++;const text=git('cat-file','blob',id);if(forbiddenPath.test(name)||patterns.some(p=>p.test(text))){console.error('Review required in historical file: '+name);failures++}}
if(failures)process.exitCode=1;else console.log(`Checked ${blobs} historical blobs: no matching credentials, private runtime paths or personal account labels. This is a targeted scan, not a full security audit.`);
