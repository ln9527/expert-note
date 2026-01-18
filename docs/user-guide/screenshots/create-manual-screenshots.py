#!/usr/bin/env python3
"""
Manual screenshot creation using PIL to generate the images.
This creates the screenshots without needing a browser.
"""

from PIL import Image, ImageDraw, ImageFont
import sys

def create_screenshot_06():
    """Create screenshot 06: Knowledge Extraction Modal"""

    # Create image with modal overlay background
    width, height = 1200, 800
    img = Image.new('RGB', (width, height), color=(0, 0, 0))

    # Add semi-transparent overlay effect (simulate 50% opacity)
    overlay = ImageDraw.Draw(img)
    overlay.rectangle([(0, 0), (width, height)], fill=(77, 77, 77))

    # Modal dimensions
    modal_width, modal_height = 500, 350
    modal_x = (width - modal_width) // 2
    modal_y = (height - modal_height) // 2

    # Draw modal background
    overlay.rounded_rectangle(
        [(modal_x, modal_y), (modal_x + modal_width, modal_y + modal_height)],
        radius=8,
        fill=(255, 255, 255)
    )

    # Try to load a font, fall back to default if not available
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 20)
        body_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 14)
        small_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 12)
    except:
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    # Draw modal content
    draw = ImageDraw.Draw(img)

    # Title
    draw.text((modal_x + 24, modal_y + 24), "Extract Knowledge", fill=(31, 41, 55), font=title_font)

    # Status message
    draw.text(
        (modal_x + 24, modal_y + 60),
        "Extract knowledge from 8 annotations in this document.",
        fill=(107, 114, 128),
        font=body_font
    )

    # Custom Instructions label
    draw.text(
        (modal_x + 24, modal_y + 100),
        "Custom Instructions (Optional)",
        fill=(55, 65, 81),
        font=body_font
    )

    # Textarea box
    textarea_y = modal_y + 125
    draw.rounded_rectangle(
        [(modal_x + 24, textarea_y), (modal_x + modal_width - 24, textarea_y + 120)],
        radius=6,
        outline=(209, 213, 219),
        width=1,
        fill=(255, 255, 255)
    )

    # Placeholder text
    placeholder_text = [
        "e.g., Focus on generalizing principles for academic writing",
        "Preserve domain-specific terminology",
        "Keep examples concrete but transferable"
    ]
    for i, line in enumerate(placeholder_text):
        draw.text(
            (modal_x + 34, textarea_y + 10 + i * 20),
            line,
            fill=(156, 163, 175),
            font=small_font
        )

    # Buttons
    button_y = modal_y + modal_height - 50

    # Cancel button
    cancel_x = modal_x + modal_width - 180
    draw.rounded_rectangle(
        [(cancel_x, button_y), (cancel_x + 80, button_y + 32)],
        radius=6,
        fill=(243, 244, 246)
    )
    draw.text((cancel_x + 20, button_y + 8), "Cancel", fill=(55, 65, 81), font=body_font)

    # Extract button
    extract_x = modal_x + modal_width - 90
    draw.rounded_rectangle(
        [(extract_x, button_y), (extract_x + 80, button_y + 32)],
        radius=6,
        fill=(37, 99, 235)
    )
    draw.text((extract_x + 15, button_y + 8), "Extract", fill=(255, 255, 255), font=body_font)

    # Add annotation circles
    annotations = [
        (modal_x + modal_width // 2 - 16, modal_y - 20, "1"),
        (modal_x - 20, modal_y + 60, "2"),
        (modal_x - 20, modal_y + 130, "3"),
        (extract_x + 60, button_y + 5, "4")
    ]

    for x, y, num in annotations:
        # Circle
        draw.ellipse([(x, y), (x + 32, y + 32)], fill=(255, 107, 53))
        # Number - center it better
        bbox = draw.textbbox((0, 0), num, font=title_font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        draw.text((x + 16 - text_width // 2, y + 16 - text_height // 2 - 2), num, fill=(255, 255, 255), font=title_font)

    # Save
    output_path = "images/06-knowledge-extraction.png"
    img.save(output_path)
    print(f"✓ Created: {output_path}")

def create_screenshot_07():
    """Create screenshot 07: Document Properties Sidebar"""

    # Create image
    width, height = 1200, 600
    img = Image.new('RGB', (width, height), color=(245, 245, 245))
    draw = ImageDraw.Draw(img)

    # Main container with white background
    container_margin = 20
    draw.rounded_rectangle(
        [(container_margin, container_margin), (width - container_margin, height - container_margin)],
        radius=8,
        fill=(255, 255, 255)
    )

    # Fonts
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 24)
        section_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 16)
        body_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 14)
        small_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 12)
    except:
        title_font = ImageFont.load_default()
        section_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    # Editor content area
    editor_x = container_margin + 20
    editor_y = container_margin + 20
    editor_width = 800

    # Document title
    draw.text((editor_x, editor_y), "Understanding Machine Learning Fundamentals", fill=(31, 41, 55), font=title_font)

    # Document text
    paragraphs = [
        "Machine learning is a subset of artificial intelligence that enables systems to learn and",
        "improve from experience without being explicitly programmed. The field has evolved significantly",
        "over the past decades, transforming from theoretical concepts to practical applications.",
        "",
        "At its core, machine learning relies on algorithms that can identify patterns in data and make",
        "predictions or decisions based on those patterns. The process involves training models on",
        "historical data, validating their performance, and deploying them to new, unseen data."
    ]

    text_y = editor_y + 40
    for para in paragraphs:
        draw.text((editor_x, text_y), para, fill=(75, 85, 99), font=body_font)
        text_y += 20

    # Sidebar
    sidebar_x = width - 340
    sidebar_y = container_margin
    sidebar_width = 320

    # Sidebar background
    draw.rectangle(
        [(sidebar_x, sidebar_y), (width - container_margin, height - container_margin)],
        fill=(249, 250, 251)
    )

    # Sidebar content
    content_x = sidebar_x + 20
    content_y = sidebar_y + 20

    # Document Info section
    draw.text((content_x, content_y), "Document Info", fill=(31, 41, 55), font=section_font)
    content_y += 35

    # Status field
    draw.text((content_x, content_y), "STATUS", fill=(107, 114, 128), font=small_font)
    content_y += 22
    draw.rounded_rectangle(
        [(content_x, content_y), (content_x + 280, content_y + 32)],
        radius=6,
        outline=(209, 213, 219),
        fill=(255, 255, 255),
        width=1
    )
    draw.text((content_x + 8, content_y + 8), "processed", fill=(0, 0, 0), font=body_font)
    content_y += 50

    # Annotations
    draw.text((content_x, content_y), "ANNOTATIONS", fill=(107, 114, 128), font=small_font)
    content_y += 22

    # Annotation dots and counts
    dots = [
        ((239, 68, 68), "3 macro"),
        ((234, 179, 8), "4 meso"),
        ((34, 197, 94), "6 micro")
    ]
    dot_x = content_x
    for color, label in dots:
        # Dot
        draw.ellipse([(dot_x, content_y + 3), (dot_x + 8, content_y + 11)], fill=color)
        # Label
        draw.text((dot_x + 14, content_y), label, fill=(107, 114, 128), font=body_font)
        dot_x += 90
    content_y += 40

    # Tags field
    draw.text((content_x, content_y), "TAGS", fill=(107, 114, 128), font=small_font)
    content_y += 22
    draw.rounded_rectangle(
        [(content_x, content_y), (content_x + 280, content_y + 32)],
        radius=6,
        outline=(209, 213, 219),
        fill=(255, 255, 255),
        width=1
    )
    draw.text((content_x + 8, content_y + 8), "Machine Learning, Research, Tutorial", fill=(0, 0, 0), font=small_font)
    content_y += 55

    # Actions section
    draw.text((content_x, content_y), "Actions", fill=(31, 41, 55), font=section_font)
    content_y += 35

    # Extraction guide dropdown
    draw.rounded_rectangle(
        [(content_x, content_y), (content_x + 280, content_y + 32)],
        radius=6,
        outline=(209, 213, 219),
        fill=(255, 255, 255),
        width=1
    )
    draw.text((content_x + 8, content_y + 8), "Default Knowledge Extraction (Default)", fill=(0, 0, 0), font=small_font)
    content_y += 44

    # Extract Knowledge button
    draw.rounded_rectangle(
        [(content_x, content_y), (content_x + 280, content_y + 36)],
        radius=6,
        fill=(37, 99, 235)
    )
    draw.text((content_x + 80, content_y + 10), "Extract Knowledge", fill=(255, 255, 255), font=body_font)
    content_y += 44

    # Download button
    draw.rounded_rectangle(
        [(content_x, content_y), (content_x + 280, content_y + 36)],
        radius=6,
        outline=(209, 213, 219),
        fill=(243, 244, 246),
        width=1
    )
    draw.text((content_x + 105, content_y + 10), "Download", fill=(55, 65, 81), font=body_font)
    content_y += 44

    # Delete Document button
    draw.rounded_rectangle(
        [(content_x, content_y), (content_x + 280, content_y + 36)],
        radius=6,
        fill=(220, 38, 38)
    )
    draw.text((content_x + 80, content_y + 10), "Delete Document", fill=(255, 255, 255), font=body_font)

    # Add annotation circles
    annotations = [
        (sidebar_x - 20, 82, "1"),   # Status
        (sidebar_x - 20, 158, "2"),  # Annotations
        (sidebar_x - 20, 238, "3"),  # Tags
        (sidebar_x - 20, 330, "4"),  # Guide dropdown
        (sidebar_x - 20, 390, "5"),  # Extract button
        (sidebar_x - 20, 490, "6")   # Delete button
    ]

    for x, y, num in annotations:
        # Circle
        draw.ellipse([(x, y), (x + 32, y + 32)], fill=(255, 107, 53))
        # Number
        bbox = draw.textbbox((0, 0), num, font=section_font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        draw.text((x + 16 - text_width // 2, y + 16 - text_height // 2 - 2), num, fill=(255, 255, 255), font=section_font)

    # Save
    output_path = "images/07-document-properties.png"
    img.save(output_path)
    print(f"✓ Created: {output_path}")

if __name__ == "__main__":
    print("Creating screenshots...\n")

    try:
        create_screenshot_06()
        create_screenshot_07()
        print("\n✓ All screenshots created successfully!")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
