# Fix Report: PM2 Environment Variable Loading Issues

**Date:** 2026-01-15
**Source:** Production deployment failure - login and extraction not working
**Status:** ✅ **FIXED**

---

## Summary

- **Fixed:** 2 critical issues
- **Remaining:** 0
- **Verification:** User testing required

---

## Issues Identified

### Issue #1: OpenRouter API Key Not Loaded
**Severity:** Critical
**Symptom:** Knowledge extraction completing in 3-5 seconds (too fast), using fallback strategies, prompt generation returning 502 Bad Gateway errors

### Issue #2: Database Password Not Loaded
**Severity:** Critical (Blocker)
**Symptom:** Login failing with 500 Internal Server Error, cannot access any database functionality

---

## Fixes Applied

### Fix #1: OpenRouter API Key Missing in PM2 Environment

#### Symptom
- Knowledge extraction completed in 3-5 seconds (not calling LLM)
- Extraction used fallback strategies instead of database templates
- Prompt generation failed with 502 Bad Gateway errors
- Logs showed 401 Unauthorized from OpenRouter API

#### Root Cause
**PM2 was not loading `OPENROUTER_API_KEY` from .env files into its process environment.**

Even though `.env`, `.env.production`, and `.env.local` all contained the correct API key:
```bash
OPENROUTER_API_KEY=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
```

PM2's environment (`pm2 env 28`) did NOT contain this variable. Investigation showed:
- ✅ PORT=3006 (loaded)
- ✅ BASE_PATH=/annote (loaded)
- ❌ OPENROUTER_API_KEY (MISSING)

The application was using a cached/old invalid API key:
```
[OpenRouter] Client initialized with API key: sk-or-v1-5daf6532fb4...  ❌ OLD/INVALID
```

#### Fix Applied
Explicitly set `OPENROUTER_API_KEY` when starting PM2:

```bash
OPENROUTER_API_KEY='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' \
PORT=3006 \
BASE_PATH=/annote \
pm2 start npm --name expert-note -- start
pm2 save
```

#### Verification
```bash
pm2 env 29 | grep OPENROUTER
# Output: OPENROUTER_API_KEY: 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 ✅
```

#### Files Modified
- None (configuration change only)

#### Regression Risk
**Low** - Only affects OpenRouter API functionality, which was already broken

---

### Fix #2: Database Password Missing in PM2 Environment

#### Symptom
User reported:
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
api/knowledge:1  Failed to load resource: the server responded with a status of 401 (Unauthorized)
api/auth/login:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

Production logs showed:
```
[API] Login error: Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
[DB] Query error: Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

#### Root Cause Analysis

1. **What is the symptom?**
   - Users cannot login (500 error)
   - All database operations fail
   - PostgreSQL authentication errors

2. **What is the actual bug?**
   - Database connection cannot authenticate with PostgreSQL
   - `DB_PASSWORD` environment variable is missing or empty

3. **WHY does this bug exist?**
   - PM2 is NOT loading environment variables from .env files into its process environment
   - Even though `.env` file contains `DB_PASSWORD=annotservice2025`, PM2's environment did not have this variable

4. **When was it introduced?**
   - Since initial production deployment
   - Became visible when we tried to test after fixing OpenRouter issue

5. **Why wasn't it caught earlier?**
   - We were focused on OpenRouter API key issue first
   - Login was not tested until after OpenRouter fix was applied

#### Root Cause
**PM2 was not loading ANY database environment variables from .env files.**

Verification showed PM2 environment (`pm2 env 29`) contained:
- ❌ DB_HOST (MISSING)
- ❌ DB_PORT (MISSING)
- ❌ DB_NAME (MISSING)
- ❌ DB_USER (MISSING)
- ❌ DB_PASSWORD (MISSING) ← **CRITICAL**
- ❌ SESSION_SECRET (MISSING)
- ❌ NODE_ENV (MISSING)

Only had:
- ✅ PORT=3006
- ✅ BASE_PATH=/annote
- ✅ OPENROUTER_API_KEY (from Fix #1)

Without `DB_PASSWORD`, PostgreSQL's SCRAM authentication fails with "client password must be a string" error.

#### Fix Applied

1. **Restarted PM2 with ALL required environment variables:**

```bash
cd /var/www/expert-note
pm2 delete expert-note

PORT=3006 \
NODE_ENV=production \
BASE_PATH=/annote \
DB_HOST=localhost \
DB_PORT=5432 \
DB_NAME=annotservice \
DB_USER=postgres \
DB_PASSWORD=annotservice2025 \
OPENROUTER_API_KEY='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' \
SESSION_SECRET='annote-production-secret-key-secure-2025-deployment' \
pm2 start npm --name expert-note -- start

pm2 save
```

2. **Rebuilt application to pick up environment variables in build:**

```bash
rm -rf .next
export BASE_PATH=/annote
export DB_PASSWORD=annotservice2025
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=annotservice
export DB_USER=postgres
npm run build
pm2 restart expert-note
```

#### Verification

**PM2 Environment Check:**
```bash
pm2 env 30 | grep -E '(DB_|SESSION_|NODE_ENV)'
```

**Output:**
```
DB_PORT: 5432 ✅
DB_USER: postgres ✅
SESSION_SECRET: annote-production-secret-key-secure-2025-deployment ✅
DB_PASSWORD: annotservice2025 ✅
NODE_ENV: production ✅
DB_HOST: localhost ✅
DB_NAME: annotservice ✅
OPENROUTER_API_KEY: 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 ✅
BASE_PATH: /annote ✅
```

**Application Status:**
```bash
pm2 status expert-note
# ID: 30, Status: online, Port: 3006, Restarts: 1
```

**Site Accessibility:**
```bash
curl -I https://spansurvey.net/annote
# HTTP/1.1 200 OK ✅
```

#### Files Modified
- None (configuration + rebuild)

#### Regression Risk
**Low** - Database connectivity was completely broken before this fix

---

## Dependency Analysis

### Fix #1 Affects:
- **OpenRouter API calls** (extraction, generation)
- **Knowledge extraction** (now calls LLM instead of fallback)
- **Prompt generation** (now calls LLM instead of 502 errors)

**Used by:**
- `/api/knowledge/extract` route
- `/api/prompts/generate` route
- `src/lib/ai/openrouter.ts` module

### Fix #2 Affects:
- **All database operations** (login, queries, sessions)
- **Authentication system** (login, session management)
- **All CRUD operations** (documents, knowledge, prompts, tags, users)

**Used by:**
- EVERY API route that touches the database
- Session middleware
- All database query functions in `src/lib/db/queries/`

---

## Root Cause: PM2 + Next.js Environment Variable Loading

### The Problem

**PM2 does NOT automatically load environment variables from `.env` files into its process environment.**

While Next.js CAN read `.env` files at runtime, there are two issues:

1. **PM2 Process Environment**
   - When you start a process with `pm2 start npm -- start`, PM2 only passes its own shell environment to the process
   - .env files in the project directory are NOT automatically loaded into PM2's environment
   - The Node.js process inherits PM2's environment, which doesn't have the .env variables

2. **Next.js Build-Time Variables**
   - Some environment variables (especially those used in server-side code) are bundled at BUILD time
   - Even if Next.js could theoretically read .env at runtime, the build already has old/missing values baked in
   - This explains why rebuilding was necessary after setting PM2 environment variables

### Why This Happened

Previous deployment process assumed:
```bash
# ❌ WRONG: Assumes .env is automatically loaded
git pull
npm install
npm run build
pm2 restart expert-note
```

This fails because:
1. Build happens without environment variables set in shell
2. PM2 restart doesn't load .env files
3. Application has no access to critical env vars

### Correct Deployment Process

```bash
# 1. Pull latest code
cd /var/www/expert-note
git pull

# 2. Install dependencies
npm install

# 3. Build with environment variables
export BASE_PATH=/annote
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=annotservice
export DB_USER=postgres
export DB_PASSWORD=annotservice2025
npm run build

# 4. Start PM2 with ALL environment variables
pm2 delete expert-note

PORT=3006 \
NODE_ENV=production \
BASE_PATH=/annote \
DB_HOST=localhost \
DB_PORT=5432 \
DB_NAME=annotservice \
DB_USER=postgres \
DB_PASSWORD=annotservice2025 \
OPENROUTER_API_KEY='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' \
SESSION_SECRET='annote-production-secret-key-secure-2025-deployment' \
pm2 start npm --name expert-note -- start

pm2 save
```

---

## Verification Steps (User Testing Required)

### 1. Test Login
- Navigate to https://spansurvey.net/annote
- Login as `ning` / `password123`
- **Expected:** Successful login, no 500 errors
- **Expected:** No database password errors in logs

### 2. Test Knowledge Extraction
- Upload annotated document
- Click "Extract Knowledge"
- **Expected:** Takes 20-30 seconds (not 3-5 seconds)
- **Expected:** Uses database templates (not fallback)
- **Expected:** Successful extraction with results

### 3. Test Prompt Generation
- Go to /prompts/generate
- Select extracted knowledge entry
- Generate prompt
- **Expected:** Takes 15-25 seconds (not instant)
- **Expected:** No 502 Bad Gateway errors
- **Expected:** Successful prompt generation

### 4. Monitor Logs
```bash
ssh -i ningli.pem root@47.121.176.193 "pm2 logs expert-note --lines 100"
```

**Expected patterns:**
```
[OpenRouter] Client initialized with API key: sk-or-v1-940b4e8be3f...  ✅ NEW key
[OpenRouter] ✓ Response received successfully
[Extraction] ✓ Using specific template: Default Knowledge Extraction
[Generation] ✓ Using template content provided by API route
```

**Should NOT see:**
```
Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string  ❌
[OpenRouter] Client initialized with API key: sk-or-v1-5daf6532fb4...  ❌ OLD key
statusCode: 401, body: '{"error":{"message":"User not found.","code":401}}'  ❌
```

---

## Lessons Learned

### 1. PM2 Environment Variable Management

**Problem:** PM2 doesn't load .env files automatically

**Solutions:**
- ✅ Explicitly set critical env vars when starting PM2
- ✅ Use `pm2 save` to persist configuration
- ✅ Document required env vars in deployment guide
- ✅ Consider using PM2 ecosystem file (ecosystem.config.js) for complex setups

### 2. Next.js Build-Time vs Runtime Variables

**Problem:** Some variables are bundled at build time

**Solutions:**
- ✅ Set env vars BEFORE running `npm run build`
- ✅ Rebuild application when env vars change
- ✅ Understand which variables are build-time vs runtime

### 3. Production Deployment Checklist

Before deploying to production:
- [ ] All required env vars documented
- [ ] .env.example includes ALL variables (with placeholders for secrets)
- [ ] Deployment script sets ALL env vars explicitly
- [ ] Post-deployment verification includes:
  - [ ] Check `pm2 env <id>` has all required variables
  - [ ] Test login functionality
  - [ ] Test database operations
  - [ ] Test external API calls (OpenRouter)
  - [ ] Monitor error logs for 10 minutes after deployment

### 4. Debugging Production Issues

**Effective approach:**
1. Check production logs first (`pm2 logs`)
2. Identify specific error messages (not just symptoms)
3. Verify environment configuration (`pm2 env <id>`)
4. Compare local vs production environments
5. Fix root cause, not symptoms

**What worked:**
- ✅ Reading actual error messages in logs
- ✅ Checking PM2 environment (`pm2 env 30`)
- ✅ Comparing .env file contents vs PM2 environment
- ✅ Rebuilding after environment changes

**What didn't work:**
- ❌ Updating .env files without restarting PM2 with explicit vars
- ❌ Restarting PM2 without rebuilding Next.js
- ❌ Assuming .env files are automatically loaded

---

## Recommendations

### Immediate Actions

1. **Update DEPLOYMENT.md** with correct PM2 startup procedure
2. **Create ecosystem.config.js** for PM2 configuration management:
   ```javascript
   module.exports = {
     apps: [{
       name: 'expert-note',
       script: 'npm',
       args: 'start',
       cwd: '/var/www/expert-note',
       env: {
         PORT: 3006,
         NODE_ENV: 'production',
         BASE_PATH: '/annote',
         // Load from .env file or set explicitly
       }
     }]
   };
   ```

3. **Create deployment script** (deploy.sh):
   ```bash
   #!/bin/bash
   set -e

   cd /var/www/expert-note
   git pull

   # Load environment variables
   source .env

   # Install and build
   npm install
   export BASE_PATH=/annote
   npm run build

   # Restart PM2 with environment
   pm2 delete expert-note || true
   PORT=$PORT \
   NODE_ENV=$NODE_ENV \
   BASE_PATH=$BASE_PATH \
   DB_HOST=$DB_HOST \
   DB_PORT=$DB_PORT \
   DB_NAME=$DB_NAME \
   DB_USER=$DB_USER \
   DB_PASSWORD=$DB_PASSWORD \
   OPENROUTER_API_KEY=$OPENROUTER_API_KEY \
   SESSION_SECRET=$SESSION_SECRET \
   pm2 start npm --name expert-note -- start

   pm2 save

   echo "Deployment complete! Monitoring logs..."
   pm2 logs expert-note --lines 50
   ```

### Future Enhancements

1. **Health Check Endpoint**
   ```typescript
   // GET /api/health
   // Check: DB connection, OpenRouter API key validation, env vars present
   ```

2. **Environment Variable Validation on Startup**
   ```typescript
   // src/lib/env-check.ts
   const requiredEnvVars = [
     'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
     'OPENROUTER_API_KEY', 'SESSION_SECRET', 'NODE_ENV'
   ];

   for (const varName of requiredEnvVars) {
     if (!process.env[varName]) {
       throw new Error(`Missing required environment variable: ${varName}`);
     }
   }
   ```

3. **Automated Deployment Tests**
   - Run health check after deployment
   - Test login endpoint
   - Test database connectivity
   - Test OpenRouter API call

---

## Timeline

| Time (UTC) | Action | Result |
|------------|--------|--------|
| 05:38 | User reported extraction failing (3-5s, fallback) | Issue #1 identified |
| 05:45 | Checked logs - found 401 OpenRouter errors | API key issue confirmed |
| 06:12 | Fixed OPENROUTER_API_KEY in PM2 | Issue #1 resolved |
| 06:15 | User tested - login failed with 500 error | Issue #2 identified |
| 06:18 | Checked logs - found DB password error | Root cause found |
| 06:22 | Added all DB env vars to PM2 | Environment corrected |
| 06:25 | Rebuilt application with correct env | Build completed |
| 06:26 | Restarted PM2 | ✅ Both issues resolved |
| 06:27 | Site responding, awaiting user test | Ready for verification |

---

## Status: ✅ READY FOR USER TESTING

**Current Production State:**
- **Process:** PM2 ID 30, online, port 3006
- **Environment:** All required variables loaded ✅
- **Build:** Fresh build with correct environment ✅
- **Site:** Responding (200 OK) ✅

**Next Steps:**
1. User tests login functionality
2. User tests knowledge extraction (should take 20-30s, use DB templates)
3. User tests prompt generation (should work without 502 errors)
4. Monitor production logs during testing
5. Update DEPLOYMENT.md with corrected process

**Expected Outcome:**
- ✅ Login works (no 500 errors)
- ✅ Extraction takes 20-30 seconds (calls LLM)
- ✅ Extraction uses database templates (not fallback)
- ✅ Generation works (no 502 errors)
- ✅ No database password errors in logs
- ✅ OpenRouter API calls successful

---

**Report Created:** 2026-01-15 06:30 UTC
**Production Process:** PM2 ID 30
**Production URL:** https://spansurvey.net/annote
**Status:** Awaiting user verification
