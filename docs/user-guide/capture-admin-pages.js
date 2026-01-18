/**
 * Capture admin/settings pages with annotations
 * Run with: node capture-admin-pages.js
 * Requires: Login credentials via env vars or prompts
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'images');
const BASE_URL = 'https://spansurvey.net/annote';

// Credentials (use admin account)
const USERNAME = process.env.ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Draw orange annotations on the page using canvas overlay
 */
async function addCanvasAnnotations(page, annotations) {
  await page.evaluate((annotations) => {
    // Create canvas overlay
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100000;
    `;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const orange = '#FF8C00';
    ctx.strokeStyle = orange;
    ctx.fillStyle = orange;
    ctx.lineWidth = 3;
    ctx.font = '14px -apple-system, system-ui, sans-serif';

    annotations.forEach(ann => {
      if (ann.type === 'box') {
        // Draw rectangle
        ctx.strokeRect(ann.x1, ann.y1, ann.x2 - ann.x1, ann.y2 - ann.y1);
        // Draw label above box
        ctx.fillText(ann.text, ann.x1, ann.y1 - 8);
      } else if (ann.type === 'arrow') {
        const x = ann.x;
        const y = ann.y;
        const len = 30;
        const direction = ann.direction || 'down';

        ctx.beginPath();

        if (direction === 'down') {
          // Line
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + len);
          // Arrowhead
          ctx.moveTo(x, y + len);
          ctx.lineTo(x - 8, y + len - 15);
          ctx.moveTo(x, y + len);
          ctx.lineTo(x + 8, y + len - 15);
          // Label
          const textWidth = ctx.measureText(ann.text).width;
          ctx.fillText(ann.text, x - textWidth / 2, y - 10);
        } else if (direction === 'up') {
          // Line
          ctx.moveTo(x, y);
          ctx.lineTo(x, y - len);
          // Arrowhead
          ctx.moveTo(x, y - len);
          ctx.lineTo(x - 8, y - len + 15);
          ctx.moveTo(x, y - len);
          ctx.lineTo(x + 8, y - len + 15);
          // Label
          const textWidth = ctx.measureText(ann.text).width;
          ctx.fillText(ann.text, x - textWidth / 2, y + 20);
        } else if (direction === 'left') {
          // Line
          ctx.moveTo(x, y);
          ctx.lineTo(x - len, y);
          // Arrowhead
          ctx.moveTo(x - len, y);
          ctx.lineTo(x - len + 15, y - 8);
          ctx.moveTo(x - len, y);
          ctx.lineTo(x - len + 15, y + 8);
          // Label
          ctx.fillText(ann.text, x + 10, y + 5);
        } else if (direction === 'right') {
          // Line
          ctx.moveTo(x, y);
          ctx.lineTo(x + len, y);
          // Arrowhead
          ctx.moveTo(x + len, y);
          ctx.lineTo(x + len - 15, y - 8);
          ctx.moveTo(x + len, y);
          ctx.lineTo(x + len - 15, y + 8);
          // Label
          const textWidth = ctx.measureText(ann.text).width;
          ctx.fillText(ann.text, x - textWidth - 10, y + 5);
        }

        ctx.stroke();
      }
    });
  }, annotations);
}

async function login(page) {
  console.log('Logging in as admin...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

  // Fill login form
  await page.type('input[name="username"]', USERNAME);
  await page.type('input[name="password"]', PASSWORD);

  // Click login button and wait for navigation
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  console.log('✓ Logged in successfully');
}

async function captureAdminPages() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1486,
      height: 900
    }
  });

  try {
    const page = await browser.newPage();

    // Login first
    await login(page);

    // 1. Admin Organizations (08)
    console.log('\n📸 Capturing: 08-admin-organizations.png');
    await page.goto(`${BASE_URL}/settings/admin`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1:has-text("Organizations")', { timeout: 5000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 1000));

    await addCanvasAnnotations(page, [
      { type: 'arrow', text: 'Create Organization', x: 1208, y: 115, direction: 'left' },
      { type: 'box', text: 'Organization Table', x1: 405, y1: 195, x2: 1290, y2: 285 },
      { type: 'arrow', text: 'Invitation Codes', x: 488, y: 345, direction: 'up' }
    ]);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '08-admin-organizations.png'),
      type: 'png'
    });
    console.log('✓ Saved 08-admin-organizations.png');

    // 2. Invitation Codes (09) - scroll to section
    console.log('\n📸 Capturing: 09-invitation-codes.png');
    await page.goto(`${BASE_URL}/settings/admin`, { waitUntil: 'networkidle2' });
    // Scroll to invitation codes section
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h1'))
        .find(h => h.textContent.includes('Invitation Codes'));
      if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await addCanvasAnnotations(page, [
      { type: 'arrow', text: 'Create Code', x: 1224, y: 356, direction: 'left' },
      { type: 'box', text: 'Code Types', x1: 595, y1: 535, x2: 675, y2: 610 },
      { type: 'arrow', text: 'Usage Status', x: 975, y: 549, direction: 'down' }
    ]);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '09-invitation-codes.png'),
      type: 'png'
    });
    console.log('✓ Saved 09-invitation-codes.png');

    // 3. User Management (10)
    console.log('\n📸 Capturing: 10-user-management.png');
    await page.goto(`${BASE_URL}/settings/admin/users`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 1000));

    await addCanvasAnnotations(page, [
      { type: 'box', text: 'Search & Filters', x1: 168, y1: 150, x2: 1290, y2: 195 },
      { type: 'box', text: 'User Table', x1: 168, y1: 240, x2: 1290, y2: 400 },
      { type: 'arrow', text: 'Actions', x: 1240, y: 272, direction: 'left' }
    ]);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '10-user-management.png'),
      type: 'png'
    });
    console.log('✓ Saved 10-user-management.png');

    // 4. Tag Management (11)
    console.log('\n📸 Capturing: 11-tag-management.png');
    await page.goto(`${BASE_URL}/settings/tags`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 1000));

    await addCanvasAnnotations(page, [
      { type: 'arrow', text: 'Create Tag', x: 1210, y: 115, direction: 'left' },
      { type: 'arrow', text: 'Tag List', x: 427, y: 214, direction: 'down' },
      { type: 'box', text: 'Ownership Badges', x1: 800, y1: 250, x2: 920, y2: 380 }
    ]);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '11-tag-management.png'),
      type: 'png'
    });
    console.log('✓ Saved 11-tag-management.png');

    console.log('\n✅ All admin screenshots captured successfully!');
    console.log(`   Location: ${SCREENSHOTS_DIR}`);

    // List captured files with sizes
    console.log('\n📋 Files created:');
    const files = [
      '08-admin-organizations.png',
      '09-invitation-codes.png',
      '10-user-management.png',
      '11-tag-management.png'
    ];
    files.forEach(file => {
      const filePath = path.join(SCREENSHOTS_DIR, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`   ✓ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`   ✗ ${file} (not found)`);
      }
    });

  } catch (error) {
    console.error('\n❌ Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the capture
captureAdminPages().catch(console.error);
