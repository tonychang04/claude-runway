import {test,expect} from '@playwright/test';
test.use({channel:'chrome'});
test('native profile journey never asks for a token or proxies sign-in',async({page})=>{
 const profiles=[],sessions=[];const calls=[];
 await page.route('**/api/**',async route=>{const u=new URL(route.request().url()),body=route.request().postDataJSON();calls.push(u.pathname);let result={ok:true};
 if(u.pathname==='/api/status')result={mode:'native',profiles,sessions,events:[],legacy:{accounts:2},localProcesses:{processes:[]}};
 if(u.pathname==='/api/profiles'){result={id:'profile',name:'Claude profile 1',auth:null};profiles.push(result)}
 if(u.pathname==='/api/profiles/login'){result={id:'login',profileId:'profile',kind:'login',running:true,attach:'tmux attach',cwd:'/test'};sessions.push(result)}
 if(u.pathname==='/api/profiles/check'){profiles[0].auth={loggedIn:true,email:'verified@example.com',checkedAt:new Date().toISOString()};result=profiles[0].auth}
 await route.fulfill({json:result});});
 await page.goto('http://127.0.0.1:43127');await page.getByRole('button',{name:'Connect in Claude Code'}).click();await expect(page.locator('#profiles')).toContainText('Claude profile 1');await expect(page.locator('#notice')).toContainText('Terminal');
 await page.getByRole('button',{name:'Check Claude status'}).click();await expect(page.locator('#profiles')).toContainText('verified@example.com');
 expect(calls).toContain('/api/sessions/open');expect(calls.some(c=>/accounts|switch|\/login$/.test(c)&&c!=='/api/profiles/login')).toBe(false);
 await expect(page.locator('input[type=password]')).toHaveCount(0);await expect(page.getByText('Automatic account rotation', {exact:false})).toBeVisible();
 await page.setViewportSize({width:390,height:844});await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);
});
