# Local Setup Guide

This guide helps you set up the Expert Note system on a new computer.

---

## Prerequisites

### Required Software

| Software | Version | Check Command |
|----------|---------|---------------|
| Node.js | v22+ | `node --version` |
| npm | v10+ | `npm --version` |
| PostgreSQL | 16+ | `psql --version` |

### Install Prerequisites (macOS)

```bash
# Install Homebrew if not present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install PostgreSQL
brew install postgresql@16
brew services start postgresql@16

# Add PostgreSQL to PATH (add to ~/.zshrc)
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
```

---

## Setup Steps

### 1. Clone/Sync the Project

The project syncs via Dropbox. Ensure Dropbox is installed and synced:

```bash
cd ~/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note
```

Or if using a local copy:
```bash
cd /path/to/expert-note
```

### 2. Install Dependencies

```bash
npm install
```

**Key Dependencies:**
- `next@16.1.1` - React framework
- `react@19.2.3` - UI library
- `pg` - PostgreSQL client
- `bcryptjs` - Password hashing
- `iron-session` - Session management
- `uuid` - ID generation
- `date-fns` - Date formatting
- `tailwindcss` - Styling

### 3. Create Environment File

Create `.env.local` in the project root:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=annotservice
DB_USER=YOUR_USERNAME

# AI (OpenRouter)
OPENROUTER_API_KEY=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

# Session
SESSION_SECRET=annote-session-secret-key-dev-2025-very-secure
```

**Note:** Replace `YOUR_USERNAME` with your PostgreSQL username (e.g., `ningli`, or your macOS username).

### 4. Set Up Database

```bash
# Create the database
psql -U YOUR_USERNAME -d postgres -c "CREATE DATABASE annotservice;"

# Run schema (creates tables)
psql -U YOUR_USERNAME -d annotservice -f sql/schema.sql

# Run seed data (users + tags)
psql -U YOUR_USERNAME -d annotservice -f sql/seed.sql
```

**Database Tables Created:**
- `users` - User accounts (10 seeded)
- `documents` - Source documents
- `knowledge_entries` - Extracted knowledge
- `annotations` - Individual annotations
- `tags` - Classification tags (10 seeded)
- `knowledge_tags` - Tag associations

### 5. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000` (or next available port if 3000 is in use).

---

## Test Credentials

All seeded users have the same password: `password123`

| Username | Role |
|----------|------|
| ning | admin |
| admin | admin |
| expert1 | expert |
| expert2 | expert |
| student1 | student |
| student2 | student |
| student3 | student |
| researcher1 | researcher |
| researcher2 | researcher |
| guest | guest |

---

## Verification Checklist

After setup, verify each component works:

- [ ] **Server starts**: `npm run dev` runs without errors
- [ ] **Login works**: Navigate to `/login`, use `ning` / `password123`
- [ ] **Dashboard loads**: Shows document list and stats
- [ ] **Knowledge Base**: Navigate to `/knowledge`, see entries
- [ ] **Edit page**: Click Edit on a knowledge entry (no 404)
- [ ] **Download**: Click Download on a knowledge entry (saves .md file)

---

## Troubleshooting

### PostgreSQL Connection Failed

```bash
# Check if PostgreSQL is running
brew services list

# Start PostgreSQL
brew services start postgresql@16

# Verify connection
psql -U YOUR_USERNAME -d annotservice -c "SELECT 1;"
```

### Port Already in Use

Next.js will automatically use the next available port. Check console output for actual port.

### Database Does Not Exist

```bash
psql -U YOUR_USERNAME -d postgres -c "CREATE DATABASE annotservice;"
```

### Tables Missing

```bash
psql -U YOUR_USERNAME -d annotservice -f sql/schema.sql
psql -U YOUR_USERNAME -d annotservice -f sql/seed.sql
```

### Module Not Found Errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### Turbopack Cache Issues

```bash
rm -rf .next
npm run dev
```

---

## File Structure Reference

```
expert-note/
├── .env.local              # Environment config (create this)
├── .next/                  # Build cache (auto-generated)
├── node_modules/           # Dependencies (auto-generated)
├── package.json            # Project dependencies
├── sql/
│   ├── schema.sql          # Database structure
│   └── seed.sql            # Initial data
├── src/
│   ├── app/                # Next.js pages and API routes
│   ├── components/         # React components
│   ├── lib/                # Utilities (db, auth, ai)
│   └── types/              # TypeScript definitions
├── CLAUDE.md               # Project instructions
├── LOCAL_SETUP.md          # This file
└── README.md               # General documentation
```

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit

# Database access
psql -U YOUR_USERNAME -d annotservice
```

---

## Syncing Between Computers

Since the project is in Dropbox:

1. **On current computer**: Ensure all changes are saved and Dropbox is synced
2. **On new computer**:
   - Wait for Dropbox sync to complete
   - Run `npm install` (node_modules is gitignored/not synced)
   - Create `.env.local` (not synced for security)
   - Set up database (local to each machine)
   - Run `npm run dev`

**Note:** Database content is local to each machine. Export/import SQL dumps if you need to transfer data.

---

*Last updated: January 6, 2026*
