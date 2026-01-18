# Expert Note - Production Deployment Guide

## Server Information

| Item | Value |
|------|-------|
| Server IP | 47.121.176.193 |
| Production URL | https://spansurvey.net/annote |
| Port | 3006 |
| SSH Command | `ssh -i /Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193` |
| App Location | `/var/www/expert-note` |
| PM2 Process | `expert-note` |

---

## Credentials & Tokens

### GitHub
- **Username**: ln9527
- **Repository**: https://github.com/ln9527/expert-note
- **Personal Access Token**: `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`

### Production Database
- **Host**: localhost
- **Port**: 5432
- **Database**: annotservice
- **User**: postgres
- **Password**: annotservice2025

### Application Users
All users have password: `password123`
- ning, admin, expert1, expert2, student1-3, researcher1-2, guest

### API Keys
- **OpenRouter**: `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`

---

## Deployment Architecture

```
                    ┌─────────────────┐
                    │   Internet      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Nginx (443)    │
                    │  spansurvey.net │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   /chat/               /annote/            /teaching/
        │                    │                    │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│ chat-service  │   │ expert-note   │   │   teaching    │
│   :3001       │   │   :3006       │   │   :3003       │
└───────────────┘   └───────────────┘   └───────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   annotservice  │
                    └─────────────────┘
```

---

## Quick Deployment Commands

### SSH to Server
```bash
ssh -i /Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193
```

### Update & Restart
```bash
cd /var/www/expert-note
git pull origin main
npm install
export BASE_PATH=/annote  # CRITICAL: Must set before build!
npm run build
pm2 restart expert-note
```

> **CRITICAL**: Always set `BASE_PATH=/annote` before running `npm run build`.
> Next.js `basePath` and `assetPrefix` are applied at BUILD TIME, not runtime.
> Without this, JS/CSS assets will fail to load with "Unexpected token '<'" errors.

### View Logs
```bash
pm2 logs expert-note --lines 50
```

### Check Status
```bash
pm2 status expert-note
```

---

## Full Deployment Steps (First Time)

### 1. Clone Repository
```bash
cd /var/www
git clone https://github.com/ln9527/expert-note.git expert-note
cd expert-note
npm install
```

### 2. Create Ecosystem Config
Create `/var/www/expert-note/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'expert-note',
    cwd: '/var/www/expert-note',
    script: 'npm',
    args: 'start -- -p 3006',
    env: {
      NODE_ENV: 'production',
      PORT: 3006,
      BASE_PATH: '/annote',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'annotservice',
      DB_USER: 'postgres',
      DB_PASSWORD: 'annotservice2025',
      OPENROUTER_API_KEY: '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',
      SESSION_SECRET: 'annote-production-secret-key-secure-2025-deployment'
    }
  }]
};
```

### 3. Setup Database
```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE annotservice;"

# Set postgres password (required for ecosystem.config.js connection)
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'annotservice2025';"

# Run schema and seed
sudo -u postgres psql -d annotservice -f /var/www/expert-note/sql/schema.sql
sudo -u postgres psql -d annotservice -f /var/www/expert-note/sql/seed.sql

# Run migrations
sudo -u postgres psql -d annotservice -f /var/www/expert-note/sql/migrations/001_add_location_to_annotations.sql
sudo -u postgres psql -d annotservice -f /var/www/expert-note/sql/migrations/002_prompt_tags.sql
sudo -u postgres psql -d annotservice -f /var/www/expert-note/sql/migrations/003_update_extraction_template.sql
```

### 4. Build & Start
```bash
# CRITICAL: Set BASE_PATH before build!
export BASE_PATH=/annote
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

### 5. Configure Nginx
Add to `/etc/nginx/sites-enabled/default` (inside the server block):
```nginx
location /annote {
    # Timeouts for LLM API calls (extraction/generation can take 1-2 minutes)
    proxy_read_timeout 300s;
    proxy_connect_timeout 30s;
    proxy_send_timeout 300s;

    proxy_pass http://localhost:3006;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

Then reload:
```bash
nginx -t && systemctl reload nginx
```

---

## Common Issues & Solutions

### Issue 1: Database Authentication Failed
**Symptom**: `password authentication failed for user "postgres"` or `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`

**Root Cause**: PostgreSQL password not set, or PM2 environment missing DB_PASSWORD.

**Solution**:
```bash
# 1. Set the postgres password in PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'annotservice2025';"

# 2. Verify PM2 has the DB_PASSWORD set
pm2 env <process-id> | grep DB_PASSWORD

# 3. If missing, restart PM2 with explicit env vars (see "PM2 Environment Variables" below)
```

### Issue 2: PM2 Environment Variables Not Loaded (CRITICAL)
**Symptom**: App starts but DB connection fails, OpenRouter returns 401, or other env-dependent features fail

**Root Cause**: **PM2 does NOT automatically load .env files!** Even if .env, .env.local, or .env.production exist, PM2 won't read them.

**Solution**: Explicitly set ALL required environment variables when starting PM2:

```bash
# Delete the old process first
pm2 delete expert-note

# Start with ALL environment variables explicitly set
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

# Save the configuration
pm2 save

# Verify environment variables are set
pm2 env <process-id> | grep -E '(DB_|OPENROUTER|SESSION)'
```

**Alternative**: Use `ecosystem.config.js` (see "First Time Setup" section).

### Issue 3: OpenRouter API 401 Unauthorized
**Symptom**: Knowledge extraction completes in 3-5 seconds (too fast), returns fallback results, or 502 errors on generation

**Root Cause**: OPENROUTER_API_KEY not set in PM2 environment, or using old/invalid key.

**Solution**:
```bash
# Check current API key in PM2 env
pm2 env <process-id> | grep OPENROUTER

# If missing or wrong, restart PM2 with correct key (see Issue 2 above)
```

### Issue 4: 504 Gateway Timeout on Large Documents
**Symptom**: Extraction/generation times out after 60 seconds on documents with many annotations

**Root Cause**: Nginx default `proxy_read_timeout` is 60 seconds, but LLM calls can take 1-3 minutes.

**Solution**: Add timeout settings to nginx `/annote` location (see "Configure Nginx" section above).

### Issue 5: Environment Variables Not Loaded (Legacy)
**Symptom**: App starts but DB connection fails even with correct .env.local

**Root Cause**: Next.js production mode doesn't automatically read .env.local at runtime.

**Solution**: Use PM2 ecosystem.config.js or explicit env vars to pass environment variables (see Issue 2).

### Issue 6: Redirect Loop on /annote/
**Symptom**: Infinite redirects between /annote and /annote/

**Root Cause**: Nginx trailing slash redirect conflicts with Next.js trailingSlash setting.

**Solution**:
- Use `location /annote` (without trailing slash) in Nginx
- Remove the `location = /annote { return 301 /annote/; }` rule

### Issue 7: Static Assets 404
**Symptom**: Page loads but CSS/JS files return 404

**Root Cause**: BASE_PATH not set correctly at build time.

**Solution**: Ensure BASE_PATH is in environment when running `npm run build`:
```bash
# In ecosystem.config.js or .env.local
BASE_PATH=/annote
```

### Issue 8: Session/Cookie Not Persisting
**Symptom**: Login works but user is logged out on page refresh

**Root Cause**: Cookie path doesn't match BASE_PATH.

**Solution**: Check session configuration has correct cookie path in `src/lib/auth/session.ts`.

---

## Database Migrations

Run migrations in order:
```bash
sudo -u postgres psql -d annotservice -f sql/migrations/001_add_location_to_annotations.sql
sudo -u postgres psql -d annotservice -f sql/migrations/002_prompt_tags.sql
sudo -u postgres psql -d annotservice -f sql/migrations/003_update_extraction_template.sql
sudo -u postgres psql -d annotservice -f sql/migrations/004_soft_delete.sql
sudo -u postgres psql -d annotservice -f sql/migrations/005_fix_prompt_templates.sql
sudo -u postgres psql -d annotservice -f sql/migrations/006_prompt_enhancements.sql
```

> **Note**: If migrations fail due to permission issues, run inline:
> ```bash
> sudo -u postgres psql -d annotservice -c "CREATE TABLE IF NOT EXISTS prompt_tags (prompt_id UUID REFERENCES system_prompts(id) ON DELETE CASCADE, tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY (prompt_id, tag_id));"
> ```

---

## Deployment History

### 2026-01-08: Major System Enhancement Release

**Status:** Ready for Deployment

**Overview:** Major feature release with database template system, enhanced prompt generation, knowledge table view, document search/filters, and tag inheritance.

**Key Changes:**
- Database templates as source of truth (verified against schema)
- Enhanced prompt generation (document-based, versioning, tags)
- Knowledge table view with sorting and toggle
- Document search (fuzzy matching, debounced)
- Comprehensive document filters (tags, status, user, date)
- Tag inheritance (documents → knowledge)
- Terminology update ("Generation Guide")
- Annotation statistics bug fix
- Session timeout increased (3min → 2hrs)

**Migrations:**
- `005_fix_prompt_templates.sql` - Template format alignment
- `006_prompt_enhancements.sql` - Document sources, versioning, tags

**Files Changed:**
- 31 modified files
- 6 new components
- 2 database migrations
- ~3,000 lines added
- 35+ documentation files

**Components Added:**
- ViewModeToggle (reusable list/table switch)
- KnowledgeTable (sortable, interactive)
- SearchBox (reusable, debounced)
- DocumentFilters (comprehensive filtering)
- BasePromptSelector (versioning support)
- DocumentSelector (multi-source)

**Bug Fixes:**
- JSX syntax errors (multiple components)
- Missing database table definitions
- Template selector state persistence
- String concatenation in annotation statistics
- Session authentication timeout

**Testing:**
- 45+ tests completed
- 100% pass rate
- Zero compilation errors
- All features verified locally

**Deployment Checklist:** See `docs/DEPLOYMENT_CHECKLIST_2026-01-08.md`

**Pre-Deployment Verification:**
- [x] All changes committed
- [x] Documentation updated
- [x] Migrations tested locally
- [x] Build succeeds with BASE_PATH=/annote
- [x] No TypeScript errors
- [x] Database schema verified

**Estimated Downtime:** 15-20 minutes

**Rollback:** Git commit `e1ef668` (previous stable version)

---

## Verification Checklist

After deployment, verify:

- [ ] Main page loads: `curl -I https://spansurvey.net/annote`
- [ ] Login works: `curl -X POST https://spansurvey.net/annote/api/auth/login -H "Content-Type: application/json" -d '{"username":"ning","password":"password123"}'`
- [ ] Static assets load (check browser console)
- [ ] Database connected (try creating a document)
- [ ] PM2 shows online: `pm2 status expert-note`

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Check logs for error
pm2 logs expert-note --lines 100

# 2. Rollback to previous commit
cd /var/www/expert-note
git log --oneline -5  # Find previous good commit
git checkout <commit-hash>
npm install
npm run build
pm2 restart expert-note

# 3. Or restore from backup (if available)
```

---

## Other Services on This Server

| Service | Port | Path | Location |
|---------|------|------|----------|
| auth-service | 3002 | /auth/ | - |
| chat-service | 3001 | /chat/ | - |
| teaching-service | 3003 | /teaching/ | /var/www/teaching-service |
| **expert-note** | **3006** | **/annote/** | **/var/www/expert-note** |

**Important**: Do not modify other services' configurations.

---

## Useful Commands

```bash
# PM2 Commands
pm2 list                          # List all processes
pm2 logs expert-note              # View logs
pm2 restart expert-note           # Restart
pm2 stop expert-note              # Stop
pm2 delete expert-note            # Remove
pm2 save                          # Save current config

# Nginx Commands
nginx -t                          # Test config
systemctl reload nginx            # Reload
systemctl status nginx            # Status

# Database Commands
sudo -u postgres psql -d annotservice    # Connect to DB
\dt                                       # List tables
\q                                        # Quit
```

---

*Last updated: January 15, 2026*
*Latest: PM2 environment variable fix + nginx timeout increase (5 minutes)*
