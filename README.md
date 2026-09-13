# Runway
A local launcher and dashboard for **unmodified, official Claude Code**.

Claude owns sign-in, credential storage and renewal. Runway creates isolated
profiles and opens native terminals. It does not accept tokens, copy credentials,
refresh OAuth tokens, proxy inference, or rotate accounts.

**Version 0.2 is an architecture change, not a finished automatic load balancer.**
A profile is a separate Claude configuration—not a verified identity until
official Claude reports one. Different profiles can sign in to the same account.

## Quick start

Requires macOS, Node.js 22+, tmux and official Claude Code installed separately.
Do not run this dashboard on a public server.

```sh
git clone https://github.com/tonychang04/claude-runway.git
cd claude-runway
npm ci
npm start
# In another terminal:
node cli.mjs open
```

The server binds only to http://127.0.0.1:43127. The CLI opens its private access
link. That link controls native terminal launching; never share it.

## Connect your subscription

1. Click **Connect in Claude Code**.
2. Runway opens Terminal running official `claude auth login`, with a separate
   `CLAUDE_CONFIG_DIR`. Claude opens its own browser authentication flow.
3. Complete sign-in directly with Claude. Any code goes in the native terminal,
   never the Runway dashboard.
4. Click **Check Claude status** to request official `claude auth status --json`.
   Only the reported login state, email, method and subscription type are retained.
5. Click **Open project**, choose an absolute project folder and model, and work
   in the native Claude terminal.

Repeat to create another isolated profile. Use **Open Terminal** or **Copy terminal
command** to reattach. A status result is not an inference test or a quota guarantee.

On macOS, official Claude may ask for Keychain permission. Runway does not read
Keychain or suppress native prompts. Sign-in and status checks are explicit user
actions, not background credential probes.

For an existing profile with running work, use `/login` in its Claude terminal if
renewal is needed; Runway does not start a competing login for that profile.
To use a different account without changing that work, create another profile.

## Usage and limits

Type `/usage` in your native Claude terminal for current quota. Runway does not
call private Anthropic usage/profile endpoints. Work sessions may report documented
status-line quota fields, displayed with observation time when available.
Missing quota stays missing. Project settings or CLI changes may affect telemetry.

Claude manages its own credential lifecycle. This is **not a guarantee that
sign-in never expires**; follow Claude's instructions when reauthentication is needed.

Not implemented: automatic rotation, hot-swapping a running session's identity,
cross-profile conversation transfer, cloud control, and verified unattended
recovery from quota exhaustion. Runway does not bypass plan limits.

## Upgrade from the token-based prototype

Restart the dashboard service to stop the old polling/rotation code. Version 0.2
uses a new `native-state.json` and a different tmux socket. Old credentials are
not imported or read; the old vault, configuration and terminals remain on disk
and are not deleted. Their account metadata is used only to show an upgrade notice.

Old browser token, switching, sign-in proxy and terminal-input endpoints return
HTTP 410. Refresh the browser after upgrading. The old code is recoverable in Git
history; its previous switching tests are not evidence for this native model.

Do not delete the legacy runtime while an old terminal is still using it. Review
and revoke old credentials deliberately when you are ready to retire that setup.

## Local service and configuration

`node install-service.mjs` prepares a LaunchAgent. Stop a foreground server before
`node install-service.mjs --install`. The installer refuses to overwrite an
existing service. It retains the legacy service name `local.switchboard.manager`.

Configuration: `SWITCHBOARD_DATA` (default .state), `SWITCHBOARD_CLAUDE` (CLI path),
`SWITCHBOARD_TMUX` (tmux executable), `PORT` (default 43127).
Keep custom state directories outside the repository. These old variable names
are retained for installation compatibility.

From a project directory:
`node /absolute/path/to/cli.mjs launch <profile-id> [sonnet|opus|haiku]`.
Profile IDs are available via `node cli.mjs status`.

## Development

`npm test` runs isolated tests without real credentials.
`npx playwright test test/native-dashboard.spec.mjs --workers=1` checks the UI
with synthetic API responses and installed Chrome. Start the dashboard first.

See [SPEC.md](SPEC.md), [SECURITY.md](SECURITY.md), [VERIFICATION.md](VERIFICATION.md)
and [CONTRIBUTING.md](CONTRIBUTING.md). MIT licensed; not affiliated with Anthropic.
