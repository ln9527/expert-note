# Prompts Documentation
**Last Updated: 2026-01-13**

This folder contains the "Gold Standard" logic for the Expert Note AI agents. 

### Important Note for Developers/AI
As of Jan 13, 2026, the live system has been updated via SQL migration to use the "Tacit Knowledge" framework. 

**WARNING:** The system has hardcoded fallbacks in `src/lib/ai/` that may still contain legacy logic. Always verify that the database `prompt_templates` table is populated and active. If the system behavior reverts to simple summarization, the database connection or template selection is likely failing.
