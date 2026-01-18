#!/usr/bin/env python3
"""
Add orange annotations to screenshots.
This script assumes you've already saved the base screenshots in the images/ directory.
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "images")

# Annotation configurations for each screenshot
ANNOTATIONS = {
    "12-knowledge-base.png": [
        (200, 230, "1"),  # Search
        (570, 230, "2"),  # Tag filter
        (1074, 106, "3"), # Table/Card toggle
        (900, 228, "4"),  # Statistics
    ],
    "13-prompts.png": [
        (1220, 106, "1"), # Generate button
        (400, 230, "2"),  # Guide selector
        (600, 350, "3"),  # Prompts table
    ],
    "14-trash.png": [
        (250, 180, "1"),  # Category tabs
        (500, 350, "2"),  # Deleted items
        (1100, 350, "3"), # Restore/Delete buttons
    ],
    "15-account-settings.png": [
        (400, 250, "1"),  # Display name
        (400, 400, "2"),  # Password change section
    ],
}

def add_annotations_to_image(image_path, annotations):
    """Add orange numbered circles to an image."""
    try:
        # Open the image
        img = Image.open(image_path)
        draw = ImageDraw.Draw(img)

        # Annotation style
        circle_radius = 15
        circle_color = "#ff6600"  # Orange
        text_color = "white"

        # Try to use a nice font
        try:
            # Try macOS system fonts
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
        except:
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 18)
            except:
                # Fallback to default
                font = ImageFont.load_default()

        # Draw each annotation
        for x, y, number in annotations:
            # Draw circle
            bbox = [x - circle_radius, y - circle_radius,
                    x + circle_radius, y + circle_radius]
            draw.ellipse(bbox, fill=circle_color, outline=circle_color)

            # Draw number - center it in the circle
            # Get text bounding box
            left, top, right, bottom = draw.textbbox((0, 0), number, font=font)
            text_width = right - left
            text_height = bottom - top

            # Calculate centered position
            text_x = x - text_width // 2
            text_y = y - text_height // 2 - 2  # Adjust slightly up

            draw.text((text_x, text_y), number, fill=text_color, font=font)

        # Save the annotated image
        img.save(image_path, 'PNG', optimize=True)
        print(f"✓ Annotated: {os.path.basename(image_path)}")
        return True

    except FileNotFoundError:
        print(f"✗ Not found: {os.path.basename(image_path)}")
        return False
    except Exception as e:
        print(f"✗ Error processing {os.path.basename(image_path)}: {e}")
        return False

def main():
    print("Screenshot Annotation Tool")
    print("=" * 60)
    print()

    # Ensure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}\n")

    # Process each screenshot
    success_count = 0
    total_count = len(ANNOTATIONS)

    for filename, annotations in ANNOTATIONS.items():
        filepath = os.path.join(OUTPUT_DIR, filename)
        if add_annotations_to_image(filepath, annotations):
            success_count += 1

    # Summary
    print()
    print("=" * 60)
    print(f"Processed: {success_count}/{total_count} screenshots")

    if success_count < total_count:
        print(f"\nMissing screenshots:")
        for filename in ANNOTATIONS.keys():
            filepath = os.path.join(OUTPUT_DIR, filename)
            if not os.path.exists(filepath):
                print(f"  - {filename}")

if __name__ == "__main__":
    main()
