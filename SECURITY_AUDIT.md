# FitHub Commercialization — Security Audit

Date: 2026-11-02
Scope: Initial read-only review of the `main` branch before commercial release.

## Release-blocking findings

1. **Authentication is not established on API requests.** The admin guard trusts the client-controlled `x-user-role` header. The browser stores a user object in localStorage and adds role/email headers to requests. These values can be edited by any user.
2. **Most read endpoints are unauthenticated.** Dashboard, members, member details, plans, trainers, attendance, trainer attendance and payments can be requested without a verified session. Several contain private member information.
3. **Member/trainer identity is client asserted.** `/api/me/member`, `/api/me/trainer` and `/api/me/password` trust `x-user-email` and/or `x-user-role` rather than deriving identity from a server-verified session.
4. **Passwords are stored and compared as plaintext.** The database queries compare `password = ?`; create/update/reset flows store the supplied password directly. New accounts default to `changeme`.
5. **Admin credentials are hardcoded** in `server.js` as `admin@fithub.com` / `Admin@123`.
6. **Password reset OTP handling is weak.** OTPs are held in an in-memory map, generated with `Math.random()`, keyed only by email, logged to the server console, and the request continues even if email delivery fails. There is no visible attempt limit or request throttling.
7. **CORS is unrestricted** via `app.use(cors())`.
8. **Database setup messaging is inconsistent.** The app uses MySQL in `db.js`, but the setup page instructs users to configure Supabase credentials and includes machine-specific local file links.
9. **Schema initialization is destructive.** `schema.sql` drops existing tables before creating them; this is unsafe as a routine installer/upgrade script.
10. **Commercial packaging is incomplete.** The repository has no root README, no install/test scripts, and no explicit commercial end-user license. `node_modules` is present in the repository despite the ignore rule.

## Required remediation sequence

- [ ] Replace client-supplied identity headers with server-issued, HTTP-only authenticated sessions/cookies.
- [ ] Enforce authentication and role authorization on every private API route; derive member/trainer IDs from the authenticated principal.
- [ ] Introduce password hashing and a safe migration path for existing plaintext credentials; remove default shared passwords.
- [ ] Replace hardcoded admin credentials with a first-run admin setup/bootstrap process and environment-backed secrets.
- [ ] Harden password reset: cryptographically secure OTPs, hashed OTP storage, expiry, single use, attempt limits, rate limits, and fail closed if email cannot be sent.
- [ ] Restrict CORS, add security headers, validate request bodies, and avoid leaking internal error details.
- [ ] Add automated authorization/authentication tests, including forged-header and unauthenticated-access tests.
- [ ] Replace destructive schema setup with a fresh-install schema plus non-destructive migrations/upgrade guidance.
- [ ] Verify repository hygiene and remove committed generated dependencies if present, without exposing or deleting customer data.
- [ ] Document local and server deployment, backup/restore, environment variables, and supported runtime versions.

## Important implementation constraints

- Preserve the existing FitHub UI and current Node.js/Express/MySQL architecture where practical.
- Do not merge security work directly into `main`; work on `commercialization/security-hardening` and review via pull request.
- Do not run destructive SQL against an existing customer database.
- Treat this audit as a source-code review, not a penetration test or production security certification.
