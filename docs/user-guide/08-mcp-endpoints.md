# MCP Endpoints Guide

This guide explains how to create and deploy MCP (Model Context Protocol) prompts as API endpoints.

---

## What are MCP Prompts?

MCP prompts are deployable AI prompts that can be accessed via HTTP endpoints. They turn your expert knowledge into API endpoints that can be used by:

- **Claude Code** - Anthropic's CLI for Claude
- **Cursor** - AI-powered code editor
- **Windsurf** - Codeium's AI IDE
- Other MCP-compatible tools

Unlike Skills (which are downloadable packages), MCP prompts are hosted on the server and accessed remotely.

---

## Building an MCP Prompt

### Step 1: Navigate to MCP Builder

1. Click **MCP** in the main navigation
2. Click **Build MCP** button

This opens the MCP Builder wizard with four steps:
- Sources
- Instructions
- Preview
- Build

### Step 2: Select Sources

Choose the prompts and knowledge entries to synthesize:

**Prompts Tab**
- Browse and select existing prompts
- Click to toggle selection

**Knowledge Tab**
- Browse and select knowledge entries
- Multiple entries can be combined

Select at least one source to proceed.

### Step 3: Enter Instructions

| Field | Description | Required |
|-------|-------------|----------|
| **Title** | Name your MCP prompt | Yes |
| **Namespace** | Unique identifier (auto-generated from title) | Yes |
| **Description** | What this MCP prompt does | No |
| **Instructions** | Additional guidance for AI generation | Yes |

**Options:**

| Option | Description |
|--------|-------------|
| **Auto-deploy** | Enable to immediately deploy after build |
| **Public Access** | Allow anyone with the URL to access |

The **Namespace** is automatically generated from your title but can be customized. It must be unique and will be used in connection configurations.

### Step 4: Review and Build

1. Click **Next** to generate the MCP content
2. Review the preview on the right panel
3. Click **Next** to build and deploy (if auto-deploy is enabled)

---

## Connecting to Your MCP

After deployment, you'll see connection details for different tools. The access URL follows this format:

```
https://your-domain/annote/mcp/{access-token}
```

### Claude Code Configuration

Add to your `~/.claude.json`:

```json
{
  "mcpServers": {
    "your-namespace": {
      "type": "url",
      "url": "https://your-domain/annote/mcp/your-token"
    }
  }
}
```

### Cursor Configuration

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "your-namespace": {
      "url": "https://your-domain/annote/mcp/your-token"
    }
  }
}
```

### Windsurf Configuration

```json
{
  "mcpServers": {
    "your-namespace": {
      "serverUrl": "https://your-domain/annote/mcp/your-token"
    }
  }
}
```

### Generic Configuration

For other MCP-compatible tools:

```
Server URL: https://your-domain/annote/mcp/your-token
Namespace: your-namespace
Protocol: MCP (Model Context Protocol)
Transport: HTTP/SSE
```

---

## Managing MCP Prompts

### Viewing MCP Details

1. Navigate to **MCP** in the main navigation
2. Click on an MCP prompt to see details

The detail view shows:
- Title, description, and namespace
- Deployment status (Draft, Deployed, or Disabled)
- Access count (how many times it has been accessed)
- Connection configuration for different tools
- Source references
- Full content

### Deploying an MCP Prompt

If not auto-deployed during creation:

1. Go to the MCP detail page
2. Click **Deploy**
3. The status changes to "Deployed" with a green indicator

### Disabling Access

To temporarily disable an MCP endpoint:

1. Go to the MCP detail page
2. Click **Disable**
3. The endpoint will return 404 until re-deployed

### Regenerating Token

If your access token is compromised:

1. Go to the MCP detail page
2. Click **Regenerate Token**
3. Update your tool configurations with the new token

**Important**: Old tokens immediately stop working after regeneration.

### Editing an MCP Prompt

1. Click **Edit** on the detail page
2. Modify fields as needed
3. Save changes

### Deleting an MCP Prompt

1. Click **Delete** on the detail page
2. Confirm the deletion

---

## Deployment Status

| Status | Badge Color | Description |
|--------|-------------|-------------|
| **Draft** | Gray | Created but not deployed; no access URL available |
| **Deployed** | Green | Active and accessible via the access URL |
| **Disabled** | Red | Previously deployed but currently disabled |

---

## Access Control

### Public vs Private

| Setting | Behavior |
|---------|----------|
| **Private** (default) | Only accessible with the correct access token |
| **Public** | Anyone with the URL can access |

Even with public access, the token provides security through obscurity. For sensitive prompts, keep them private and manage tokens carefully.

### Access Counting

The system tracks how many times each MCP endpoint is accessed. View this on the detail page under "Access Count".

---

## Tips for MCP Prompts

1. **Use descriptive namespaces** - Makes identification easier in tool configurations

2. **Keep tokens secret** - They grant access to your prompts

3. **Monitor access counts** - Track usage patterns

4. **Regenerate tokens periodically** - Good security practice

5. **Test before sharing** - Verify the MCP works correctly with your preferred tool

6. **Use auto-deploy** - Saves a step when you want immediate deployment

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check that the MCP is deployed (green status) |
| 404 Not Found | Verify the access URL and token are correct |
| Tool doesn't recognize MCP | Ensure you're using the correct configuration format for your tool |
| Token not working | The token may have been regenerated; get the new one from the detail page |

---

## Comparison: Skills vs MCP

| Aspect | Skills | MCP Prompts |
|--------|--------|-------------|
| **Delivery** | Downloadable ZIP | Hosted endpoint |
| **Access** | Local installation | Remote URL |
| **Updates** | Re-download required | Instant on server |
| **Offline** | Works offline | Requires network |
| **Security** | Local files | Token-based access |

Choose **Skills** when you need offline access or want to bundle complete packages.
Choose **MCP** when you want remote access with easy updates and monitoring.

---

**Previous**: [Skills Export Guide](./07-skills-export.md) - Learn how to create downloadable skill packages
