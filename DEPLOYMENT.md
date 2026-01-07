# Expert Note - Production Deployment Guide

## Server Information

| Item | Value |
|------|-------|
| Server IP | 47.121.176.193 |
| Production URL | https://spansurvey.net/annote |
| Port | 3006 |
| SSH Command | `ssh -i ningli.pem root@47.121.176.193` |
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
- **Password**: testpass123

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
ssh -i /Users/ningli/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193
```

### Update & Restart
```bash
cd /var/www/expert-note
git pull origin main
npm install
npm run build
pm2 restart expert-note
```

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
      DB_PASSWORD: 'testpass123',
      OPENROUTER_API_KEY: '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',
      SESSION_SECRET: 'annote-session-secret-production-2026-very-secure-key'
    }
  }]
};
```

### 3. Setup Database
```bash
sudo -u postgres psql -c "CREATE DATABASE annotservice;"
sudo -u postgres psql -d annotservice -f /var/www/expert-note/sql/schema.sql
sudo -u postgres psql -d annotservice -f /var/www/expert-note/sql/seed.sql
```

### 4. Build & Start
```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### 5. Configure Nginx
Add to `/etc/nginx/sites-enabled/default` (inside the server block):
```nginx
location /annote {
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
**Symptom**: `password authentication failed for user "postgres"`

**Root Cause**: PostgreSQL password not set or wrong password in environment.

**Solution**:
```bash
# Set the postgres password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'testpass123';"

# Verify connection works
PGPASSWORD=testpass123 psql -h localhost -U postgres -d annotservice -c 'SELECT 1'
```

### Issue 2: Environment Variables Not Loaded
**Symptom**: App starts but DB connection fails even with correct .env.local

**Root Cause**: Next.js production mode doesn't automatically read .env.local at runtime.

**Solution**: Use PM2 ecosystem.config.js to pass environment variables (see above).

### Issue 3: Redirect Loop on /annote/
**Symptom**: Infinite redirects between /annote and /annote/

**Root Cause**: Nginx trailing slash redirect conflicts with Next.js trailingSlash setting.

**Solution**:
- Use `location /annote` (without trailing slash) in Nginx
- Remove the `location = /annote { return 301 /annote/; }` rule

### Issue 4: Static Assets 404
**Symptom**: Page loads but CSS/JS files return 404

**Root Cause**: BASE_PATH not set correctly at build time.

**Solution**: Ensure BASE_PATH is in environment when running `npm run build`:
```bash
# In ecosystem.config.js or .env.local
BASE_PATH=/annote
```

### Issue 5: Session/Cookie Not Persisting
**Symptom**: Login works but user is logged out on page refresh

**Root Cause**: Cookie path doesn't match BASE_PATH.

**Solution**: Check session configuration has correct cookie path in `src/lib/auth/session.ts`.

---

## Database Migrations

Run migrations in order:
```bash
sudo -u postgres psql -d annotservice -f sql/migrations/001_add_location_to_annotations.sql
sudo -u postgres psql -d annotservice -f sql/migrations/003_update_extraction_template.sql
```

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

*Last updated: January 7, 2026*
