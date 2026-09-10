# Security

Runway is experimental local software. Do not expose its HTTP listener through a
public tunnel, reverse proxy or shared network. The private dashboard link grants
control over managed terminals and accounts; treat it as a credential.

Never commit `.state/`, custom state directories, environment files, tokens,
enrollment screens, transcripts, access links or real-account screenshots.
If using `SWITCHBOARD_DATA`, keep that directory outside the repository.

The vault uses AES-256-GCM with a local mode-0600 key. The key is stored on the
same Mac. Managed Claude requires a mode-0600 plaintext credential file. This does
not defend against malicious software running as the same user, full-disk access,
or an attacker who obtains both vault and key. Backups may contain credentials.

The manager does not access Keychain. Native Claude enrollment may use Keychain.
Credentials can expire or be revoked; there is no automatic renewal guarantee.
Usage tracking relies partly on an undocumented endpoint.

For a suspected vulnerability, contact the repository maintainer privately before
posting details. When hosted on GitHub, use private vulnerability reporting if
enabled. Do not post credentials, access links, transcripts or raw state in issues.
If a token leaks, revoke it with the provider and reconnect; deleting it from Git
does not make an exposed credential safe.
