import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const dir=import.meta.dirname;
const label='local.switchboard.manager';
const destination=path.join(os.homedir(),'Library/LaunchAgents',label+'.plist');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const state=path.join(dir,'.state');fs.mkdirSync(state,{recursive:true,mode:0o700});
const plist=`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${escape(process.execPath)}</string><string>${escape(path.join(dir,'server.mjs'))}</string></array>
<key>WorkingDirectory</key><string>${escape(dir)}</string>
<key>EnvironmentVariables</key><dict><key>PATH</key><string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string></dict>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>15</integer>
<key>StandardOutPath</key><string>${escape(path.join(state,'service.log'))}</string>
<key>StandardErrorPath</key><string>${escape(path.join(state,'service.error.log'))}</string>
</dict></plist>`;
if(!process.argv.includes('--install')){const preview=path.join(state,'service-preview.plist');fs.writeFileSync(preview,plist,{mode:0o600});console.log('Service prepared. Install with: node install-service.mjs --install');process.exit(0)}
if(fs.existsSync(destination))throw Error('Service already exists; refusing to overwrite it');
fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,plist,{mode:0o600});
const r=spawnSync('launchctl',['bootstrap',`gui/${process.getuid()}`,destination],{encoding:'utf8'});
if(r.status!==0)throw Error('LaunchAgent was written but could not start: '+r.stderr);
console.log('Switchboard starts automatically at login. Service: '+label);
