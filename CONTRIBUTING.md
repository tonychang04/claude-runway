# Contributing

Use Node.js 22+, macOS, tmux and official Claude Code for local integration work.
Unit tests run without Claude credentials or a dashboard:

```sh
npm ci
npm test
```

For dashboard development, run `npm start` then `node cli.mjs open`. Use a separate
`SWITCHBOARD_DATA` directory outside the repository to isolate experiments. Never
test failover or terminal control against someone else's active work.

Browser checks use installed Google Chrome and a running server on port 43127:

```sh
npx playwright test test/dashboard-six.spec.mjs --workers=1
```

This test mocks accounts. `test/dashboard.spec.mjs` additionally requires a real
connected account and managed session. `test/native-switch.spec.mjs` sends real
inference requests and changes the selected account; consult README.md and obtain
explicit approval before setting `SWITCHBOARD_LIVE_TEST=1`.

Keep patches focused, add tests for behavior changes, and update SPEC.md when
contracts change. Preserve credential isolation, native permission checks, safe
busy-session handling and honest unknown/stale UI states. Do not add shell
interpolation, secret-bearing logs, or credential-returning API responses.

Before committing, inspect staged files and confirm runtime state is excluded.
Submit synthetic fixtures, never personal-account screenshots or transcripts.
