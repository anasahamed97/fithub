# FitHub Authentication Migration Plan

Status: Planned — no application authentication code changed yet.
Branch: `commercialization/security-hardening`
Date: 2026-11-02

## Environment decision

The owner has confirmed that local MySQL is not configured and there is no production/customer database to preserve. Existing repository demo data is sample data only.

Therefore:
- Build the secure authentication design for a fresh MySQL installation.
- Do not attempt a legacy plaintext-password migration against a database that does not exist.
- Keep the existing demo data as synthetic seed data only; never import real customer data as part of setup.
- If a pre-existing FitHub database is discovered later, stop and take a verified backup before any schema or credential migration.

## Target authentication design

### Session model
- Use a server-side session store backed by MySQL (or a durable store supported by the deployment).
- Issue an opaque session identifier in a cookie configured with `HttpOnly`, `SameSite=Lax`, and `Secure` when deployed over HTTPS.
- Set a bounded session lifetime and rotate the session ID after login and privilege changes.
- Implement POST logout that destroys the server-side session and clears the cookie.
- Do not use localStorage as the source of authentication truth.
- Use CSRF protection for state-changing requests when cookie authentication is used.

### Password model
- Hash all member and trainer passwords with bcrypt (cost factor chosen and benchmarked for supported hardware).
- Never store or log plaintext passwords.
- Remove shared `changeme` defaults. Admin-created accounts must receive a unique temporary setup/reset flow or a password set by the user.
- Validate password length and reject weak/empty passwords.
- Use generic invalid-credential responses.

### Admin bootstrap
- Remove the hardcoded `admin@fithub.com / Admin@123` credentials.
- Add a first-run setup flow that is available only while no admin exists.
- Require a one-time setup secret from environment configuration or a local setup token; do not expose a public unauthenticated admin-create endpoint after initialization.
- Hash the admin password and mark setup as complete in the database.

### Authorization
- Add authentication middleware to all private API routes.
- Add role middleware for admin-only routes.
- Derive the current user ID, email, and role from the verified server session only.
- Never trust `x-user-role`, `x-user-email`, browser storage, or request-body identity fields.
- Members and trainers may access only their own profile, attendance, payments, and password-change operations.
- Keep admin-only management operations restricted to admin role.
- Review every route for data leakage and object-level authorization.

### Password reset
- Generate OTPs using Node's cryptographic random generator.
- Store only a hash of each OTP with role/user binding, expiry, attempt counter, and consumed timestamp.
- Enforce resend and verification rate limits.
- Invalidate an OTP after successful use and after too many failed attempts.
- Do not print OTPs or secrets to logs.
- Fail closed if the email provider is unavailable; return a generic response that does not reveal whether an account exists.
- Align email copy with the configured OTP expiry.

## Implementation order

1. Add required packages and environment variable documentation.
2. Add a non-destructive fresh-install schema for admins, sessions, OTP/reset records, and existing FitHub business tables.
3. Add password hashing helpers and admin bootstrap.
4. Add session middleware, login, current-session endpoint, and logout.
5. Add authentication and role checks to every API route.
6. Replace identity-header use in member/trainer profile and password routes with session-derived identity.
7. Update browser code to use `credentials: 'same-origin'`, remove localStorage auth and header injection, and verify the session on page load.
8. Harden password reset and email sending.
9. Add tests for login, logout, role restrictions, forged headers, unauthenticated access, own-record access, OTP expiry/reuse/rate limits.
10. Write local and server installation instructions and verify a clean install.

## Fresh-install and upgrade safety

- The existing `schema.sql` is destructive because it drops tables. It must not be used as an upgrade script.
- Create a new versioned, non-destructive installer/migration path.
- Installer scripts must create tables only when absent or apply explicit versioned migrations.
- Do not run `DROP TABLE`, truncate customer tables, or overwrite existing data during normal startup.
- Provide backup/restore instructions before any future schema upgrade.
- Seed only clearly synthetic sample data, and make sample seeding optional.

## Acceptance criteria

- Unauthenticated API calls to private routes return 401.
- A forged `x-user-role: admin` header cannot grant admin access.
- A forged `x-user-email` header cannot access another user's data.
- Member and trainer sessions cannot call admin-only routes.
- Members/trainers cannot read or modify another user's private records.
- Passwords and OTPs are never stored in plaintext or logged.
- Logout invalidates the server session.
- Session cookies use secure production attributes.
- Fresh installation does not drop or overwrite existing tables/data.
- Automated tests pass before the branch is proposed for merge.

## Scope note

This is a source-code remediation plan, not a penetration test, legal compliance assessment, or security certification. Production release requires testing on a clean environment and review of the final implementation.
