# Prompts (Generation Guides)

The Prompts section is where you create and manage Generation Guides - reusable prompts designed to help you extract and generate insights from your knowledge base using AI.

## Overview

**Location:** Prompts tab in main navigation

Generation Guides (also called Prompts in the code) are templates for generating insights, summaries, or structured outputs from your knowledge entries using the OpenRouter AI API. This is a powerful feature for turning raw annotations into actionable knowledge products.

## Key Components

### 1. Generate New Prompt Button
**Location:** Top right, primary action button (blue)

Creates a new Generation Guide from scratch. Opens a form where you can:
- Set the guide title/name
- Add a description explaining the guide's purpose
- Write the prompt template using markdown
- Add tags for organization
- Set the guide as shared or private

**Usage:**
- Click "Generate New Prompt" button
- Fill in the guide details in the modal form
- Click "Create Guide" to save
- The new guide will appear in your Prompts list

### 2. Guide Selector (Category Filter)
**Location:** Below the search bar, horizontal button group

Allows you to filter Generation Guides by category/type. Shows multiple guide groups:

- **All Guides** (default, blue/active state): Shows all available guides
- **Default Prompt Generation:** Built-in guides provided by the system for common tasks

Additional custom guide categories can be added as you create more guides.

**Usage:**
- Click on a guide selector button to filter
- Only guides in that category will be displayed
- Click "All Guides" to see everything again
- Selectors help organize guides by purpose (e.g., "Summaries", "Analysis", "Reporting")

### 3. Search & Filter
**Location:** Top section, two input fields

**Search Box** (left): Search for Generation Guides by title, description, or content
- Type keywords to find specific guides
- Updates results in real-time as you type
- Useful for finding guides by purpose

**Tag Filter** (right): Narrow guides by selected tags
- Click "Filter by tags..." field
- Select or type tags
- Shows only guides with matching tags
- Combine with search for precise results

## Workflow Examples

### Creating a New Generation Guide

1. Navigate to the **Prompts** tab
2. Click **"Generate New Prompt"** button
3. In the form, enter:
   - **Title:** (e.g., "Customer Feedback Summary")
   - **Description:** What this guide does
   - **Content:** The prompt template to send to AI
   - **Tags:** For organization
4. Click **"Create Guide"** to save
5. The guide now appears in your list and can be used to generate insights

### Finding and Using a Generation Guide

1. Go to **Prompts** tab
2. Use **Search** to find guides by name or keywords
3. Use **Guide Selector** to filter by category
4. Use **Tag Filter** for more specific results
5. Click on a guide in the list to open it
6. Click "Use This Guide" to apply it to your knowledge base
7. View AI-generated results based on the guide

### Organizing Guides with Tags

1. Create guides with consistent tags:
   - `summary` for summary-type guides
   - `analysis` for analytical guides
   - `reporting` for report-generation guides
2. Use the **Tag Filter** to quickly access guides by type
3. Combine tags for nested filtering

## Empty State

When starting out, you'll see: "No prompts found. Get started by generating or uploading your first prompt."

To populate your Prompts list:
- Click **"Generate New Prompt"** to create a custom guide
- Click **"Upload MD"** to import a guide from a markdown file
- Use the **"Generate Your First Prompt"** button in the empty state

## View Options

The Prompts section supports two display modes:

- **Table View** (default): Displays guides in a structured table with columns for title, tags, usage count, and actions
- **Card View:** Displays guides as individual cards in a grid layout

Toggle between views using the "Table" and "Card" buttons in the top right.

## Guide Actions

For each Generation Guide, you can:

- **View/Edit:** Click the guide to open its details and edit the content
- **Use Guide:** Apply the guide to generate insights from your knowledge base
- **Download:** Export the guide as a markdown file for backup or sharing
- **Delete:** Remove the guide (only available for guides you created)
- **Share:** Make the guide available to other team members (depends on permissions)

## Tips and Best Practices

- **Name guides clearly:** Use descriptive titles that indicate the guide's purpose
- **Add descriptions:** Help team members understand what each guide does
- **Use tags consistently:** Establish a tagging scheme (e.g., `summary`, `analysis`, `reporting`)
- **Version your guides:** If you modify a guide, increment the version number in the title
- **Document templates:** Include examples in the description showing expected format
- **Test guides:** Try a guide on sample data before relying on it for important work
- **Share best practices:** Upload guides that work well so others can benefit
- **Combine with filters:** Use search and tag filters together for precise navigation

## Related Features

- **Knowledge Base:** Source data for generation guides
- **Documents:** Where original content comes from
- **Tags:** Organize and categorize your guides
- **OpenRouter API:** Powers the AI generation (requires API key)

## Integration with Knowledge Base

Generation Guides are designed to work with your Knowledge Base:

1. Capture knowledge through document annotations
2. Store knowledge entries in the Knowledge Base
3. Create Generation Guides to process and transform that knowledge
4. Generate insights, summaries, or reports
5. Download or export the results

This creates a complete workflow: Capture → Store → Generate → Export
