#!/bin/bash
# Verification script for Agent 3 changes
# Run this after migration to verify all changes are correct

echo "=== Agent 3 Verification Script ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. Checking migration file exists..."
if [ -f "sql/migrations/007_org_creation_improvements.sql" ]; then
    echo -e "${GREEN}✓${NC} Migration file exists"
else
    echo -e "${RED}✗${NC} Migration file NOT found"
fi

echo ""
echo "2. Checking TypeScript types updated..."

# Check InvitationCodeType
if grep -q "export type InvitationCodeType = 'individual' | 'org_owner' | 'org_member'" src/types/index.ts; then
    echo -e "${GREEN}✓${NC} InvitationCodeType updated correctly"
else
    echo -e "${RED}✗${NC} InvitationCodeType NOT updated"
fi

# Check InvitationCode interface (should NOT have orgName)
if grep -A8 "export interface InvitationCode" src/types/index.ts | grep -q "orgName"; then
    echo -e "${RED}✗${NC} InvitationCode still has orgName field"
else
    echo -e "${GREEN}✓${NC} InvitationCode orgName removed"
fi

echo ""
echo "3. Checking query file updated..."

# Check InvitationCodeRow (should NOT have org_name)
if grep -A10 "interface InvitationCodeRow" src/lib/db/queries/invitationCodes.ts | grep -q "org_name"; then
    echo -e "${RED}✗${NC} InvitationCodeRow still has org_name"
else
    echo -e "${GREEN}✓${NC} InvitationCodeRow org_name removed"
fi

# Check for org_owner case
if grep -q "case 'org_owner':" src/lib/db/queries/invitationCodes.ts; then
    echo -e "${GREEN}✓${NC} org_owner case added to useInvitationCode"
else
    echo -e "${RED}✗${NC} org_owner case NOT found"
fi

# Check for org_member case
if grep -q "case 'org_member':" src/lib/db/queries/invitationCodes.ts; then
    echo -e "${GREEN}✓${NC} org_member case added to useInvitationCode"
else
    echo -e "${RED}✗${NC} org_member case NOT found"
fi

# Check createInvitationCode doesn't have orgName
if grep -A5 "createInvitationCode(data:" src/lib/db/queries/invitationCodes.ts | grep -q "orgName"; then
    echo -e "${RED}✗${NC} createInvitationCode still has orgName parameter"
else
    echo -e "${GREEN}✓${NC} createInvitationCode orgName parameter removed"
fi

echo ""
echo "4. Checking for old type references in queries..."

# Check for org_creator in queries
if grep -q "org_creator" src/lib/db/queries/invitationCodes.ts; then
    echo -e "${RED}✗${NC} Found org_creator reference in queries"
else
    echo -e "${GREEN}✓${NC} No org_creator references in queries"
fi

# Check for org_invite in queries
if grep -q "org_invite" src/lib/db/queries/invitationCodes.ts; then
    echo -e "${RED}✗${NC} Found org_invite reference in queries"
else
    echo -e "${GREEN}✓${NC} No org_invite references in queries"
fi

echo ""
echo "=== Migration Command ==="
echo -e "${YELLOW}Run this to apply the migration:${NC}"
echo "psql -U ningli -d annotservice -f sql/migrations/007_org_creation_improvements.sql"
echo ""
echo "=== After Migration Verification ==="
echo -e "${YELLOW}After running migration, verify with:${NC}"
echo "psql -U ningli -d annotservice -c \"SELECT DISTINCT type FROM invitation_codes;\""
echo "psql -U ningli -d annotservice -c \"\\\\d invitation_codes\""
echo ""
