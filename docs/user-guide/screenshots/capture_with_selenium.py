#!/usr/bin/env python3
"""
Capture annotated screenshots using Selenium WebDriver
"""

import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "images")

# Page configurations
PAGES = [
    {
        "filename": "12-knowledge-base.png",
        "url": "https://spansurvey.net/annote/knowledge",
        "wait_for": "Knowledge Entries",
        "annotations": [
            {"x": 200, "y": 230, "num": "1"},
            {"x": 570, "y": 230, "num": "2"},
            {"x": 1074, "y": 106, "num": "3"},
            {"x": 900, "y": 228, "num": "4"},
        ]
    },
    {
        "filename": "13-prompts.png",
        "url": "https://spansurvey.net/annote/prompts",
        "wait_for": "Generation Guides",
        "annotations": [
            {"x": 1220, "y": 106, "num": "1"},
            {"x": 400, "y": 230, "num": "2"},
            {"x": 600, "y": 350, "num": "3"},
        ]
    },
    {
        "filename": "14-trash.png",
        "url": "https://spansurvey.net/annote/settings/trash",
        "wait_for": "Trash",
        "annotations": [
            {"x": 250, "y": 180, "num": "1"},
            {"x": 500, "y": 350, "num": "2"},
            {"x": 1100, "y": 350, "num": "3"},
        ]
    },
    {
        "filename": "15-account-settings.png",
        "url": "https://spansurvey.net/annote/settings/account",
        "wait_for": "Account Settings",
        "annotations": [
            {"x": 400, "y": 250, "num": "1"},
            {"x": 400, "y": 400, "num": "2"},
        ]
    },
]

ANNOTATION_SCRIPT = """
// Create annotation container
const container = document.createElement('div');
container.id = 'screenshot-annotations';
container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999;';
document.body.appendChild(container);

// Add annotations
const annotations = arguments[0];
annotations.forEach(ann => {
    const div = document.createElement('div');
    div.style.cssText = `
        position: absolute;
        left: ${ann.x}px;
        top: ${ann.y}px;
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
        font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transform: translate(-15px, -15px);
    `;
    div.textContent = ann.num;
    container.appendChild(div);
});

return true;
"""

def setup_driver():
    """Setup Chrome WebDriver."""
    chrome_options = Options()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1486,827')

    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(f"Error setting up Chrome driver: {e}")
        print("Make sure ChromeDriver is installed:")
        print("  brew install chromedriver")
        return None

def capture_page(driver, page_config):
    """Capture a single page with annotations."""
    print(f"\nCapturing: {page_config['filename']}")
    print(f"  URL: {page_config['url']}")

    try:
        # Navigate to page
        driver.get(page_config['url'])

        # Wait for page to load
        time.sleep(3)  # Give it time to fully render

        # Inject annotations
        driver.execute_script(ANNOTATION_SCRIPT, page_config['annotations'])

        # Small delay for annotations to render
        time.sleep(0.5)

        # Take screenshot
        output_path = os.path.join(OUTPUT_DIR, page_config['filename'])
        driver.save_screenshot(output_path)

        print(f"  ✓ Saved: {output_path}")
        return True

    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    print("Screenshot Capture Tool (Selenium)")
    print("=" * 60)

    # Ensure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")

    # Setup driver
    print("\nSetting up Chrome WebDriver...")
    driver = setup_driver()

    if not driver:
        return 1

    try:
        # Capture each page
        success_count = 0
        for page_config in PAGES:
            if capture_page(driver, page_config):
                success_count += 1

        # Summary
        print("\n" + "=" * 60)
        print(f"Successfully captured: {success_count}/{len(PAGES)} screenshots")

        return 0 if success_count == len(PAGES) else 1

    finally:
        driver.quit()
        print("Browser closed.")

if __name__ == "__main__":
    exit(main())
