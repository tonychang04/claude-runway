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
 await page.goto('http://127.0.0.1:43127');await page.locator('#connect').click();await expect(page.getByRole('dialog')).toContainText('Come back here');expect(profiles).toHaveLength(0);await page.getByRole('button',{name:'Open Claude sign-in'}).click();await expect(page.locator('#profiles')).toContainText('Finish connecting');
 await page.getByRole('button',{name:'I’ve signed in'}).click();await expect(page.locator('#profiles')).toContainText('verified@example.com');await expect(page.locator('#connected-email')).toHaveText('verified@example.com');await page.getByRole('button',{name:'Done',exact:true}).click();
 expect(calls).toContain('/api/sessions/open');expect(calls.some(c=>/accounts|switch|\/login$/.test(c)&&c!=='/api/profiles/login')).toBe(false);
 await expect(page.locator('input[type=password]')).toHaveCount(0);await expect(page.getByText('Automatic account rotation', {exact:false})).toBeVisible();
 await page.setViewportSize({width:390,height:844});await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);
});
test('accounts show email plan and honest missing usage; diagnostics are collapsed',async({page})=>{
 await page.route('**/api/status',route=>route.fulfill({json:{profiles:[{id:'a',name:'Personal',auth:{loggedIn:true,email:'person@example.com',subscriptionType:'max',checkedAt:new Date().toISOString()}},{id:'b',name:'Work',auth:{loggedIn:false}}],sessions:[],events:[],legacy:{accounts:3},localProcesses:{processes:[]}}}));
 await page.goto('http://127.0.0.1:43127');await expect(page.locator('#profiles')).toContainText('person@example.com');await expect(page.locator('#profiles')).toContainText('max');await expect(page.locator('#profile-count')).toHaveText('1 connected · 1 pending');await expect(page.locator('#profiles')).toContainText('Not reported to this dashboard');await expect(page.locator('#migration')).toBeHidden();await expect(page.getByRole('button',{name:'Continue setup'})).toBeVisible();
});
