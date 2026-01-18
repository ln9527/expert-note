#!/usr/bin/env python3
"""
Capture admin/settings page screenshots with annotations
Saves as PNG files to screenshots/images/
"""

import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from PIL import Image, ImageDraw, ImageFont
import io

# Configuration
BASE_URL = "https://spansurvey.net/annote"
OUTPUT_DIR = "screenshots/images"
SCREENSHOTS = [
    {
        "name": "08-admin-organizations.png",
        "url": f"{BASE_URL}/settings/admin",
        "wait_selector": "//h1[contains(text(), 'Organizations')]",
        "annotations": [
            {"type": "arrow", "text": "Create Organization", "x": 1208, "y": 115, "direction": "left"},
            {"type": "box", "text": "Organization Table", "x1": 405, "y1": 195, "x2": 1290, "y2": 285},
            {"type": "arrow", "text": "Invitation Codes Section", "x": 488, "y": 345, "direction": "up"},
        ]
    },
    {
        "name": "09-invitation-codes.png",
        "url": f"{BASE_URL}/settings/admin",
        "wait_selector": "//h1[contains(text(), 'Invitation Codes')]",
        "scroll_to": "//h1[contains(text(), 'Invitation Codes')]",
        "annotations": [
            {"type": "arrow", "text": "Create Code Button", "x": 1224, "y": 356, "direction": "left"},
            {"type": "box", "text": "Code Type Badges", "x1": 595, "y1": 535, "x2": 675, "y2": 610},
            {"type": "arrow", "text": "Usage Limits", "x": 975, "y": 549, "direction": "down"},
        ]
    },
    {
        "name": "10-user-management.png",
        "url": f"{BASE_URL}/settings/admin/users",
        "wait_selector": "//h1[contains(text(), 'User Management')]",
        "annotations": [
            {"type": "box", "text": "Search & Filters", "x1": 168, "y1": 150, "x2": 1290, "y2": 195},
            {"type": "arrow", "text": "User Actions", "x": 1240, "y": 272, "direction": "left"},
            {"type": "box", "text": "User Table", "x1": 168, "y1": 240, "x2": 1290, "y2": 400},
        ]
    },
    {
        "name": "11-tag-management.png",
        "url": f"{BASE_URL}/settings/tags",
        "wait_selector": "//h1[contains(text(), 'Tag Management')]",
        "annotations": [
            {"type": "arrow", "text": "Create Tag Button", "x": 1210, "y": 115, "direction": "left"},
            {"type": "box", "text": "Ownership Badges", "x1": 800, "y1": 250, "x2": 920, "y2": 380},
            {"type": "arrow", "text": "Tag List", "x": 427, "y": 214, "direction": "down"},
        ]
    }
]

def setup_driver():
    """Setup Chrome driver with headless mode"""
    options = webdriver.ChromeOptions()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1486,900')

    driver = webdriver.Chrome(options=options)
    return driver

def draw_annotations(img, annotations):
    """Draw orange annotations on image"""
    draw = ImageDraw.Draw(img)

    # Try to load a font, fallback to default
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
    except:
        font = ImageFont.load_default()
        font_small = font

    orange = (255, 140, 0)  # Orange color
    line_width = 3

    for ann in annotations:
        if ann["type"] == "box":
            # Draw rectangle
            x1, y1, x2, y2 = ann["x1"], ann["y1"], ann["x2"], ann["y2"]
            draw.rectangle([x1, y1, x2, y2], outline=orange, width=line_width)
            # Draw label above box
            draw.text((x1, y1 - 20), ann["text"], fill=orange, font=font)

        elif ann["type"] == "arrow":
            x, y = ann["x"], ann["y"]
            direction = ann.get("direction", "down")
            arrow_len = 30

            # Draw arrow line
            if direction == "down":
                draw.line([x, y, x, y + arrow_len], fill=orange, width=line_width)
                # Arrowhead
                draw.polygon([x, y + arrow_len, x - 8, y + arrow_len - 15, x + 8, y + arrow_len - 15], fill=orange)
                # Label above arrow
                bbox = draw.textbbox((0, 0), ann["text"], font=font_small)
                text_width = bbox[2] - bbox[0]
                draw.text((x - text_width // 2, y - 25), ann["text"], fill=orange, font=font_small)

            elif direction == "up":
                draw.line([x, y, x, y - arrow_len], fill=orange, width=line_width)
                # Arrowhead
                draw.polygon([x, y - arrow_len, x - 8, y - arrow_len + 15, x + 8, y - arrow_len + 15], fill=orange)
                # Label below arrow
                bbox = draw.textbbox((0, 0), ann["text"], font=font_small)
                text_width = bbox[2] - bbox[0]
                draw.text((x - text_width // 2, y + 10), ann["text"], fill=orange, font=font_small)

            elif direction == "left":
                draw.line([x, y, x - arrow_len, y], fill=orange, width=line_width)
                # Arrowhead
                draw.polygon([x - arrow_len, y, x - arrow_len + 15, y - 8, x - arrow_len + 15, y + 8], fill=orange)
                # Label to the right
                draw.text((x + 10, y - 10), ann["text"], fill=orange, font=font_small)

            elif direction == "right":
                draw.line([x, y, x + arrow_len, y], fill=orange, width=line_width)
                # Arrowhead
                draw.polygon([x + arrow_len, y, x + arrow_len - 15, y - 8, x + arrow_len - 15, y + 8], fill=orange)
                # Label to the left
                bbox = draw.textbbox((0, 0), ann["text"], font=font_small)
                text_width = bbox[2] - bbox[0]
                draw.text((x - text_width - 10, y - 10), ann["text"], fill=orange, font=font_small)

    return img

def capture_screenshot(driver, config):
    """Capture and annotate a screenshot"""
    print(f"\n📸 Capturing: {config['name']}")
    print(f"   URL: {config['url']}")

    # Navigate to URL
    driver.get(config['url'])

    # Wait for page to load
    try:
        wait = WebDriverWait(driver, 10)
        wait.until(EC.presence_of_element_located((By.XPATH, config['wait_selector'])))
        time.sleep(2)  # Extra time for rendering
    except Exception as e:
        print(f"   ⚠️  Warning: Could not find wait selector: {e}")
        time.sleep(3)

    # Scroll if needed
    if "scroll_to" in config:
        try:
            element = driver.find_element(By.XPATH, config['scroll_to'])
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'start'});", element)
            time.sleep(1)
        except Exception as e:
            print(f"   ⚠️  Warning: Could not scroll to element: {e}")

    # Take screenshot
    png_data = driver.get_screenshot_as_png()
    img = Image.open(io.BytesIO(png_data))

    # Add annotations
    img = draw_annotations(img, config['annotations'])

    # Save as PNG
    output_path = os.path.join(OUTPUT_DIR, config['name'])
    img.save(output_path, 'PNG')

    # Get file size
    file_size = os.path.getsize(output_path)
    print(f"   ✅ Saved: {output_path} ({file_size:,} bytes)")

    return output_path

def main():
    """Main function"""
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("🚀 Starting screenshot capture...")
    print(f"   Output directory: {OUTPUT_DIR}")

    # Setup driver
    driver = setup_driver()

    try:
        # Note: You may need to login first
        print("\n⚠️  Note: If login is required, this script may fail.")
        print("   Consider manually logging in and saving session cookies.")

        captured = []
        for config in SCREENSHOTS:
            try:
                path = capture_screenshot(driver, config)
                captured.append(path)
            except Exception as e:
                print(f"   ❌ Error capturing {config['name']}: {e}")

        # Summary
        print(f"\n✅ Capture complete!")
        print(f"   Captured: {len(captured)}/{len(SCREENSHOTS)} screenshots")

        if captured:
            print("\n📋 Files created:")
            for path in captured:
                print(f"   - {path}")

    finally:
        driver.quit()

if __name__ == "__main__":
    main()
