# Learn LMS — Production Deployment Prerequisites & Launch Matrix
**Product:** Learn LMS | **Product by:** ORELSE ([https://www.orelse.ai](https://www.orelse.ai))  
**Deployment Target:** Production Multi-Tier Cloud Staging / Bare-Metal Linux

---

## 1. Production Launch Prerequisites Matrix

| Domain / Category | Requirement | Production Specification | Readiness Status | Action Required Prior to Public Launch |
| :--- | :--- | :--- | :---: | :--- |
| **Domain & DNS** | Hostname Allocation | `learn.orelse.ai` pointing to Cloudflare / AWS Route 53 / Anycast IP. | `Pending Human Deployment` | Configure A/AAAA DNS records to production ingress load balancer. |
| **TLS / SSL** | Valid Production Certificate | Let's Encrypt / DigiCert / AWS ACM certificate for `learn.orelse.ai`. | `Pending Human Deployment` | Issue cert via Certbot or terminate TLS at Cloudflare / AWS ALB. |
| **HSTS Verification**| Strict-Transport-Security | Preload verification prerequisites: valid cert on all subdomains. | `Ready in Code` | Submit `orelse.ai` to `https://hstspreload.org` after certificate issuance. |
| **Database** | Managed PostgreSQL 18 | Multi-AZ High-Availability PostgreSQL 18 cluster with connection pooling. | `Ready (Local PG 18 Verified)`| Provision managed PostgreSQL 18 with `DATABASE_URL` pool size >= 20. |
| **Database WAL** | Continuous WAL Archiving | S3/GCS bucket configured with IAM roles for continuous pgBackRest archiving. | `Documented in Runbook` | Configure `archive_command` in cloud `postgresql.conf`. |
| **Google OAuth 2.0**| Production Redirect URI | Google Cloud Console OAuth 2.0 Client credentials updated for production. | `Credentials Configured` | In Google Cloud Console, add `https://learn.orelse.ai/api/auth/google/callback` to Authorized Redirect URIs. |
| **KMS / HSM Keys** | Key Custody for ES256 | Production issuer private key provisioned in AWS KMS / Google Cloud KMS / HashiCorp Vault. | `Ready (File Fallback Tested)` | Transition from local `.secrets/issuer-signing-key.json` to cloud KMS adapter in production. |
| **Blockchain** | EVM Mainnet / Amoy Testnet | Polygon Amoy testnet or mainnet RPC URL, private key with MATIC balance. | `Ready (Hardhat Node Active)`| Set `LEDGER_MODE=evm` and configure `EVM_RPC_URL`, `EVM_PRIVATE_KEY` for on-chain anchoring. |
| **Email Delivery** | Production SMTP / SES | AWS SES / SendGrid / Resend API credentials for high-reputation transactional emails. | `Ready (Local Demo Adapter Active)`| Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` in production `.env`. |
| **Reverse Proxy** | Nginx / Ingress Controller | Optimized Nginx reverse proxy with unhashed asset revalidation and rate limiting. | `Ready in deploy/nginx` | Deploy `deploy/nginx/learnlms.conf` with updated cache-control headers. |

---

## 2. Environment Variables Production Checklist (`.env.production`)

```env
# Application Host & Identity
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://learn.orelse.ai
PORT=3000

# Database Connection Pool (PostgreSQL 18)
DATABASE_URL="postgresql://learnlms_prod_user:SECURE_PASSWORD@postgres.internal:5432/learnlms_prod?schema=public&connection_limit=25&pool_timeout=10"

# JWT Session Authentication
JWT_SECRET="GENERATE_64_CHAR_HEX_SECRET_FOR_PRODUCTION_SESSIONS"

# Google OAuth 2.0 / OpenID Connect
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://learn.orelse.ai/api/auth/google/callback"

# Digital Credential & Issuer Environment
CERTIFICATE_ENVIRONMENT=production
ORELSE_ISSUER_NAME="ORELSE"
ORELSE_ISSUER_URL="https://www.orelse.ai"
ORELSE_PUBLIC_JWKS_URL="https://learn.orelse.ai/api/issuer/orelse/jwks"

# Blockchain Ledger Adapter
LEDGER_MODE="mock" # Switch to "evm" when Polygon Amoy/Mainnet anchoring is active
EVM_RPC_URL="https://rpc-amoy.polygon.technology"
EVM_REGISTRY_ADDRESS="0x..."
EVM_PRIVATE_KEY="0x..."

# Transactional Email / Newsletter Delivery
EMAIL_PROVIDER="smtp" # or "resend" / "ses"
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=585
SMTP_USER="apikey"
SMTP_PASSWORD="..."
EMAIL_FROM="Learn LMS <noreply@orelse.ai>"
```
