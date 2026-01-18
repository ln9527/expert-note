/**
 * Screenshot capture script using Puppeteer
 * Run with: node capture-screenshots.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'images');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Annotation injection function
async function addAnnotations(page, annotations) {
  await page.evaluate((annotations) => {
    annotations.forEach(({ number, selector, label, position }) => {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const annotation = document.createElement('div');
        annotation.style.cssText = `
          position: fixed;
          ${position === 'left' ? `left: ${rect.left - 35}px` : `right: ${window.innerWidth - rect.right - 35}px`};
          top: ${rect.top + rect.height / 2 - 15}px;
          width: 30px;
          height: 30px;
          background: rgba(255, 140, 0, 0.9);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          z-index: 10000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          pointer-events: none;
        `;
        annotation.textContent = number;
        document.body.appendChild(annotation);
      }
    });
  }, annotations);
}

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1509,
      height: 815
    }
  });

  try {
    const page = await browser.newPage();

    // 1. Login Page
    console.log('Capturing login page...');
    await page.goto('https://spansurvey.net/annote/login', {
      waitUntil: 'networkidle2'
    });

    await addAnnotations(page, [
      { number: '①', selector: 'input[name="username"]', label: 'Username', position: 'left' },
      { number: '②', selector: 'input[name="password"]', label: 'Password', position: 'left' },
      { number: '③', selector: 'button[type="submit"]', label: 'Login Button', position: 'left' },
      { number: '④', selector: 'a[href*="register"]', label: 'Register Link', position: 'left' }
    ]);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-login.png'),
      type: 'png',
      fullPage: false
    });
    console.log('✓ Login page saved to 01-login.png');

    // 2. Registration Page
    console.log('Capturing registration page...');
    await page.goto('https://spansurvey.net/annote/register', {
      waitUntil: 'networkidle2'
    });

    await addAnnotations(page, [
      { number: '①', selector: 'input[name="username"]', label: 'Username', position: 'left' },
      { number: '②', selector: 'input[name="password"]', label: 'Password', position: 'left' },
      { number: '③', selector: 'input[name="confirmPassword"]', label: 'Confirm Password', position: 'left' },
      { number: '④', selector: 'input[name="displayName"]', label: 'Display Name', position: 'left' },
      { number: '⑤', selector: 'input[name="email"]', label: 'Email', position: 'left' },
      { number: '⑥', selector: 'input[name="invitationCode"]', label: 'Invitation Code', position: 'left' },
      { number: '⑦', selector: 'button[type="submit"]', label: 'Register Button', position: 'left' },
      { number: '⑧', selector: 'a[href*="login"]', label: 'Login Link', position: 'left' }
    ]);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-registration.png'),
      type: 'png',
      fullPage: false
    });
    console.log('✓ Registration page saved to 02-registration.png');

    console.log('\n✅ All screenshots captured successfully!');
    console.log(`   Location: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the capture
captureScreenshots().catch(console.error);
