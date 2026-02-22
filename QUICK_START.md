# Hylo Quick Start (Minimal Setup)

**Goal**: Get Hylo running locally in ~15 minutes

---

## Absolute Minimum Requirements

1. ✅ **Node 20** - `node --version`
2. ✅ **PostgreSQL** running
3. ✅ **Redis** running
4. ✅ **Yarn** installed
5. ✅ **Foreman** installed

---

## 5-Step Quick Start

### Step 1: Install Dependencies (5-10 min)

```bash
cd packages/hylo
yarn install
yarn build-packages
```

**If yarn install fails** with checksum errors:
```bash
# Update the problematic package
cd apps/web
yarn up react-day-picker@latest
cd ../..
yarn install
```

### Step 2: Create Databases (1 min)

```bash
# Create databases
createdb hylo
createdb hylo_test

# Load schema & seed data
cat migrations/schema.sql | psql hylo
NODE_ENV=dummy yarn knex seed:run
```

### Step 3: Minimal Backend .env (2 min)

Create `apps/backend/.env`:

```bash
# Copy this exactly:
DATABASE_URL=postgresql://localhost/hylo
REDIS_URL=redis://localhost:6379
PROTOCOL=http
DOMAIN=localhost:3001
OIDC_KEYS=$(openssl genrsa 2048 | base64)
EMAIL_SENDER=dev@localhost
SESSION_SECRET=change-me-in-production-12345678901234567890

# Dummy values for development
ADMIN_GOOGLE_CLIENT_ID=dummy
ADMIN_GOOGLE_CLIENT_SECRET=dummy
FACEBOOK_APP_ID=dummy
FACEBOOK_APP_SECRET=dummy
GOOGLE_CLIENT_ID=dummy
GOOGLE_CLIENT_SECRET=dummy
MAPBOX_TOKEN=dummy
```

**Quick command** (macOS/Linux):
```bash
cat > apps/backend/.env << 'EOF'
DATABASE_URL=postgresql://localhost/hylo
REDIS_URL=redis://localhost:6379
PROTOCOL=http
DOMAIN=localhost:3001
EMAIL_SENDER=dev@localhost
SESSION_SECRET=$(openssl rand -hex 32)
OIDC_KEYS=$(openssl genrsa 2048 | base64)
ADMIN_GOOGLE_CLIENT_ID=dummy
ADMIN_GOOGLE_CLIENT_SECRET=dummy
FACEBOOK_APP_ID=dummy
FACEBOOK_APP_SECRET=dummy
GOOGLE_CLIENT_ID=dummy
GOOGLE_CLIENT_SECRET=dummy
MAPBOX_TOKEN=dummy
EOF
```

### Step 4: Minimal Web .env (1 min)

Create `apps/web/.env`:

```bash
REACT_APP_GRAPHQL_URL=http://localhost:3001/noo/graphql
REACT_APP_SOCKET_URL=http://localhost:3001
REACT_APP_FILEPICKER_API_KEY=dummy
REACT_APP_MAPBOX_TOKEN=dummy
```

### Step 5: Start Hylo! (2 min)

Open **two terminals**:

**Terminal 1**:
```bash
cd packages/hylo
yarn backend:dev
```
Wait for: `Server listening on http://localhost:3001`

**Terminal 2**:
```bash
cd packages/hylo
yarn web:dev
```
Wait for: `Local: http://localhost:3000`

**Open browser**: http://localhost:3000

**Login**:
- Email: `test@hylo.com`
- Password: `hylo`

---

## ✅ You're Done!

If you see the Hylo login page, you're all set!

---

## Common Issues

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
psql -l
# If error, start PostgreSQL (OS-specific)
```

### "Redis connection failed"
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
# If not, start Redis (OS-specific)
```

### "Port 3001 already in use"
```bash
# Kill the process
# Windows: netstat -ano | findstr :3001
# macOS/Linux: lsof -ti:3001 | xargs kill -9
```

### "yarn install fails"
See SETUP_GUIDE.md for detailed troubleshooting.

---

## What's Next?

Now that Hylo is running:

1. **Test the fixes we made**:
   - Verify the app still works after removing 9 dependencies ✅
   - Try the security improvements

2. **Explore the app**:
   - Create a test group
   - Post a message
   - Try the map explorer

3. **Apply security fixes**:
   - See SECURITY_FIXES.md for safe improvements

---

📖 **Full Documentation**: See `SETUP_GUIDE.md`

🤖 Generated with Claude Code
