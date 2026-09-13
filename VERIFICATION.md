# Runway 0.2 verification
The credential-swapping prototype was retired. Its historical tests and results
remain in Git history; they are not evidence for the native-ownership architecture.

## Automated coverage
Native-manager unit tests verify metadata-only profile creation, whitelisted
official status fields, signed-out/error handling, native login commands,
per-profile configuration isolation, running-work guards and old-state preservation.
Browser tests exercise the native profile journey using synthetic responses.

Current results: 13 unit tests and two native-dashboard browser tests passed.
Live local API checks returned HTTP 410 for retired accounts, accounts/verify,
switch, login and input routes. A real isolated profile and official onboarding
terminal were created and opened on the development Mac. No credential was
imported. Completion of the owner's sign-in and a real work response are pending.

## Required live acceptance
- Open official Claude login in a new isolated native profile.
- Account owner completes sign-in in Claude's own browser/terminal flow.
- Explicit Claude auth status reports the expected identity when available.
- A new work session produces a real response and shows native /usage.
- Repeat for another subscription; existing sessions remain unchanged.

Until these steps are completed, do not claim full end-to-end functionality.
Credential refresh behavior belongs to Claude and still needs longitudinal
observation; no perpetual-login guarantee is made.

## Removed behaviors

## Account-first UI check

Official status reported one signed-in Max account with an email and one signed-out
profile. The account-first UI displays these separately. An official /usage
terminal was opened, but native first-run setup blocked reaching the quota view.
New enrollment now launches full interactive Claude onboarding instead of only
auth login. Quota display and a real work response remain pending native setup.

## Removed behaviors
No token imports, shared-file swapping, direct usage/profile polling, automatic
account rotation, injected resume prompts, or web-proxied authentication.
Legacy account data and old tmux sessions are preserved and not controlled.
