# Runway

**Keep your flow.** A local control panel for your Claude Code accounts and sessions.

Experimental, macOS-first software—not an official Anthropic product. Live
credential switching has been demonstrated on Claude Code 2.1.268. Recovery from
real quota exhaustion is not verified; automatic credential renewal is not implemented.

This is an open-source experimental release, not a production-ready subscription
load balancer. Unknown quota is never treated as available quota.

A local dashboard for your own accounts and official Claude Code sessions. No
inference proxy, no clauth runtime, no writes to your default Claude login.

## Start

Requires Node.js 22+, tmux, and official Claude Code. Tested on macOS with Claude
Code 2.1.268. No npm runtime dependencies.

```sh
# Clone your repository, then:
git clone https://github.com/tonychang04/claude-runway.git
cd claude-runway
npm ci
npm start
# In another terminal:
node cli.mjs open
```

`npm ci` installs development tools; the server itself has no npm runtime dependencies.
Keep the repository in a stable location if you install the background service.

## What you get

- A responsive account dashboard, tested with six simulated accounts.
- Official setup-token enrollment or manual token entry, plus reconnect controls.
- Periodic usage tracking, last-observed timestamps and expiry warnings.
- Shared account selection for managed sessions; optional automatic switching.
- Managed terminal access and best-effort read-only discovery of other local Claude processes.

Other local processes are not automatically adopted. API-key, Bedrock, Vertex,
and other provider authentication methods are not implemented here. Usage polling
does not renew credentials, and no credential is guaranteed never to expire.

## Project documentation

- [Specification](SPEC.md): behavior, architecture, constraints and acceptance criteria.
- [Verification](VERIFICATION.md): observed results and remaining live-test gaps.
- [Security](SECURITY.md): storage model, boundaries and safe reporting.
- [Contributing](CONTRIBUTING.md): local development and test guidance.
- [Runway release notes](ORBIT.md): current dashboard behavior.

The source lives in `lib/` (account/session logic), `public/` (dashboard),
`server.mjs` (local API), and `cli.mjs` (terminal entry point).

The dashboard listens only on `127.0.0.1:43127`. Its private access link is opened
by the CLI. API calls require a random access key; foreign origins and unexpected
Host headers are rejected. Do not expose it through a public tunnel.

## Connect accounts and work

Click **Connect account → Continue with Claude**, then sign in with the account
you want to add. There is no email field in Runway: the account is chosen on
Claude’s site. Setup tokens do not expose a verified email, so cards use local
nicknames, not verified identities. Runway opens the official sign-in page and
checks the credential when authorization finishes. As disclosed before continuing,
that check sends one small Haiku request and consumes a little subscription quota.
Click **Use this account** after the check passes; existing unmanaged terminals
are not switched. If popups are blocked, use the sign-in link in the dialog.

Token pasting and authorization-code entry remain available under advanced/details
sections. No custom OAuth implementation is used. Enrollment still needs human
authentication; revoked or expired tokens need renewal. Sign-in must not be run
inside the shared runtime directory.

Select an account, then start a session with its workspace directory. Use the
dashboard terminal or copy its tmux attach command to your terminal. Normal
Claude workspace trust and permission prompts remain in place.

### Connected, but quota unavailable?

Saving a credential, making a Claude request, and reading quota are three different
checks. Enrollment includes a connection check. Later, click **Test connection**
on an account card to send another small Haiku request through official
Claude in an isolated configuration. This consumes a little quota, requires your
confirmation, and does not change the account used by existing sessions.

If the connection test passes but quota is unavailable, the token can make requests
while the usage endpoint may reject or throttle it. You can manually select it
with **Switch here** and start a managed session. Automatic selection requires
recent quota and remains disabled for that account until quota is available.
Adding an account alone does not select it or attach your existing terminals.

To replace a token for an existing account, choose **Reconnect** on its card,
not Connect account. Different tokens can have identical user-entered labels.

All sessions launched here share `.state/runtime` as `CLAUDE_CONFIG_DIR`, even
when they work in different project directories. Changing the selected account
updates their shared credential file. The CLI binary and process are not replaced.
Normal sessions launched elsewhere are not adopted or changed. `/login` inside
a managed terminal can create a Keychain entry that overrides the file; connect
accounts through the dashboard instead. The browser input prevents `/login` and
`/logout`, but an attached native terminal remains under the user's control.

Enable automatic switching to select a healthy, enabled account with recent quota
when the active account reaches the threshold. Switching waits for managed
responses to finish. Synthetic CLI limit errors mark the current account
unavailable; after switching and a 35-second reload allowance, the manager sends
one continuation only to an idle, empty prompt that was stopped by such an error.
This does not guarantee recovery from every possible error banner.

Usage is polled every 90 seconds with backoff. Supported status-line quota fields
also update the dashboard after responses. Some setup tokens cannot query the
usage endpoint: those accounts show unavailable usage until native session
telemetry arrives. Unknown or stale quota is never presented as zero and never
qualifies for automatic selection. Usage polling depends on an undocumented
provider endpoint and may break; native status-line data is the documented fallback.

## Storage and lifecycle

The vault uses AES-256-GCM and a mode-0600 key file in a mode-0700 state directory.
This protects against accidental disclosure in account metadata, not another
process running as the same OS user. The active CLI credential is necessarily a
mode-0600 plaintext file. Refresh tokens are not accepted or rotated. Setup tokens
avoid frequent refresh-token synchronization, but require renewal when revoked
or expired. Short-lived imported access tokens are only suitable for testing.

No Keychain reads/writes are made by the manager. Official Claude may use Keychain
during enrollment; the manager never extracts its contents. The verified shared
runtime has no matching Keychain item, so Claude falls back to the credential file.

Stopping the dashboard leaves tmux sessions running. Automatic monitoring requires
the manager process to run; a LaunchAgent can keep it alive across user logins.
Run `node install-service.mjs` to prepare its configuration, then stop the foreground
server and run `node install-service.mjs --install` to install it. This creates only
`~/Library/LaunchAgents/local.switchboard.manager.plist` and refuses to overwrite an
existing service. Logs are in `.state/service.log` and `.state/service.error.log`.
Local monitoring pauses while the Mac sleeps. Existing Claude settings/plugins are
not copied; project settings still apply and can override managed hooks. Never use
`--safe-mode` for managed sessions when relying on activity and quota hooks.

## Verification

`npm test` checks account selection, stale-data handling, vault integrity, and
credential isolation. See [VERIFICATION.md](VERIFICATION.md) for the real upstream
interactive switching experiment and its precise limitations. A real five-hour
exhaustion has not been induced. Public source availability is not a statement of
provider approval; users remain subject to their subscription terms.

## Configuration

`SWITCHBOARD_DATA`: state directory (default `.state` beside the source).
`SWITCHBOARD_CLAUDE`: absolute path to official Claude Code.
`SWITCHBOARD_TMUX`: tmux executable (default PATH lookup).
`PORT`: localhost port (default 43127).

The source is MIT licensed. Never publish `.state`, access links, credentials,
transcripts, or enrollment output.

Browser checks: `npx playwright test test/dashboard.spec.mjs --workers=1` requires
Chrome and a running dashboard with a connected account and session. The real
native switching test is deliberately opt-in (`SWITCHBOARD_LIVE_TEST=1`): it expects
two connected healthy accounts and a test session containing a JavaScript `label`
example with value `MAPLE-482`. It switches the selected account and sends one real
prompt. Do not run it against an unrelated work session.

The six-account layout test uses fixtures, not real credentials:
`npx playwright test test/dashboard-six.spec.mjs --workers=1`.
CI runs only the isolated unit tests; it does not sign in or make inference requests.

### Compatibility names

Runway was initially called Switchboard. `SWITCHBOARD_*` environment variables,
the `local.switchboard.manager` LaunchAgent and existing tmux socket names remain
unchanged to preserve current installations. There is no globally installed
`orbit` command yet; use `node /absolute/path/to/cli.mjs launch` from your project
directory, or start a session in the dashboard.
