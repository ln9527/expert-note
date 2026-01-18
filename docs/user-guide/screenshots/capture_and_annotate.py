#!/usr/bin/env python3
"""
Screenshot capture and annotation tool for Expert Note user guide.
Captures screenshots from the production site and adds orange numbered annotations.
"""

import os
import sys
import time
import subprocess
from PIL import Image, ImageDraw, ImageFont

# Configuration
BASE_URL = "https://spansurvey.net/annote"
OUTPUT_DIR = "/Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/docs/user-guide/screenshots/images"

# Page configurations with annotation positions
PAGES = {
    "12-knowledge-base.png": {
        "url": f"{BASE_URL}/knowledge",
        "annotations": [
            (200, 230, "1"),  # Search
            (570, 230, "2"),  # Tag filter
            (1074, 106, "3"), # Table/Card toggle
            (900, 228, "4"),  # Statistics
        ]
    },
    "13-prompts.png": {
        "url": f"{BASE_URL}/prompts",
        "annotations": [
            (1220, 106, "1"),  # Generate button
            (400, 230, "2"),   # Guide selector
            (600, 350, "3"),   # Prompts table
        ]
    },
    "14-trash.png": {
        "url": f"{BASE_URL}/settings/trash",
        "annotations": [
            (250, 180, "1"),   # Category tabs
            (500, 350, "2"),   # Deleted items
            (1100, 350, "3"),  # Restore/Delete buttons
        ]
    },
    "15-account-settings.png": {
        "url": f"{BASE_URL}/settings/account",
        "annotations": [
            (400, 250, "1"),   # Display name
            (400, 400, "2"),   # Password change section
        ]
    },
}

def add_annotations(image_path, annotations):
    """Add orange numbered circles to an image."""
    # Open the image
    img = Image.open(image_path)
    draw = ImageDraw.Draw(img)

    # Annotation style
    circle_radius = 15
    circle_color = "#ff6600"  # Orange
    text_color = "white"

    # Try to use a nice font, fall back to default if not available
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    except:
        font = ImageFont.load_default()

    # Draw each annotation
    for x, y, number in annotations:
        # Draw circle
        bbox = [x - circle_radius, y - circle_radius,
                x + circle_radius, y + circle_radius]
        draw.ellipse(bbox, fill=circle_color, outline=circle_color)

        # Draw number - center it in the circle
        text_bbox = draw.textbbox((0, 0), number, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        text_x = x - text_width // 2
        text_y = y - text_height // 2
        draw.text((text_x, text_y), number, fill=text_color, font=font)

    # Save the annotated image
    img.save(image_path, 'PNG')
    print(f"✓ Annotated: {image_path}")

def main():
    """Main function - assumes screenshots are already captured manually."""
    print("Screenshot Annotation Tool")
    print("=" * 50)

    # Check if images directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")

    # Process each page
    for filename, config in PAGES.items():
        filepath = os.path.join(OUTPUT_DIR, filename)

        if os.path.exists(filepath):
            print(f"\nProcessing: {filename}")
            add_annotations(filepath, config["annotations"])
        else:
            print(f"\n⚠ Warning: {filename} not found")
            print(f"  Please capture screenshot from: {config['url']}")

    print("\n" + "=" * 50)
    print("Done! Check the images directory for annotated screenshots.")

if __name__ == "__main__":
    main()
