# Orbit

The local dashboard is now branded Orbit. Existing data paths, the Switchboard service label, and tmux socket names remain unchanged to preserve running sessions.

## Accounts

Connect account opens two enrollment options: official Claude Code `setup-token` browser flow, or pasting an already generated setup token. Repeat for each account; there is no two-account cap. Labels are user-entered, not verified email identities. API keys and cloud-provider credentials are not implemented.

Usage refresh runs every 90 seconds, with per-account backoff when the endpoint throttles. All accounts are tracked, including accounts disabled for automatic selection. The UI distinguishes last-known/stale usage and credential expiration. Usage refresh does not renew authentication. Setup tokens can expire or be revoked; unknown expiration is displayed as unknown, and authentication failures require reconnecting. No automatic token-renewal implementation is claimed.

## Sessions

Managed sessions expose terminal viewing and a Copy attach command for local terminals. Other native Claude processes owned by the current macOS user are discovered every 15 seconds via process names, parent IDs, and terminal IDs only. Helper processes and managed descendants are excluded. This is best-effort process discovery, not a complete historical conversation list; Node wrappers, remote/cloud sessions and certain desktop helpers may not be identified. External processes are read-only and cannot be automatically adopted or switched.

## Verification

Unit tests cover process filtering; browser tests cover six simulated accounts, expiry warnings, external process rows, enrollment options and mobile overflow. The six-account browser fixture does not connect real accounts. Completing real browser enrollment and recovering from real quota exhaustion still require live verification.
