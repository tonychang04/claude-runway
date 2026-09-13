# Contributing
Use Node.js 22+. Native integration development requires macOS, tmux and a
separately installed official Claude Code binary.

Run npm ci and npm test. Unit tests require no accounts or real inference.
For browser tests, run npm start and then:
`npx playwright test test/native-dashboard.spec.mjs --workers=1`.
These use synthetic API responses; they do not establish successful provider login.

The 0.2 ownership boundary is mandatory: never add credential import/export,
Keychain scraping, direct OAuth refresh, provider usage polling or web login-code
collection. Test fixtures must not contain real user data.

Use a separate SWITCHBOARD_DATA directory for live experiments. Never test against
unrelated work sessions. Native sign-in requires the owner's participation; never
claim end-to-end success from UI fixtures alone.

Update SPEC.md and VERIFICATION.md with behavior changes. Run git diff --check,
inspect staged files, and keep all Claude configuration/state out of the repository.
