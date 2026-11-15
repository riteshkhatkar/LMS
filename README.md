# Learn LMS — Enterprise Learning & Trusted Certification Platform

Learn LMS is an institutional learning, assessment, and trusted-certification platform designed for structured online education and specialized training programmes for **FPOs (Farmer Producer Organizations)**, **FPCs (Farmer Producer Companies)**, and **Naval Officers** (operational command personnel), alongside standard students.

Official Credential Issuer: **ORELSE** (`https://www.orelse.ai`).

---

## 🏛️ Architecture & Role Model

### Three Authorization Roles
Authorization is strictly governed by three system roles:
- `LEARNER`: Can browse catalog, enroll in courses, study lessons (video, PDF, text), take in-course quizzes, take final assessments, review scored attempts, claim & download digital certificates, and view their dashboard (`/learn/my-learning`).
- `INSTRUCTOR`: Can view assigned courses, track enrollees, author quizzes and questions (`/instructor`).
- `ADMIN`: Can manage users, organizations, courses, platform metrics, publish versioned grading rules, manage digital certificates, revoke certificates with required audit reasons, and reissue superseded credentials (`/admin`).

### Learner Group Classifications
`FPO`, `FPC`, `STUDENT`, and `NAVAL_OFFICER` are learner-group classifications attached to users/organizations, **not** separate authorization roles.

### Security & Integrity Invariants
- **Public Registration:** Self-registration strictly enforces `role = LEARNER`. Privilege escalation attempts (e.g. injecting `ADMIN` or `INSTRUCTOR`) are rejected by server-side controllers.
- **Session Tokens:** Stateless, cryptographic JWTs signed with `HS256` via `jose`, stored in HTTP-only, `SameSite=Lax` cookies (`learn_lms_session`).
- **Server-Authoritative Scoring:** The browser never computes marks, scores, grades, or pass/fail outcomes. All evaluation happens inside an atomic PostgreSQL transaction.
- **Anti-Cheat Question Sanitization:** Correct answers (`isCorrect`) and teacher explanations are stripped by `sanitizeQuestionsForLearner` before being transmitted to the browser during active attempts.
- **Timer Enforcement:** Quiz time limits are tracked and validated server-side. Submissions after `expiresAt` are marked `EXPIRED` with zero unearned points.
- **Course Progress Gating:** Final assessments remain strictly locked (403 Forbidden with `LOCKED_PROGRESS`) until the learner completes `requiredContentPercent` (100%) of mandatory lessons.
- **Restricted Training Isolation:** Naval training courses marked `isRestricted: true` verify organization assignment and verification server-side.
- **Decimal-Safe Grading (§7.3):** Integer arithmetic (`Math.round(score * 100)`) eliminates IEEE-754 precision issues at the strict `>60%` pass boundary (60.00% is FAIL, 60.01% is PASS).
- **Cryptographic Credential Signing:** Digital credentials conform to W3C Verifiable Credentials 2.0 / Open Badges 3.0 and are signed server-side using ES256 (ECDSA NIST P-256).
- **Public JWKS Discovery:** The issuer's public key set is published at `/api/issuer/orelse/jwks` for decentralized offline verification without leaking private key parameters.
- **Dual Ledger Architecture:**
  - *Adapter A (MockLedger):* Persistent SHA-256 hash-chained history in PostgreSQL for 100% local, offline, zero-gas operation. Clearly labeled with demo disclosures.
  - *Adapter B (Polygon Amoy Testnet / Local EVM):* Solidity smart contract `contracts/CertificateRegistry.sol` using `ethers.js` v6 on Polygon Amoy (Chain ID 80002).
- **Zero PII on Ledger:** Only domain-separated SHA-256 salted commitments are anchored on-chain, preserving learner privacy and complying with data protection principles.
- **Vector PDF & Scannable QR:** High-resolution A4 landscape printable certificates generated via `pdf-lib` embedding the ORELSE logo and dynamic verification QR code linking to `/verify/[certificateId]`.

---

## 🚀 Quick Start

### 1. Requirements
- Node.js 18+
- PostgreSQL 14+ (tested on PostgreSQL 18.0)
- npm / npx

### 2. Environment Configuration
Create `.env` in the root directory:
```env
DATABASE_URL="postgresql://postgres:aaaa%401111@localhost:5432/learnlms"
JWT_SECRET="learn_lms_super_secret_jwt_key_2026_dev_env_987654321"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="production"

# Phase 4 Ledger Configuration
LEDGER_MODE="mock" # Options: mock | local_evm | public_testnet
# Optional for Polygon Amoy testnet:
# EVM_RPC_URL="https://rpc-amoy.polygon.technology"
# CERTIFICATE_REGISTRY_ADDRESS="0x..."
# ISSUER_PRIVATE_KEY="0x..."

# Google OAuth 2.0 / OpenID Connect
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

### 3. Database Migration & Idempotent Seeding
```bash
# Deploy version-controlled Prisma migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed organizations, courses, lessons, quizzes, demo accounts, and ORELSE credentials
npm run db:seed
```

### 4. Running the Application
```bash
# Production Build & Start
npm run build
npm run start

# Development Mode
npm run dev
```
The application will be accessible at: `http://localhost:3000`

### 5. Running Verification & Operations
```bash
# Run Vitest unit tests (104 tests)
npm run test:run

# Run End-to-End HTTP Integration Suites (Phases 2 through 8)
node tests/verify-api-flow.mjs
node tests/verify-phase3-flow.mjs
node tests/verify-phase4-flow.mjs
node tests/verify-phase5-flow.mjs
node tests/verify-phase6-flow.mjs
node tests/verify-phase7-flow.mjs
node tests/verify-phase8-flow.mjs

# Run Local Hardhat EVM Blockchain Checks
node scripts/verify-local-evm.mjs

# Run PostgreSQL Backup & Restoration Integrity Test
node scripts/db-backup-restore-test.mjs

# Run Concurrency & Stress Load Testing Suite
node tests/load-test.mjs

# Check Application Health Endpoints
curl http://localhost:3000/api/health/live
curl http://localhost:3000/api/health/ready
```

---

## 🐳 Production Deployment & Containerization

### Docker Compose Deployment (Local / Staging)
```bash
# Build and run Next.js application & PostgreSQL 18
docker-compose up -d --build

# Run database migrations inside container
docker-compose exec web npx prisma migrate deploy
```

### Automated Production Deployment Scripts
- **Linux / POSIX:** `./scripts/deploy.sh`
- **Windows / PowerShell:** `.\scripts\deploy.ps1`
- **Nginx Reverse Proxy Template:** `deploy/nginx/learnlms.conf`
- **Production Environment Variables Template:** `.env.production.example`

---

## 👥 Demo User Accounts (Seeded)

| Role | Email | Password | Group / Organization | Access Route | Key Test Scenarios |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Learner (Passed & Certified)** | `learner@learnlms.local` | `Learner@123` | Naval Officers (`WNC-TRG`) | `/en/learn/my-learning` | Completed course, passed final exam (93%), Grade A certificate issued (`LLMS-DEMO-2026-5276`), PDF download & QR verify |
| **Learner (Failed)** | `student.user@learnlms.local` | `Learner@123` | Student (`AGRI-U-PBN`) | `/en/learn/my-learning` | Took final exam, failed on Attempt 1 (55%), 2 attempts remaining |
| **Learner (FPO)** | `fpo.user@learnlms.local` | `Learner@123` | FPO Member (`MAHA-FPO-01`) | `/en/learn/my-learning` | Fresh in-progress course, taking in-course quizzes, Grade B certificate (`LLMS-DEMO-2026-C472`) |
| **Instructor** | `instructor@learnlms.local` | `Instructor@123` | Instructor Staff | `/en/instructor` | Authoring quizzes, editing questions, reviewing learner results |
| **Admin** | `admin@learnlms.local` | `Admin@123` | Platform Admin | `/en/admin` | Publishing grading rules, managing certificate registry, revoking with reason, reissuing superseded credentials |

---

## 🎓 Public Issuer Profile & Verification Endpoints

- **ORELSE Issuer Profile:** `http://localhost:3000/en/issuer/orelse`
- **ORELSE Public JWKS:** `http://localhost:3000/api/issuer/orelse/jwks`
- **Public Verification Portal:** `http://localhost:3000/en/verify`
- **Direct Certificate Verification:** `http://localhost:3000/en/verify/LLMS-DEMO-2026-5276`
- **PDF Certificate Download:** `http://localhost:3000/api/certificates/LLMS-DEMO-2026-5276/download`

---

## 🧪 Automated Testing

### Vitest Unit & Invariant Suite (53 Tests)
Tests integer-safe grading engine thresholds, timer expirations, anti-cheat question sanitization, ES256 key generation, digital signatures, canonical W3C VC 2.0 / Open Badges 3.0 generation, QR generation, vector PDF building, privacy-preserving ABI signatures, and ledger hashing:
```bash
npm run test:run
```

### Real Local EVM Blockchain Workflow Verification
Deploys `CertificateRegistry.sol` to active local EVM (Chain ID 31337), registers issuer role, anchors commitments, verifies on-chain queries, and executes on-chain revocation with real transaction hashes and receipts:
```bash
node scripts/verify-local-evm.mjs
```

### Phase 2 E2E HTTP Integration Suite (35 Tests)
Validates registration security, privilege elevation prevention, authentication, enrollment idempotency, and RBAC redirects:
```bash
node tests/verify-api-flow.mjs
```

### Phase 3 Assessment & Grading Engine E2E Suite (37 Tests)
Validates end-to-end quiz authoring, sanitization, timer limits, auto-save, server-authoritative scoring, and progress gating:
```bash
node tests/verify-phase3-flow.mjs
```

### Phase 4 Digital Certification & Verification E2E Suite (37 Tests)
Validates public JWKS, ORELSE issuer profile, learner credential query, cross-learner authorization isolation, vector PDF streaming, public verification API & HTML rendering, RBAC revocation guards, admin revocation with audit reasons, and reissuance with superseded audit trails:
```bash
node tests/verify-phase4-flow.mjs
```

### Phase 5 Full Admin & Instructor Portals, Course Management & Analytics E2E Suite (32 Checks)
Validates category taxonomy, instructor 5-stage course builder, curriculum & publishing invariants, clearance approvals, polymorphic course assignments, real-time learning analytics, CWE-1236 formula injection sanitization, security audit logging, and sole administrator demotion protection:
```bash
node tests/verify-phase5-flow.mjs
```

### Phase 6 Newsletter, Announcements, Messaging & Notifications E2E Suite (55 Checks)
Validates newsletter campaign studio, local simulated demo delivery, RFC 8058 one-click unsubscribe headers & handlers, institutional announcements, naval clearance confidentiality guards, two-way learner-instructor messaging with moderation sanitization, and in-app notifications:
```bash
node tests/verify-phase6-flow.mjs
```

### Phase 7 Dedicated Training, Onboarding & Naval Isolation Suite (38 Checks)
Validates core application onboarding tracks, guided procedural walkthroughs, learner clearance gating (HTTP 403 Forbidden), cohort assignments, and participant rosters:
```bash
node tests/verify-phase7-flow.mjs
```

### Phase 8 Security, Observability, Session Invalidation & Rate Limiting Suite (18 Checks)
Validates production health probes (`/api/health/live`, `/api/health/ready`), HTTP security headers, immediate session invalidation for deactivated accounts, and real-time role demotion defense:
```bash
node tests/verify-phase8-flow.mjs
```

### Google OAuth 2.0 / OpenID Connect Suite (20 Checks)
Validates PKCE challenge generation, state/nonce validation, CSRF mismatch rejection, timeout expiration, account collision protection, and unlinking safety:
```bash
node tests/verify-google-auth.mjs
```

### Local Hardhat EVM Blockchain Checks (10 Checks)
Validates local Solidity contract deployment, commitment anchoring, issuer authorization, duplicate anchor prevention, and on-chain revocation:
```bash
node scripts/verify-local-evm.mjs
```

### PostgreSQL 18 Backup & Restoration Integrity Test
Validates automated full database backup creation, restoration into disposable container, and 100% record integrity verification:
```bash
node scripts/db-backup-restore-test.mjs
```

Total automated checks passing across all suites: **389 total checks** (106 Vitest unit tests + 20 Google OAuth + 35 Phase 2 + 37 Phase 3 + 37 Phase 4 + 32 Phase 5 + 55 Phase 6 + 38 Phase 7 + 18 Phase 8 + 10 Local EVM Checks + 1 Database Backup & Restoration Suite).

---

## 📊 Modules & Roadmap Status

- **Module 1: Courses, Curriculum Catalog & 5-Stage Course Builder** — ✅ Completed (Phases 1, 2 & 5)
- **Module 2: Quiz & Assessment Engine** — ✅ Completed (Phase 3)
- **Module 3: Certification & Blockchain Anchoring** — ✅ Completed (Phase 4)
- **Module 4: Full Admin & Instructor Portals, Organizations & Analytics** — ✅ Completed (Phase 5)
- **Module 5: Newsletter & Communication System** — ✅ Completed (Phase 6)
- **Module 6: Stats & Learning Analytics** — ✅ Completed (Phases 5 & 7)
- **Module 7: Dedicated Application Training, Guided Walkthrough & Multilingual** — ✅ Completed (Phase 7)
- **Module 8: Security Audit, Performance Optimization, Caching & Pre-Launch Validation** — ✅ Completed (Phase 8)
- **Addendum: Google OAuth 2.0 / OpenID Connect Authentication** — ✅ Completed & Verified

**Current Status: READY FOR HUMAN REVIEW**
