#!/bin/bash
# Replace screenshot links with actual embedded images

cd "$(dirname "$0")"

# Create a new file with embedded images
cat expert-note-complete-guide.md | \
sed 's|📸 \*\*\[See Screenshot 01: Login Page\](screenshots/01-login.md)\*\*|![Login Page](screenshots/images/01-login.png)\n*Figure 1: Login interface with username (①), password (②), sign in button (③), and register link (④)*|g' | \
sed 's|📸 \*\*\[See Screenshot 02: Registration Page\](screenshots/02-registration.md)\*\*|![Registration Page](screenshots/images/02-registration.png)\n*Figure 2: Registration form with invitation code (①), username (②), optional fields (③-⑤), and password fields (⑥⑦)*|g' | \
sed 's|📸 \*\*\[See Screenshot 03: Dashboard\](screenshots/03-dashboard.md)\*\*|![Dashboard](screenshots/images/03-dashboard.png)\n*Figure 3: Main dashboard showing navigation (①), new document button (②), search and filters (③-④), and statistics (⑤)*|g' | \
sed 's|📸 \*\*\[See Screenshot 04: Create Document\](screenshots/04-create-document.md)\*\*|![Create Document](screenshots/images/04-create-document.png)\n*Figure 4: Document creation with title field (①), tag selector (②), and upload options (③-④)*|g' | \
sed 's|📸 \*\*\[See Screenshot 05: Document Editor\](screenshots/05-document-editor.md)\*\*|![Document Editor](screenshots/images/05-document-editor.png)\n*Figure 5: Document editor with annotation buttons (① MACRO, MESO, MICRO), content area, and sidebar properties*|g' | \
sed 's|📸 \*\*\[See Screenshot 06: Knowledge Extraction\](screenshots/06-knowledge-extraction.md)\*\*|![Knowledge Extraction](screenshots/images/06-knowledge-extraction.png)\n*Figure 6: Knowledge extraction modal with extraction guide selector (①) and custom instructions (②)*|g' | \
sed 's|📸 \*\*\[See Screenshot 07: Document Properties](screenshots/07-document-properties.md)\*\*|![Document Properties](screenshots/images/07-document-properties.png)\n*Figure 7: Document properties sidebar showing status (①), annotations (②), tags (③), and sharing controls*|g' | \
sed 's|📸 \*\*\[See Screenshot 08: Admin Organizations\](screenshots/08-admin-organizations.md)\*\*|![Admin Organizations](screenshots/images/08-admin-organizations.png)\n*Figure 8: Admin settings with organizations table and invitation codes management*|g' | \
sed 's|📸 \*\*\[See Screenshot 09: Invitation Codes\](screenshots/09-invitation-codes.md)\*\*|![Invitation Codes](screenshots/images/09-invitation-codes.png)\n*Figure 9: Invitation codes section with create button (①), code types (②), and usage tracking*|g' | \
sed 's|📸 \*\*\[See Screenshot 10: User Management\](screenshots/10-user-management.md)\*\*|![User Management](screenshots/images/10-user-management.png)\n*Figure 10: User management with search (②), filters (③-④), and user actions (⑥-⑧)*|g' | \
sed 's|📸 \*\*\[See Screenshot 11: Tag Management\](screenshots/11-tag-management.md)\*\*|![Tag Management](screenshots/images/11-tag-management.png)\n*Figure 11: Tag management showing create button (①), tag list (②), and ownership badges*|g' | \
sed 's|📸 \*\*\[See Screenshot 12: Knowledge Base\](screenshots/12-knowledge-base.md)\*\*|![Knowledge Base](screenshots/images/12-knowledge-base.png)\n*Figure 12: Knowledge base with search (①), tag filter (②), view toggle (③), and statistics*|g' | \
sed 's|📸 \*\*\[See Screenshot 13: Prompts\](screenshots/13-prompts.md)\*\*|![Prompts](screenshots/images/13-prompts.png)\n*Figure 13: Prompts page with generate button (①), guide selector, and prompts table*|g' | \
sed 's|📸 \*\*\[See Screenshot 14: Trash\](screenshots/14-trash.md)\*\*|![Trash](screenshots/images/14-trash.png)\n*Figure 14: Trash page with category filters (①), deleted items (②), and restore actions*|g' | \
sed 's|📸 \*\*\[See Screenshot 15: Account Settings\](screenshots/15-account-settings.md)\*\*|![Account Settings](screenshots/images/15-account-settings.png)\n*Figure 15: Account settings with display name (①), save button (②), and password change (③)*|g' \
> expert-note-user-guide-with-images.md

echo "Created: expert-note-user-guide-with-images.md"
wc -l expert-note-user-guide-with-images.md
