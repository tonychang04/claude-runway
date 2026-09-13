# Security
Runway 0.2 is local-only experimental software. Never publish its access link,
expose the HTTP listener through a tunnel, or share its data directory.

Official Claude owns authentication. Runway no longer reads Keychain, accepts
tokens, copies credential files, invokes OAuth refresh, proxies sign-in codes or
captures native terminal content. Explicit Claude commands may trigger native
Keychain prompts. Profile directories can contain credentials written by Claude.

Runway's dashboard key grants profile and native-terminal launching access. State
is protected by local file permissions, not against malware running as the same OS
user. The old prototype vault may still exist on upgraded installations: it is
unused, not automatically deleted or revoked. Backups may include old and native
credentials. Retire them deliberately without deleting active sessions.

Never commit .state, custom state directories, private links, credentials or
personal transcripts. Run scripts/audit-history.mjs before publishing; its targeted
patterns are not a complete security audit. Report vulnerabilities privately to
the maintainer, never with live credentials attached.

See Anthropic's current authentication and legal/compliance documentation.
Native sign-in ownership does not guarantee that every integration is approved.
