#!/usr/bin/env node
/**
 * Simple Markdown to HTML converter for the User Guide
 * Run: node convert-to-html.js
 */

const fs = require('fs');
const path = require('path');

// Read the markdown file
const mdContent = fs.readFileSync(path.join(__dirname, 'full-user-guide.md'), 'utf-8');

// Simple markdown to HTML conversion
function mdToHtml(md) {
  let html = md
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (match, content) => {
      const cells = content.split('|').map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) {
        return ''; // Skip separator rows
      }
      const isHeader = content.includes('---');
      const tag = 'td';
      return '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
    })
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Line breaks and paragraphs
    .split('\n\n').map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<h') || block.startsWith('<hr') || block.startsWith('<tr')) {
        return block;
      }
      // List handling
      if (block.match(/^[\d]+\./m) || block.match(/^[-*]/m)) {
        const isOrdered = block.match(/^[\d]+\./m);
        const tag = isOrdered ? 'ol' : 'ul';
        const items = block.split('\n')
          .filter(l => l.trim())
          .map(l => l.replace(/^[\d]+\.\s*/, '').replace(/^[-*]\s*/, ''))
          .map(l => `<li>${l}</li>`)
          .join('');
        return `<${tag}>${items}</${tag}>`;
      }
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

  // Wrap tables
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)+/g, '<table>$&</table>');

  return html;
}

const htmlContent = mdToHtml(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Expert Note User Guide</title>
  <style>
    :root {
      --primary: #2563eb;
      --text: #1f2937;
      --bg: #ffffff;
      --border: #e5e7eb;
      --code-bg: #f3f4f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: var(--text);
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { font-size: 2.5em; margin: 1em 0 0.5em; color: var(--primary); border-bottom: 3px solid var(--primary); padding-bottom: 0.3em; }
    h2 { font-size: 1.8em; margin: 1.5em 0 0.5em; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 0.2em; }
    h3 { font-size: 1.4em; margin: 1.2em 0 0.4em; }
    h4 { font-size: 1.1em; margin: 1em 0 0.3em; }
    p { margin: 0.8em 0; }
    ul, ol { margin: 0.8em 0 0.8em 1.5em; }
    li { margin: 0.3em 0; }
    code {
      background: var(--code-bg);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'SF Mono', Consolas, monospace;
      font-size: 0.9em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0.6em 0.8em;
      text-align: left;
    }
    th { background: var(--code-bg); font-weight: 600; }
    tr:nth-child(even) { background: #f9fafb; }
    hr {
      border: none;
      border-top: 2px solid var(--border);
      margin: 2em 0;
    }
    a { color: var(--primary); text-decoration: none; }
    a:hover { text-decoration: underline; }
    strong { font-weight: 600; }
    @media print {
      body { max-width: 100%; padding: 20px; }
      h1, h2 { page-break-after: avoid; }
      table, ul, ol { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

// Write the HTML file
fs.writeFileSync(path.join(__dirname, 'user-guide.html'), fullHtml);
console.log('HTML file created: user-guide.html');
console.log('Open in browser and use Print > Save as PDF for DOCX-compatible format');
