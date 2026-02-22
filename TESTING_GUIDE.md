# Hylo Testing Guide

**Last Updated**: 2025-12-21
**Branch**: fix/session-controller-security

## Quick Start

### ✅ Tests That Work Right Now (No Setup Required)

```bash
# 1. Password Validation Tests (ALL PASS ✓)
cd packages/hylo/packages/shared
yarn test src/Validators.test.js

# Expected output: 37 tests pass, including:
# - Password length validation (12+ characters)
# - Password complexity (numbers/special chars)
# - Common weak password detection
```

### 🔧 Tests That Need Database Setup

Most backend tests require PostgreSQL + Redis. See "Full Environment Setup" below.

---

## Security Fixes Testing

### 1. Password Validation (✅ TESTED)

**What Was Fixed**: Strengthened password requirements from 9 to 12 characters, added complexity requirements.

**How to Test**:
```bash
cd packages/hylo/packages/shared
yarn test src/Validators.test.js

# Look for these passing tests:
# ✓ catches short passwords (less than 12 characters)
# ✓ catches passwords without numbers or special characters
# ✓ catches common weak passwords
# ✓ allows good passwords with 12+ characters
```

**Manual Testing** (when app is running):
1. Try to create account with password `password123` → Should fail
2. Try password `short` (5 chars) → Should fail
3. Try password `longbutnospecial` → Should fail
4. Try password `SecurePass123!` → Should succeed

---

### 2. File Upload Security

**What Was Fixed**: Added filename sanitization and extension validation.

**Test File**: `apps/backend/test/unit/controllers/UploadController.test.js`

**How to Test** (requires DB):
```bash
cd packages/hylo/apps/backend
yarn test test/unit/controllers/UploadController.test.js

# Expected to pass:
# ✓ Blocks path traversal (../../etc/passwd)
# ✓ Validates file extensions
# ✓ Limits filename length
# ✓ Sanitizes special characters
```

**Manual Testing** (when app is running):
1. Try uploading file named `../../etc/passwd.jpg` → Should sanitize
2. Try uploading `script.exe` → Should reject (not in whitelist)
3. Try uploading `safe-image.jpg` → Should succeed

**Allowed Extensions**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.pdf`, `.doc`, `.docx`, `.txt`, `.mp4`, `.webm`, `.mp3`, `.wav`, `.mov`, `.avi`

---

### 3. Session Security

**What Was Fixed**: Session IDs now pure UUIDs, cookies have security flags.

**Test File**: Manual testing required (no automated tests for this yet)

**How to Test** (when app is running):
```bash
# 1. Start app and log in
# 2. Check session cookie in browser DevTools:

# Application → Cookies → localhost:3000
# Look for cookie named "hylo-dev-local" with:
# - HttpOnly: ✓ (prevents JavaScript access)
# - Secure: ✓ (HTTPS only in production)
# - SameSite: Lax (CSRF protection)

# 3. Check session ID format:
# Should be pure UUID like: "a7b3c4d5-e6f7-8901-2345-6789abcdef01"
# NOT like: "123:a7b3c4d5..." (old format with user ID prefix)
```

---

### 4. Rate Limiting

**What Was Fixed**: Added rate limiting to login endpoint (5 attempts per 15 minutes).

**Test File**: Manual testing required

**How to Test** (when app is running):
```bash
# 1. Go to login page
# 2. Try to log in with wrong password 6 times in a row
# 3. On the 6th attempt, you should get:
#    HTTP 429 Too Many Requests
#    { "error": "Too many login attempts. Please try again later." }
# 4. Check response headers for "Retry-After" (seconds until unlock)
# 5. Wait 15 minutes OR restart server to reset
```

**Code Location**: `apps/backend/api/policies/rateLimit.js`

---

### 5. OAuth Email Verification

**What Was Fixed**: Now verifies email is confirmed by OAuth provider.

**Test File**: Requires OAuth integration testing

**How to Test** (advanced):
```bash
# Requires setting up Google/Facebook OAuth test apps

# 1. Set up test Google account with UNVERIFIED email
# 2. Try to log in via Google OAuth
# 3. Should get error: "Email not verified by provider"
# 4. Verify email in Google account
# 5. Try again → Should succeed
```

**Code Location**: `apps/backend/api/controllers/SessionController.js:116-124`

---

### 6. XSS Prevention

**What Was Fixed**: Changed `innerHTML` to `textContent` in HyloEditor.

**Test File**: Manual testing required

**How to Test** (when app is running):
```bash
# 1. Go to post editor
# 2. Paste a URL with XSS payload:
#    http://example.com/<script>alert('XSS')</script>
# 3. Editor should display URL as plain text
# 4. No script execution should occur
```

**Code Location**: `apps/web/src/components/HyloEditor/HyloEditor.js`

---

### 7. Hardcoded Credentials Removal

**What Was Fixed**: Removed Facebook credentials from avatar URLs.

**How to Test**:
```bash
cd packages/hylo/apps/backend
grep -r "FACEBOOK_APP_ID.*FACEBOOK_CLIENT_TOKEN" .

# Should return NO results
# Previously would find this pattern in LinkedAccount.js
```

**Code Location**: `apps/backend/api/models/LinkedAccount.js`

---

## Full Environment Setup (Optional)

To run ALL tests and launch Hylo locally, you need:

### Prerequisites

1. **Node.js v20** (not v22)
   ```bash
   nvm install 20
   nvm use 20
   ```

2. **PostgreSQL 12+** with PostGIS
   ```bash
   # Windows: Download from postgresql.org
   # macOS: brew install postgresql postgis
   # Linux: apt install postgresql postgis
   ```

3. **Redis**
   ```bash
   # Windows: Download from redis.io
   # macOS: brew install redis && brew services start redis
   # Linux: apt install redis-server && systemctl start redis
   ```

4. **Yarn & Foreman**
   ```bash
   npm install -g yarn foreman
   ```

### Database Setup

```bash
# 1. Create database
createdb hylo

# 2. Enable PostGIS extension
psql hylo -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 3. Run migrations
cd packages/hylo/apps/backend
yarn migrate
```

### Install Dependencies

```bash
cd packages/hylo

# Install all workspace dependencies
yarn install

# Build shared packages
yarn build-packages
```

### Launch Hylo

```bash
# Terminal 1: Backend
cd packages/hylo
yarn backend:dev

# Terminal 2: Frontend (in new terminal)
cd packages/hylo
yarn web:dev

# Access at: http://localhost:3000
```

---

## Test Commands Reference

### Backend Tests

```bash
cd packages/hylo/apps/backend

# Run all tests
yarn test

# Run specific test file
yarn test test/unit/controllers/UploadController.test.js

# Run tests with coverage
yarn cover

# Run only tests matching pattern
yarn test --grep "password"
```

### Frontend Tests

```bash
cd packages/hylo/apps/web

# Run all tests
yarn test

# Run in watch mode
yarn test --watch
```

### Shared Package Tests

```bash
cd packages/hylo/packages/shared

# Run all validator tests
yarn test

# Run specific test
yarn test src/Validators.test.js
```

---

## Testing the Security Fixes

### Recommended Test Order

1. **Start Simple** (No setup needed):
   ```bash
   cd packages/hylo/packages/shared
   yarn test src/Validators.test.js
   ```
   ✅ This confirms password validation fixes work

2. **Check Code Changes**:
   ```bash
   cd packages/hylo
   git diff fix/remove-unused-dependencies..fix/session-controller-security
   ```
   Review all security fixes visually

3. **Read the Summary**:
   ```bash
   cat SECURITY_FIXES_SUMMARY.md
   ```
   Understand what was fixed and why

4. **Set Up Full Environment** (Optional):
   Follow "Full Environment Setup" above
   Then run backend tests with database

5. **Manual Testing** (When app is running):
   - Test password requirements
   - Test file upload restrictions
   - Test rate limiting
   - Test OAuth flows

---

## Common Issues

### Issue: "DATABASE_URL must be set"

**Solution**:
```bash
cd packages/hylo/apps/backend
# Create .env file (already created at .env)
# OR set environment variable:
export DATABASE_URL=postgres://localhost:5432/hylo
```

### Issue: "Cannot connect to database"

**Solution**:
```bash
# Check PostgreSQL is running
psql -l

# If not running:
# macOS: brew services start postgresql
# Linux: systemctl start postgresql
# Windows: Start PostgreSQL service
```

### Issue: "Redis connection failed"

**Solution**:
```bash
# Check Redis is running
redis-cli ping

# If not running:
# macOS: brew services start redis
# Linux: systemctl start redis
# Windows: Start Redis service
```

### Issue: "Port already in use"

**Solution**:
```bash
# Find process using port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Find process using port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Issue: "Yarn checksum error"

**Solution**:
```bash
yarn cache clean
rm -rf node_modules
yarn install
```

---

## What You Can Test WITHOUT Database

✅ **Password validation** - Uses shared package (no DB needed)
✅ **Code review** - Check git diffs for security fixes
✅ **Linting** - Run code quality checks
✅ **Type checking** - If TypeScript files exist

❌ **Upload controller tests** - Needs DB + Sails app
❌ **Session tests** - Needs DB + Redis
❌ **OAuth tests** - Needs DB + OAuth providers
❌ **Rate limiting** - Needs running app

---

## Testing Checklist for Security Fixes

Before merging to production:

- [x] Password validation tests pass (37/37 ✓)
- [ ] File upload tests pass (needs DB setup)
- [ ] Session cookies have security flags (manual check)
- [ ] Rate limiting works on login endpoint (manual check)
- [ ] OAuth email verification blocks unverified emails (needs OAuth setup)
- [ ] XSS prevention in editor (manual check)
- [ ] No hardcoded credentials in code (grep confirms ✓)
- [ ] Full test suite passes (`yarn test` in backend)
- [ ] Frontend tests pass (`yarn test` in web)
- [ ] App launches successfully
- [ ] Can create account with strong password
- [ ] Can upload safe files, cannot upload dangerous files
- [ ] Rate limiting activates after 5 failed logins

---

## Next Steps

1. ✅ **Password tests already passing** - No action needed
2. **Set up local DB** (optional) - To run full test suite
3. **Launch app** (optional) - To test manually
4. **Review code** - Read `SECURITY_FIXES_SUMMARY.md`
5. **Create PR** - When ready to merge fixes

---

## Quick Commands Cheatsheet

```bash
# ✅ Works now (no setup)
cd packages/hylo/packages/shared && yarn test

# 🔧 Needs DB setup
cd packages/hylo/apps/backend && yarn test

# 🚀 Launch app
cd packages/hylo && yarn backend:dev  # Terminal 1
cd packages/hylo && yarn web:dev      # Terminal 2

# 🔍 Review changes
cd packages/hylo && git diff fix/remove-unused-dependencies..HEAD

# 📖 Read summary
cat packages/hylo/SECURITY_FIXES_SUMMARY.md
```

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
