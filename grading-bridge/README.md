# KevinOS loopback Grading Bridge

Packet fingerprint: `grading-machine-v1-a8b2826f7b93a83d7656`

This optional, dependency-free Node companion binds to `127.0.0.1:8765` only. It has no provider adapter and performs no model/provider/network transport. It supplies strict origin/Host checks, short-lived bearer sessions, bounded local parsing, exact-schema local-output validation, new feedback PDF generation, content-free logs, and explicit temporary-session deletion.

Run locally only after reviewing the origin allowlist:

```sh
GRADING_BRIDGE_ORIGINS=http://127.0.0.1:4173 node grading-bridge/bridge.js
```

Supported locally:

- TXT, Markdown, CSV, and HTML text extraction;
- bounded DOCX extraction from a validated ZIP container;
- conservative basic PDF text extraction with stable locations;
- PNG/JPEG validation with an explicit unreadable result when local OCR is unavailable;
- new one-page PDF feedback sidecars.

Rejected safely: non-loopback bind, DNS-rebinding Host, unapproved Origin, expired/missing session, traversal names, executables, standalone archives, macro-enabled Office files, archive bombs, corrupt/password-protected PDF, malformed DOCX, corrupt images, unsupported compression, oversize bodies/files, and overlong render input.

Limitations: the basic PDF parser is intentionally conservative and does not claim full PDF layout fidelity. Image/scanned-document OCR remains unavailable unless a future separately reviewed local-only OCR packet is approved. No live local-model adapter is activated; `/validate-local-output` validates synthetic/mock output only.
