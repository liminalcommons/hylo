# Hylo Local Development Setup Guide

**Created**: 2025-12-21
**For**: chora-workspace/packages/hylo
**Status**: Ready to initialize

---

## Prerequisites

### Required Software

| Software | Version | Check Command | Install |
|----------|---------|---------------|---------|
| **Node.js** | 20.x | `node --version` | Download from nodejs.org or use nvm |
| **PostgreSQL** | 12+ | `psql --version` | Download from postgresql.org |
| **Redis** | Latest | `redis-cli --version` | See OS-specific instructions below |
| **Yarn** | 4.9.2+ | `yarn --version` | `npm install -g yarn` |
| **Foreman** | Latest | `foreman --version` | `npm install -g foreman` |

### Install Redis

**Windows**:
```bash
# Option 1: Using Chocolatey
choco install redis-64

# Option 2: Using WSL2
wsl --install
wsl
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start
```

**macOS**:
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get -y install redis-server
sudo systemctl enable redis
sudo systemctl start redis
```

### Install PostgreSQL with PostGIS

**Windows**:
```bash
# Download PostgreSQL installer from postgresql.org
# During install, select PostGIS from Stack Builder
```

**macOS**:
```bash
brew install postgresql postgis
brew services start postgresql
```

**Linux**:
```bash
sudo apt-get install postgresql postgresql-contrib postgis
sudo systemctl start postgresql
```

---

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd packages/hylo

# Make sure you're on Node 20
node --version  # Should show v20.x

# Install dependencies (takes 5-10 minutes)
yarn install

# Build shared packages
yarn build-packages
```

### 2. Set Up PostgreSQL Databases

```bash
# Create databases
createdb hylo -h localhost
createdb hylo_test -h localhost

# Load schema
cat migrations/schema.sql | psql hylo

# Seed with test data
NODE_ENV=dummy yarn knex seed:run
```

**Default Test User**:
- Email: `test@hylo.com`
- Password: `hylo`

### 3. Configure Backend Environment

```bash
# Copy example env file
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` and set:

```bash
# Required
DATABASE_URL=postgresql://localhost/hylo
REDIS_URL=redis://localhost:6379

# Generate this:
OIDC_KEYS=$(openssl genrsa 2048 | base64)

# Your email
EMAIL_SENDER=your-email@example.com

# Optional (for development, can be dummy values)
ADMIN_GOOGLE_CLIENT_ID=dummy
ADMIN_GOOGLE_CLIENT_SECRET=dummy
FACEBOOK_APP_ID=dummy
FACEBOOK_APP_SECRET=dummy
GOOGLE_CLIENT_ID=dummy
GOOGLE_CLIENT_SECRET=dummy
```

**Get Real API Keys** (optional for basic dev):
- Mapbox: https://www.mapbox.com/ → Get API token
- Google OAuth: https://console.developers.google.com/
- Facebook: https://developers.facebook.com/

### 4. Configure Web Frontend Environment

```bash
# Copy example env file
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env`:

```bash
REACT_APP_GRAPHQL_URL=http://localhost:3001/noo/graphql
REACT_APP_SOCKET_URL=http://localhost:3001
REACT_APP_FILEPICKER_API_KEY=dummy
REACT_APP_MAPBOX_TOKEN=your-mapbox-token-here
```

### 5. Start Hylo!

Open **two terminal windows**:

**Terminal 1** (Backend):
```bash
cd packages/hylo
yarn backend:dev
```

Wait for: `✓ Server listening on http://localhost:3001`

**Terminal 2** (Web Frontend):
```bash
cd packages/hylo
yarn web:dev
```

Wait for: `✓ Local: http://localhost:3000`

### 6. Access Hylo

Open browser: **http://localhost:3000**

Login with:
- Email: `test@hylo.com`
- Password: `hylo`

---

## Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL is running
psql -h localhost -U your_username -d postgres

# Verify databases exist
psql -l | grep hylo

# Reset database if needed
dropdb hylo
createdb hylo
cat migrations/schema.sql | psql hylo
NODE_ENV=dummy yarn knex seed:run
```

### Redis Connection Errors

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Start Redis if not running
# Windows: redis-server
# macOS: brew services start redis
# Linux: sudo systemctl start redis
```

### Port Already in Use

```bash
# Find and kill process on port 3001 (backend)
# Windows: netstat -ano | findstr :3001
# macOS/Linux: lsof -ti:3001 | xargs kill -9

# Find and kill process on port 3000 (frontend)
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -ti:3000 | xargs kill -9
```

### Node Version Issues

```bash
# Install nvm (Node Version Manager)
# Windows: https://github.com/coreybutler/nvm-windows
# macOS/Linux: https://github.com/nvm-sh/nvm

# Then:
nvm install 20
nvm use 20
```

### Yarn Install Fails

```bash
# Clear cache and retry
yarn cache clean
rm -rf node_modules
rm yarn.lock
yarn install
```

---

## Development Workflow

### Running Tests

```bash
# Backend tests
cd apps/backend
yarn test

# Frontend tests
cd apps/web
yarn test
```

### Database Migrations

```bash
# Create new migration
yarn knex migrate:make migration_name

# Run migrations
yarn knex migrate:latest

# Rollback migration
yarn knex migrate:rollback
```

### Viewing GraphQL Schema

Open: http://localhost:3001/noo/graphql

This gives you GraphQL Playground to explore the API.

---

## Next Steps After Setup

Once Hylo is running, you can:

1. **Apply Security Fixes** from the audit:
   - Add rate limiting to login
   - Fix XSS vulnerabilities
   - Strengthen password validation

2. **Run the Full Test Suite**:
   ```bash
   yarn test
   ```

3. **Explore the Codebase**:
   - Backend: `apps/backend/api/`
   - Frontend: `apps/web/src/`
   - Shared code: `packages/@hylo/`

4. **Make Changes Safely**:
   - Always create a branch: `git checkout -b fix/description`
   - Test locally before committing
   - Run tests: `yarn test`

---

## Quick Reference

### Start Everything
```bash
# Option 1: Using foreman (starts both)
yarn dev

# Option 2: Separate terminals
yarn backend:dev  # Terminal 1
yarn web:dev      # Terminal 2
```

### Stop Everything
```bash
# Ctrl+C in each terminal
# Or kill processes:
pkill -f "node.*backend"
pkill -f "node.*web"
```

### Reset Database
```bash
dropdb hylo && createdb hylo
cat migrations/schema.sql | psql hylo
NODE_ENV=dummy yarn knex seed:run
```

### Check Service Status
```bash
# PostgreSQL
psql -h localhost -U your_username -d postgres -c "SELECT version();"

# Redis
redis-cli ping

# Backend API
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000
```

---

## Common Configuration

### Environment Variables Summary

**Backend** (`apps/backend/.env`):
```bash
# Database
DATABASE_URL=postgresql://localhost/hylo
REDIS_URL=redis://localhost:6379

# Auth (generate with: openssl genrsa 2048 | base64)
OIDC_KEYS=<base64-rsa-key>

# Email
EMAIL_SENDER=your-email@example.com

# OAuth (optional for dev)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...

# APIs (optional)
MAPBOX_TOKEN=...
ROLLBAR_SERVER_TOKEN=...
```

**Frontend** (`apps/web/.env`):
```bash
REACT_APP_GRAPHQL_URL=http://localhost:3001/noo/graphql
REACT_APP_SOCKET_URL=http://localhost:3001
REACT_APP_MAPBOX_TOKEN=...
```

---

## Additional Resources

- **Hylo README**: `README.md`
- **Backend README**: `apps/backend/README.md`
- **Web README**: `apps/web/README.md`
- **Contributing Guide**: `CONTRIBUTING.md` (if exists)
- **Security Audit**: See `../CLEANUP_LOG.md` for audit findings

---

**Questions?** Check the Hylo documentation at https://hylozoic.gitbook.io/hylo/

🤖 Generated with Claude Code (https://claude.com/claude-code)
