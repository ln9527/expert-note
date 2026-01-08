#!/bin/bash
# Verification script for Migration 006
# Usage: ./scripts/verify-migration-006.sh

set -e

echo "🔍 Verifying Migration 006: Prompt Enhancements"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Must run from project root${NC}"
  exit 1
fi

echo "1️⃣  Checking database columns..."
DB_CHECK=$(psql -U ningli -d annotservice -t -c "
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_name = 'system_prompts'
  AND column_name IN ('source_document_ids', 'base_prompt_id');
" 2>&1)

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Database connection failed${NC}"
  echo "Error: $DB_CHECK"
  exit 1
fi

COLUMN_COUNT=$(echo $DB_CHECK | xargs)
if [ "$COLUMN_COUNT" == "2" ]; then
  echo -e "${GREEN}✅ Both columns exist${NC}"
else
  echo -e "${YELLOW}⚠️  Expected 2 columns, found: $COLUMN_COUNT${NC}"
  echo "Run migration: psql -U ningli -d annotservice -f sql/migrations/006_prompt_enhancements.sql"
  exit 1
fi

echo ""
echo "2️⃣  Checking database index..."
INDEX_CHECK=$(psql -U ningli -d annotservice -t -c "
  SELECT COUNT(*)
  FROM pg_indexes
  WHERE tablename = 'system_prompts'
  AND indexname = 'idx_system_prompts_base_prompt_id';
" 2>&1)

INDEX_COUNT=$(echo $INDEX_CHECK | xargs)
if [ "$INDEX_COUNT" == "1" ]; then
  echo -e "${GREEN}✅ Index exists${NC}"
else
  echo -e "${YELLOW}⚠️  Index not found${NC}"
fi

echo ""
echo "3️⃣  Verifying prompt_tags table..."
TAGS_CHECK=$(psql -U ningli -d annotservice -t -c "
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_name = 'prompt_tags';
" 2>&1)

TAGS_COUNT=$(echo $TAGS_CHECK | xargs)
if [ "$TAGS_COUNT" == "1" ]; then
  echo -e "${GREEN}✅ prompt_tags table exists${NC}"
else
  echo -e "${RED}❌ prompt_tags table missing (run migration 002)${NC}"
  exit 1
fi

echo ""
echo "4️⃣  Checking TypeScript compilation..."
TS_OUTPUT=$(npx tsc --noEmit 2>&1)
TS_EXIT_CODE=$?

# Filter for prompt-related errors only
PROMPT_ERRORS=$(echo "$TS_OUTPUT" | grep -i "prompts\|systemprompt" || true)

if [ -n "$PROMPT_ERRORS" ]; then
  echo -e "${RED}❌ TypeScript errors found in prompt code:${NC}"
  echo "$PROMPT_ERRORS"
  exit 1
else
  echo -e "${GREEN}✅ No prompt-related TypeScript errors${NC}"
fi

echo ""
echo "5️⃣  Checking file modifications..."

# Check if key files exist and contain new fields
FILES_TO_CHECK=(
  "src/types/index.ts:sourceDocumentIds"
  "src/lib/db/queries/prompts.ts:source_document_ids"
  "src/app/api/prompts/generate/route.ts:sourceDocumentIds"
  "src/app/api/prompts/route.ts:sourceDocumentIds"
  "src/app/api/prompts/[id]/route.ts:sourceDocumentIds"
)

ALL_FILES_OK=true
for FILE_CHECK in "${FILES_TO_CHECK[@]}"; do
  IFS=':' read -r FILE FIELD <<< "$FILE_CHECK"

  if [ ! -f "$FILE" ]; then
    echo -e "${RED}❌ File not found: $FILE${NC}"
    ALL_FILES_OK=false
  elif ! grep -q "$FIELD" "$FILE"; then
    echo -e "${RED}❌ Field '$FIELD' not found in $FILE${NC}"
    ALL_FILES_OK=false
  fi
done

if [ "$ALL_FILES_OK" = true ]; then
  echo -e "${GREEN}✅ All files contain required fields${NC}"
fi

echo ""
echo "6️⃣  Summary of table schema..."
psql -U ningli -d annotservice -c "
  SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
  FROM information_schema.columns
  WHERE table_name = 'system_prompts'
  AND column_name IN (
    'source_knowledge_ids',
    'source_document_ids',
    'base_prompt_id',
    'is_deleted',
    'deleted_at'
  )
  ORDER BY column_name;
"

echo ""
echo "================================================"
echo -e "${GREEN}✅ Migration 006 verification complete!${NC}"
echo ""
echo "Next steps:"
echo "  - Start dev server: npm run dev"
echo "  - Test prompt generation with documents"
echo "  - Test prompt versioning with basePromptId"
echo ""
