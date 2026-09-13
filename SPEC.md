# Runway 0.2 specification
Status: experimental native-session launcher. Replaces the 0.1 credential broker.

## Ownership boundary

Official Claude Code owns browser sign-in, account authorization, credentials,
Keychain/file storage, refresh and inference. Runway runs the unmodified binary.
Runway does not collect passwords, authorization codes or tokens; no provider
OAuth/profile/usage endpoints are called. No credential file is read or written.

Runway owns only profile/session metadata, its own local dashboard access key,
terminal launcher scripts, and optional non-secret status-line telemetry.
Claude may write its own credential files within each profile directory.

## Profiles

Create a random UUID profile and an empty directory under native-profiles.
Names are local nicknames. Auth metadata is initially unknown.
Connect opens official `claude` in a native tmux terminal.
Runway never captures the terminal output or proxies login input.

Check Claude status is an explicit action running `claude auth status --json`.
Whitelist loggedIn, email, authMethod and subscriptionType, plus observation time.
Do not expose raw native output. Status does not prove a successful model request.
Never poll auth in the background, avoiding repeated native Keychain prompts.

A running work session blocks starting another login terminal for its profile.
Users may renew directly in their existing native Claude terminal.

## Sessions

Launch requires a registered profile and an existing absolute workspace folder.
Set CLAUDE_CONFIG_DIR explicitly for each process; remove competing inherited
provider credentials from the launch environment. Native auth methods, trust and
permission handling remain intact. Do not patch the binary or add bypass flags.

Each profile has its own configuration and Claude-managed login. Sessions sharing
a profile share that native configuration; different profiles remain separate.
No automatic rotation or cross-profile process switching is implemented.

Open Terminal attaches via a local mode-0700 launcher containing only tmux arguments.
Users type messages and login codes directly into Claude. There is no web terminal,
screen capture API, injected continuation, or remotely accessible token field.
Runway refreshes process liveness every ten seconds and reads no conversations.

A status-line command supplied at launch can receive documented rate_limits
fields. Store only five_hour/seven_day percentages and timestamps, keyed by
session UUID. Present observation time; unknown values are not zero.
Authoritative current usage remains Claude's own /usage UI.

## HTTP and storage

Bind 127.0.0.1 only; exact Host and Origin validation; random API bearer key;
JSON-only bounded POST bodies; no CORS or public hosting support.
Endpoints: status, profiles, profiles/check, profiles/login, sessions,
sessions/open, refresh. Old credential and terminal proxy endpoints return 410.

State: native-state.json, native-profiles/, native-telemetry/, terminal-launchers/.
Never read an old vault, vault key or Claude credential file. Read old state.json
only for an upgrade notice and legacy-session metadata. Preserve all old data and
terminals. A new tmux socket separates native sessions from the retired runtime.

## Testing and release criteria

Unit tests: metadata-only profile creation, status sanitization, signed-out/error
handling, isolated launch environments, native login arguments, busy-profile guard
and legacy preservation. Browser tests use fixtures and cover the native workflow.
Live verification must demonstrate native login, status, a real project response
and /usage on each intended subscription. Owner interaction is required.
No test may silently import credentials or change an existing work session.

No promise of perpetual login, ban immunity, complete process discovery, automatic
failover, or cloud access. Provider compatibility and terms must be reviewed as
they change. Official ownership reduces credential handling; it is not a blanket
provider approval of every workflow.
