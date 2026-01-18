#!/usr/bin/env node
/**
 * Screenshot capture tool for Expert Note user guide
 * Captures annotated screenshots from the production site
 */

const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'https://spansurvey.net/annote';
const OUTPUT_DIR = path.join(__dirname, 'images');

// Page configurations with annotation positions
const PAGES = [
  {
    filename: '12-knowledge-base.png',
    url: `${BASE_URL}/knowledge`,
    annotations: [
      { x: 200, y: 230, number: '1' },  // Search
      { x: 570, y: 230, number: '2' },  // Tag filter
      { x: 1074, y: 106, number: '3' }, // Table/Card toggle
      { x: 900, y: 228, number: '4' },  // Statistics
    ]
  },
  {
    filename: '13-prompts.png',
    url: `${BASE_URL}/prompts`,
    annotations: [
      { x: 1220, y: 106, number: '1' }, // Generate button
      { x: 400, y: 230, number: '2' },  // Guide selector
      { x: 600, y: 350, number: '3' },  // Prompts table
    ]
  },
  {
    filename: '14-trash.png',
    url: `${BASE_URL}/settings/trash`,
    annotations: [
      { x: 250, y: 180, number: '1' },  // Category tabs
      { x: 500, y: 350, number: '2' },  // Deleted items
      { x: 1100, y: 350, number: '3' }, // Restore/Delete buttons
    ]
  },
  {
    filename: '15-account-settings.png',
    url: `${BASE_URL}/settings/account`,
    annotations: [
      { x: 400, y: 250, number: '1' },  // Display name
      { x: 400, y: 400, number: '2' },  // Password change section
    ]
  },
];

async function addAnnotations(page, annotations) {
  // Inject annotation styles and elements
  await page.evaluate((annotations) => {
    // Create container for annotations
    const container = document.createElement('div');
    container.id = 'annotation-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999999;
    `;

    // Add each annotation
    annotations.forEach(({ x, y, number }) => {
      const annotation = document.createElement('div');
      annotation.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 30px;
        height: 30px;
        background: #ff6600;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transform: translate(-15px, -15px);
      `;
      annotation.textContent = number;
      container.appendChild(annotation);
    });

    document.body.appendChild(container);
  }, annotations);
}

async function capturePage(browser, pageConfig) {
  const { filename, url, annotations } = pageConfig;
  console.log(`\nCapturing: ${filename}`);
  console.log(`  URL: ${url}`);

  const page = await browser.newPage();

  try {
    // Set viewport size
    await page.setViewport({ width: 1486, height: 827 });

    // Navigate to page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for any animations
    await page.waitForTimeout(1000);

    // Add annotations
    await addAnnotations(page, annotations);

    // Take screenshot
    const outputPath = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: outputPath, type: 'png' });

    console.log(`  ✓ Saved: ${outputPath}`);
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('Expert Note Screenshot Capture Tool');
  console.log('='.repeat(50));

  let browser;
  try {
    // Launch browser
    console.log('\nLaunching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Capture each page
    for (const pageConfig of PAGES) {
      await capturePage(browser, pageConfig);
    }

    console.log('\n' + '='.repeat(50));
    console.log('All screenshots captured successfully!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { capturePage, addAnnotations };
