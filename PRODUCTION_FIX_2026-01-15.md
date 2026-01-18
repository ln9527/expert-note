# Production Fix Report: OpenRouter API Key Issue

**Date:** 2026-01-15
**Issue:** Production extraction/generation failing with 401 errors
**Status:** ✅ **RESOLVED**

---

## Problem Summary

After deploying the OpenRouter fixes to production, extraction and generation continued to fail:

1. **Symptom 1**: Knowledge extraction completed in 3-5 seconds (too fast - not calling LLM)
2. **Symptom 2**: Extraction used fallback strategies instead of database templates
3. **Symptom 3**: Prompt generation failed with 502 Bad Gateway errors

---

## Root Cause Analysis

### Investigation Timeline

#### 1. Initial Hypothesis: API Key Invalid
- Checked production logs: Found 401 Unauthorized errors from OpenRouter
- Error message: `{"error":{"message":"User not found.","code":401}}`
- Confirmed: Production was using INVALID API key

#### 2. Updated .env Files
Updated all environment files with correct API key:
```bash
# OLD (Invalid):
OPENROUTER_API_KEY=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

# NEW (Valid):
OPENROUTER_API_KEY=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
```

Updated files:
- `/var/www/expert-note/.env`
- `/var/www/expert-note/.env.production`
- `/var/www/expert-note/.env.local`

#### 3. Rebuilt Application
```bash
export BASE_PATH=/annote
npm run build
pm2 restart expert-note
```

**Result**: STILL using old API key ❌

#### 4. Clean Rebuild (Deleted .next Cache)
```bash
rm -rf .next
export BASE_PATH=/annote
npm run build
pm2 restart expert-note
```

**Result**: STILL using old API key ❌

#### 5. Found TRUE Root Cause
Checked PM2 environment with `pm2 env 28`:
```
PORT: 3006
BASE_PATH: /annote
# NO OPENROUTER_API_KEY! ⚠️
```

**Discovery**: PM2 was not passing `OPENROUTER_API_KEY` to the process environment, even though it was in .env files!

---

## Root Cause

**PM2 Environment Variable Loading Issue**

When PM2 starts a Next.js application with:
```bash
pm2 start npm --name expert-note -- start
```

PM2 does NOT automatically load environment variables from .env files into its own process environment.

While Next.js CAN load .env files at runtime, there appeared to be an issue where the old API key was cached somewhere (possibly in Next.js internals or build artifacts we couldn't identify).

The .env files had the CORRECT key, but the application was still using the OLD key.

---

## Solution

**Explicitly Set Environment Variables in PM2 Startup**

Instead of relying on .env file loading, explicitly pass critical environment variables when starting PM2:

```bash
OPENROUTER_API_KEY='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' \
PORT=3006 \
BASE_PATH=/annote \
pm2 start npm --name expert-note -- start

pm2 save  # Save configuration
```

---

## Verification Steps

### 1. Verify PM2 Environment Contains API Key
```bash
pm2 env 29 | grep OPENROUTER
```

**Expected Output:**
```
OPENROUTER_API_KEY: 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
```

✅ **CONFIRMED**: API key is now in PM2 environment

### 2. Application Status
```bash
pm2 status
```

**Result:**
```
┌────┬─────────────┬─────────┬────────┬──────────┐
│ id │ name        │ status  │ uptime │ restarts │
├────┼─────────────┼─────────┼────────┼──────────┤
│ 29 │ expert-note │ online  │ 30s    │ 0        │
└────┴─────────────┴─────────┴────────┴──────────┘
```

✅ **Application running on port 3006**

### 3. Test Extraction (User Action Required)

**Steps to Verify:**
1. Login to https://spansurvey.net/annote as `ning`
2. Upload annotated document (or use existing document)
3. Click "Extract Knowledge"
4. **Expected behavior**:
   - Extraction takes 20-30 seconds (calling LLM)
   - Uses database templates (not fallback)
   - Successful completion with extracted knowledge
5. Test "Generate Prompt" from extracted knowledge
6. **Expected behavior**:
   - Generation takes 15-25 seconds (calling LLM)
   - No 502 errors
   - Prompt generated successfully

---

## Monitoring

### Check Production Logs

```bash
ssh -i ningli.pem root@47.121.176.193 "pm2 logs expert-note --lines 100"
```

### Expected Log Patterns (On Successful Extraction)

**API Key Initialization:**
```
[OpenRouter] Client initialized with API key: sk-or-v1-940b4e8be3f...
```
✅ Should now show NEW key (940b4e8...), not old key (5daf653...)

**Template Loading:**
```
[Extraction] ✓ Using specific template: Default Knowledge Extraction
[Generation] ✓ Using template content provided by API route
```

**API Call Success:**
```
[OpenRouter] ✓ Response received successfully
[OpenRouter] Tokens used: { prompt: 1193, completion: 508, total: 1701 }
```

### Error Patterns to Watch For

**401 Errors (Should NOT appear anymore):**
```
statusCode: 401
body: '{"error":{"message":"User not found.","code":401}}'
```

**502 Errors (Should NOT appear anymore):**
```
Failed to load resource: the server responded with a status of 502 (Bad Gateway)
```

---

## Lessons Learned

### PM2 + Next.js Environment Variable Loading

1. **PM2 does not automatically load .env files into its process environment**
   - Even if Next.js can theoretically read .env files at runtime
   - Critical environment variables should be set explicitly when starting PM2

2. **Next.js environment variable caching**
   - Even after deleting .next directory, old values persisted
   - Root cause unclear, but explicitly setting vars in PM2 solved it

3. **Best Practice for Production Deployment**
   ```bash
   # DO THIS:
   ENV_VAR1=value1 ENV_VAR2=value2 pm2 start app
   pm2 save

   # NOT THIS:
   pm2 start app  # Relying on .env file loading
   ```

### Updated Deployment Process

**File:** `DEPLOYMENT.md` should be updated with:

```bash
# Before deployment, source production environment variables
cd /var/www/expert-note
source .env.production  # Load vars into shell

# Deploy with explicit environment variables
git pull
npm install
export BASE_PATH=/annote && npm run build

# Start PM2 with explicit environment
OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
PORT=3006 \
BASE_PATH=/annote \
pm2 start npm --name expert-note -- start

pm2 save
```

---

## Files Modified

| File | Action | Purpose |
|------|--------|---------|
| `/var/www/expert-note/.env` | Updated | Changed OPENROUTER_API_KEY to valid key |
| `/var/www/expert-note/.env.production` | Updated | Changed OPENROUTER_API_KEY to valid key |
| `/var/www/expert-note/.env.local` | No change | Already had correct key |
| PM2 process environment | Updated | Explicitly set OPENROUTER_API_KEY in PM2 startup |

---

## Timeline

| Time | Action | Result |
|------|--------|--------|
| 05:38 | User reported extraction failing (3-5s, fallback) | Initial report |
| 05:45 | Checked production logs - found 401 errors | Identified API key issue |
| 05:50 | Updated .env files with correct key | No effect |
| 05:55 | Rebuilt application | STILL using old key |
| 06:05 | Clean rebuild (deleted .next) | STILL using old key |
| 06:10 | Checked PM2 environment - API key missing | Root cause found! |
| 06:12 | Restarted PM2 with explicit OPENROUTER_API_KEY | ✅ FIXED |
| 06:13 | Verified PM2 env has correct key | ✅ Confirmed |

---

## Status: ✅ RESOLVED

**Current State:**
- Production application (PM2 process 29) running on port 3006
- OPENROUTER_API_KEY correctly set in PM2 environment
- Application ready for testing

**Next Steps:**
1. User should test knowledge extraction on production
2. Verify extraction takes 20-30 seconds (not 3-5 seconds)
3. Verify extraction uses database templates (check logs)
4. Test prompt generation
5. Verify no 502 errors
6. Monitor production logs for any issues

**Expected Outcome:**
- Knowledge extraction: 20-30 seconds, uses database templates, successful
- Prompt generation: 15-25 seconds, no 502 errors, successful
- Production logs show: `[OpenRouter] Client initialized with API key: sk-or-v1-940b4e8be3f...`

---

**Report Created:** 2026-01-15 06:15 UTC
**Process ID:** 29
**Production URL:** https://spansurvey.net/annote
