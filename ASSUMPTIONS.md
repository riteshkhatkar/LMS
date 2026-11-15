# ASSUMPTIONS.md — Open Decisions Log
Last updated: 2026-11-14 (Phase 4 Final Verification & Review Completed)

## A1 — Nodal Officers vs Naval Officers [RESOLVED — Client Confirmed]
**Status:** CONFIRMED AS NAVAL OFFICERS.
**Implementation:** Implemented as "Naval Officers" learner group across all branding, registration, course filters, and training modules.
**Role Model:** Naval Officer is a learner group classification under the `LEARNER` role (preserving the 3-role model: Learner, Instructor, Admin).
**Deployment Readiness:** Architecture maintains readiness for offline / restricted-network deployment for naval training environments without external CDN dependencies.
**Location:** `lib/brand.ts` → `learnerGroups.NAVAL_OFFICER` and `prisma/schema.prisma` → `LearnerGroup` enum.

## A2 — Main Application for Onboarding [RESOLVED for Phase 7 & 8]
**Status:** RESOLVED WITH STRUCTURED DEMONSTRATION PROGRAMMES.
**Implementation:** Implemented in Phase 7 via `TrainingProgramme` models orchestrating constituent courses with guided walkthrough steps (`TrainingStep`) and explicit `DEMO` verification badges carrying mandatory disclaimers: *"Demonstration content — pending application-specific verification"*.
**Location:** `prisma/schema.prisma`, `components/player/GuidedTrainingSteps.tsx`, `app/[locale]/learn/training/page.tsx`.

## A3 — Grading Range Gaps & Versioned Rules [RESOLVED for Phase 3]
**Gap:** Score ranges 60%–69.99% and 75.01%–90% had no named grade in the brief. Only Grade B (70–75) and Grade A (>90) were confirmed.
**Phase 3 Implementation:**
1. Integer arithmetic (`Math.round(score * 100)`) eliminates IEEE-754 precision issues. Strict `>60%` pass boundary implemented (60.00% is FAIL, 60.01% is PASS).
2. Ranges 60–69.99% and 75.01–90% are marked `provisional: true` and labeled "Pass" with an amber visual badge in the UI.
3. The Admin Grading Rule Manager (`/admin`) allows administrators to adjust thresholds and publish new versioned rules per course without altering historical attempt grades.
4. Historical quiz attempts lock in the exact `gradingRuleVersion` under which they were submitted.
**Location:** `lib/grading.ts`, `lib/assessment/scoring.ts`, `components/admin/GradingRuleManager.tsx`.

## A4 — Blockchain / Ledger [RESOLVED for Phase 4 — Dual Adapter Architecture]
**Implementation:**
1. **Adapter A (MockLedger — Default for Local/Demo):** Persistent SHA-256 hash-chained block storage with genesis block in PostgreSQL (`AnchorBatch` & `CertificateLedgerRecord`). Guarantees 100% offline & zero-gas execution with explicit user disclosure: *"Demo verification — MockLedger mode. Not anchored on a public blockchain."*
2. **Adapter B (EVM / Polygon Amoy Testnet & Local EVM):** Production-ready smart contract `contracts/CertificateRegistry.sol` (OpenZeppelin AccessControl) with `ethers.js` v6 adapter (`lib/certification/ledger/evm-adapter.ts`). Supports Polygon Amoy (Chain ID 80002) and local Hardhat EVM (Chain ID 31337) via `LEDGER_MODE=public_testnet` or `LEDGER_MODE=local_evm`.
3. **Zero PII on Ledger:** Only domain-separated SHA-256 salted commitments (`commitmentHash = HMAC-SHA256(recipientSalt, credentialHash)`) are anchored on-chain. Recipient identity, grades, and private links remain strictly off-chain.
**Location:** `lib/certification/ledger/`, `contracts/CertificateRegistry.sol`, `prisma/schema.prisma`.

## A5 — Certificate Issuer & Production Domain [RESOLVED for Phase 4]
**Status:** CONFIRMED AS ORELSE.
**Implementation:**
- **Issuer Name:** ORELSE (`https://www.orelse.ai`)
- **Display Name:** ORELSE
- **Programme Name:** ORELSE Learning Certification
- **Issuer ID:** `ORELSE-DEMO-ISSUER-001`
- **Certificate ID Prefix:** `LLMS-DEMO`
- **Official Branding:** High-resolution transparent vector/PNG branding asset staged in `public/brand/orelse-logo.png` and embedded directly onto PDF certificates, public verification portal, and footer.
- **Base URI:** Configured via `NEXT_PUBLIC_APP_URL` (`http://localhost:3000` for demo). All QR codes encode `${NEXT_PUBLIC_APP_URL}/verify/${certificateId}`.
**Location:** `lib/brand.ts`, `lib/certification/credential.ts`, `public/brand/orelse-logo.png`.

## A6 — Hindi/Marathi Translations [RESOLVED for Phase 8 Interface UI]
**Status:** INTERFACE KEYS 100% PARITY; COURSE CONTENT FALLBACK DOCUMENTED.
**Implementation:** All UI dictionaries in `messages/en.json`, `messages/hi.json`, and `messages/mr.json` possess 100% key parity across navigation, forms, alerts, and badges. Procedural demonstration training steps and course texts gracefully fall back to English with clear visual notifications indicating translation status.

## A7 — DPDP Compliance & Privacy [GOVERNANCE REVIEW]
**Status:** PRIVACY-PRESERVING ARCHITECTURE IMPLEMENTED.
**Implementation:** Minimal data exposure, zero PII on public blockchain/mock ledger, hashed credential identifiers, and transparent privacy policy routes. Formal enterprise legal sign-off required prior to production processing of live citizen data.

## A8 — PostgreSQL Setup & Reliability [RESOLVED for Phase 8]
**Status:** RESOLVED.
**Implementation:** PostgreSQL 18 with version-controlled migrations (`20261115120000_phase8_performance_indexes`), comprehensive composite indexes, connection pooling, and tested backup/restore verification via `scripts/db-backup-restore-test.mjs`.

## A9 — Assessment Gating & Timer Server Grace Period [RESOLVED for Phase 3]
**Implementation:**
1. Final assessments enforce strict progress gating: locked (403 `LOCKED_PROGRESS`) until user's course progress reaches `course.requiredContentPercent` (100%).
2. Quizzes with `timeLimitSec` calculate server-side `expiresAt`. A 5-second network latency buffer is permitted during submission before auto-marking the attempt as `EXPIRED`.
3. Question answers and explanations are stripped (`sanitizeQuestionsForLearner`) from client delivery during active attempts, preventing DOM inspection cheating.

## A10 — Digital Credential Standards & Key Management [RESOLVED for Phase 4]
**Implementation:**
1. **Standard:** W3C Verifiable Credentials 2.0 and 1EdTech Open Badges 3.0 specification compliant credential payload format.
2. **Cryptographic Signing:** ES256 (ECDSA NIST P-256) asymmetric keypair. Private key securely managed in `.secrets/issuer-signing-key.json` and database `IssuerKey` table.
3. **Public JWKS:** Published at `/api/issuer/orelse/jwks` exposing public key material (`kty`, `crv`, `x`, `y`, `kid`, `alg`, `use`) without leaking private key parameters (`d`).
4. **PDF Engine:** Pure client/server `pdf-lib` vector generation without external Chromium/Puppeteer dependencies.

## A11 — Prisma Version-Controlled Migration Baseline [RESOLVED for Phase 4 Review]
**Implementation:**
- Initial migration baseline established in `prisma/migrations/20261114120000_init_baseline/migration.sql`.
- Migration history safely tracked in `_prisma_migrations` table without dropping, truncating, or altering existing tables or seeded data.
- Verified with `npx prisma migrate status`: Database schema is up to date!

## A12 — W3C VC 2.0 & Open Badges 3.0 Standards Compliance [RESOLVED for Phase 4 Review]
**Implementation:**
- Official context URIs: `["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"]`.
- Conforms to VC 2.0 property `validFrom` (replacing legacy v1 `issuanceDate`).
- Implements `AchievementSubject`, `Achievement`, and `Result` arrays with type identifiers.
- Preserves backward-compatible HMAC commitment hashing for legacy Phase 4 demo credentials.

## A13 — On-Chain Privacy & Local EVM Execution [RESOLVED for Phase 4 Review]
**Implementation:**
- `contracts/CertificateRegistry.sol` refactored to ensure strict privacy: accepts only `bytes32 commitment` and `bytes32 reasonCode`. Zero learner names, email addresses, course grades, or raw URLs are stored or emitted.
- Real local EVM deployment and execution verified against running Hardhat node (Chain ID 31337) with real transaction hashes and block receipts.

## A14 — ORELSE Footer Branding [RESOLVED for Phase 4 Review]
**Implementation:**
- Updated `components/layout/SiteFooter.tsx` bottom copyright section.
- Added vertically stacked ORELSE logo (`public/brand/orelse-logo.png`) and "A product by ORELSE" linking to `https://www.orelse.ai`.
- Responsive layout: desktop right-aligned, mobile center-aligned.

## A15 — Phase 5 Institutional Governance & Invariants [RESOLVED for Phase 5]
**Implementation:**
- **Course Publishing Invariants:** Courses cannot transition to `publishStatus: "published"` without at least 1 module section, 1 lesson, and a configured final assessment (if certification is enabled).
- **Sole Administrator Protection:** `PUT /api/admin/users/[userId]` verifies whether the targeted user is the sole active administrator before permitting demotion.
- **Naval Access Security Gating:** Restricts assignment and enrollment in restricted courses (`isRestricted: true`) to users or organization members whose `isOrgVerified` is approved.
- **Formula Injection Mitigation (CWE-1236):** All exported CSV fields starting with `=`, `+`, `-`, or `@` are sanitized with a leading `'` before double-quote wrapping.
- **5-Stage Course Builder:** Guided wizard enforces sequential progression from Basic Info -> Target Audience & Security Policy -> Curriculum Modules -> Assessment Setup -> Review & Publish.
- **Learning Analytics Engine:** Aggregates real-time completion rates, assessment pass rates, grade distribution tiers, and command/collective comparisons directly from PostgreSQL.

## A16 — Communication & Newsletter System Delivery [RESOLVED for Phase 6]
**Implementation:**
- **Local Demo Delivery Adapter:** Defaults to `LocalDemoDeliveryAdapter` in `lib/communication/delivery.ts`, requiring zero external email credentials, API keys, or paid SMTP services for the local demo. Records simulated delivery statuses (`SIMULATED`) and stores preview logs directly in PostgreSQL.
- **RFC 8058 One-Click Unsubscribe:** `buildRfc8058Headers` generates compliant `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers. `/api/newsletter/unsubscribe/[token]` handles automated POST requests to immediately unsubscribe recipients without user friction.
- **Clearance Confidentiality Guard:** Cohort targeting engine in `lib/communication/audience.ts` ensures strict isolation of Naval Officers: civilian-only campaigns do not broadcast to naval units, and restricted naval bulletins are never visible or queryable by civilian FPO/FPC/student learners.
- **Message Moderation:** `sanitizeMessageContent` strips malicious `<script>` tags, event handlers, and arbitrary HTML from discussion threads and subjects, enforcing length bounds and message hygiene.

## A17 — Dedicated Application Training Architecture [RESOLVED for Phase 7]
**Implementation:**
- Modular orchestration of constituent courses via `TrainingProgramme` models without duplicating LMS engines.
- Seeded with 3 core demonstration tracks: FPO Member Training, FPC Operations Training, and Naval Officers Platform Orientation (`isRestricted: true`).
- Guided procedural walkthrough steps (`TrainingStep`) in course player with explicit `DEMO` badge and disclaimer: *"Demonstration content — pending application-specific verification"*.

## A18 — Production Security Hardening & Session Revocation [RESOLVED for Phase 8]
**Implementation:**
- **OWASP ASVS 5.0.0 Level 2:** Enforced real-time account status and role verification in `lib/auth/session.ts`. Deactivated accounts (`isActive: false`) and demoted administrators are immediately barred from privileged routes, preventing stale JWT session reuse.
- **HTTP Security Headers:** Configured `Content-Security-Policy`, `Strict-Transport-Security` (HSTS), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy` in `next.config.ts`.
- **Private Data Isolation:** Strictly enforced `Cache-Control: private, no-store, no-cache, must-revalidate` across all `/api/*` endpoints to eliminate proxy or shared-cache data leakage.
- **Sliding-Window Rate Limiter:** Protects authentication and login endpoints (`lib/auth/rate-limit.ts`) against brute-force credential stuffing.

## A19 — Production Deployment Prerequisites & Credentials [PENDING USER CONFIGURATION]
**Status:** ALL LOCAL ASSETS & SCRIPTS READY; PENDING PRODUCTION CREDENTIALS.
**Implementation:**
- Multi-stage `Dockerfile` and `docker-compose.yml` for isolated containerized environments.
- Automated deployment scripts (`scripts/deploy.sh` and `scripts/deploy.ps1`) with migration safeguards and health check validation.
- Health probes `/api/health/live` and `/api/health/ready` verified.
- Production environment template staged in `.env.production.example`.
- Live production deployment requires user-provided values for: Production Domain, TLS Certificates, Cloud/VPS host, Production PostgreSQL cluster, 64-char JWT secret, HSM/KMS custody for ORELSE ES256 key, and production SMTP provider. No public deployments or fund expenditures are executed without explicit user authorization.

## A20 — Google OAuth 2.0 / OpenID Connect Authentication [RESOLVED]
**Status:** FULLY INTEGRATED & VERIFIED.
**Implementation:**
- Server-side Authorization Code Flow with PKCE (RFC 7636) and SHA-256 challenges in `lib/auth/google.ts`.
- Database model `OAuthAccount` with `@@unique([provider, providerAccountId])` relation to `User`.
- Account collision protection: existing unlinked email addresses are not silently merged; users must verify password first (`account_exists_link_required`).
- Role invariant: new Google logins strictly receive `role: LEARNER`.
- Unlink guard: users cannot unlink Google authentication without first setting a password hash.
- Official Google G branded button on Login and Registration pages (`components/auth/GoogleSignInButton.tsx`).
- 20 automated integration checks verified in `tests/verify-google-auth.mjs`.

## A21 — Pre-Launch Performance & Query Latency Optimization [RESOLVED]
**Status:** RESOLVED VIA BATCHING & IN-MEMORY KEY CACHING.
**Implementation:**
- Root cause of ~8s tail latencies under concurrency was `next dev` compilation queuing under Windows and nested N+1 loops in training analytics.
- Refactored `app/api/admin/training/analytics/route.ts` to replace nested `prisma.enrollment.count()` queries with a single batched `prisma.enrollment.findMany()` call.
- Implemented in-memory caching of the parsed `jose.KeyLike` object in `lib/certification/keys.ts`, eliminating repeated disk reads and JSON parsing.
- Isolated pipeline micro-benchmarking (`scripts/profile-production.mjs`) demonstrates sub-millisecond crypto operations and < 85ms end-to-end execution times.
- Workload-specific p95 latency thresholds established: Public reads < 150ms, QR Verification < 300ms, Learner Progress < 400ms, Admin Analytics < 800ms.
