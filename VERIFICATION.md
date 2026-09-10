# Native interactive switch verification

Tested on macOS, 2026-09-10, official Claude Code 2.1.268, Haiku 4.5.

Interactive TUI in tmux; safe mode; no inference proxy; no environment token;
isolated `CLAUDE_CONFIG_DIR` with a mode-0600 `.credentials.json` file. No Keychain
item was created or changed. Test reused two existing unexpired access tokens,
without copying their refresh tokens or running clauth.

| Step | Observed result |
| --- | --- |
| Account A: JavaScript label example | Successful response containing ORBIT-739 |
| Replace access token with invalid control, wait over 30 seconds | CLI displayed HTTP 401 Invalid bearer token |
| Replace with account B's access token, wait over 30 seconds | Successful response recalling ORBIT-739 |

All steps retained the same pane PID and conversation ID.
Machine-specific process, conversation and upstream message identifiers are
omitted from this public document.
The temporary credential file and test tmux server were removed afterward.

This establishes credential reload and context preservation for this configuration.
It does not establish the minimum reload delay, independently audit billing,
prove failover from a real five-hour exhaustion, or establish support on future CLI versions.
The earlier Keychain-backed interactive test did not establish switching and caused
access prompts; this application does not use that mechanism.

## Dashboard end-to-end result

The running local application was then tested with Chrome/Playwright against
official Claude Code 2.1.268 in normal interactive mode (not safe mode). Two saved
access tokens were imported into the local vault without refresh tokens.

- Selected account A and launched a managed tmux session through the HTTP API.
- Accepted normal workspace trust and declined an unrelated inherited MCP server.
- Received a real response containing the JavaScript label MAPLE-482.
- Native status-line telemetry populated 5-hour and 7-day usage (0% / 12%).
- Clicked account B's Switch button in the browser, waited 35 seconds, and sent
  a continuation through the browser terminal.
- Received `SWITCH-VERIFIED: MAPLE-482` with the same native process and session ID.
- Browser test passed in 51.4 seconds. Local `.state/live-verification.json` records
  the PID and timestamp without credentials.

Ten automated logic tests cover stale/unknown quota, weekly exhaustion, encrypted
vault integrity, competing authentication removal, busy-session deferral, and
automatic switching on a simulated synthetic CLI limit error. Two browser tests
passed for rendering, responsive layout, and unauthorized/cross-origin rejection.

Not live-verified: an actual five-hour exhaustion, long-term token expiry/revocation,
completed browser sign-in for a newly added account, or every Claude permission/error
screen. Official sign-in still requires the account owner. Imported short-lived
credentials are temporary; connect setup tokens for ongoing use.

## Orbit dashboard update

After the redesign, 12 isolated unit tests and three browser tests passed. Added
coverage includes process discovery filtering, tracking accounts disabled for
switching, six simulated account cards, expiration warnings, connection methods,
and mobile overflow. Live discovery identified a managed session and two external
native Claude processes on the development Mac. These are observations on that
machine, not a guarantee of discovering every Claude surface or historical session.

## New setup-token connection check

A newly enrolled token that returned HTTP 403 from the usage endpoint completed
an actual isolated Haiku request with the expected `RUNWAY_OK` marker. The test
used file-based credentials, disabled tools and customizations, and left the
existing managed session and selected account unchanged. Its temporary test
directory was removed. This demonstrates request access for that token, not
working quota lookup or automatic selection when quota is unavailable.
