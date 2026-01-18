#!/usr/bin/env python3
"""
Generate HTML pages that load the production site in an iframe and overlay annotations.
Open these in a browser and use the browser's screenshot tool.
"""

import os

OUTPUT_DIR = os.path.dirname(__file__)

PAGES = [
    {
        "filename": "capture-12-knowledge-base.html",
        "title": "Knowledge Base",
        "url": "https://spansurvey.net/annote/knowledge",
        "output": "12-knowledge-base.png",
        "annotations": [
            {"x": 200, "y": 230, "num": "1", "label": "Search"},
            {"x": 570, "y": 230, "num": "2", "label": "Tag filter"},
            {"x": 1074, "y": 106, "num": "3", "label": "Table/Card toggle"},
            {"x": 900, "y": 228, "num": "4", "label": "Statistics"},
        ]
    },
    {
        "filename": "capture-13-prompts.html",
        "title": "Prompts",
        "url": "https://spansurvey.net/annote/prompts",
        "output": "13-prompts.png",
        "annotations": [
            {"x": 1220, "y": 106, "num": "1", "label": "Generate button"},
            {"x": 400, "y": 230, "num": "2", "label": "Guide selector"},
            {"x": 600, "y": 350, "num": "3", "label": "Prompts table"},
        ]
    },
    {
        "filename": "capture-14-trash.html",
        "title": "Trash",
        "url": "https://spansurvey.net/annote/settings/trash",
        "output": "14-trash.png",
        "annotations": [
            {"x": 250, "y": 180, "num": "1", "label": "Category tabs"},
            {"x": 500, "y": 350, "num": "2", "label": "Deleted items"},
            {"x": 1100, "y": 350, "num": "3", "label": "Restore/Delete buttons"},
        ]
    },
    {
        "filename": "capture-15-account-settings.html",
        "title": "Account Settings",
        "url": "https://spansurvey.net/annote/settings/account",
        "output": "15-account-settings.png",
        "annotations": [
            {"x": 400, "y": 250, "num": "1", "label": "Display name"},
            {"x": 400, "y": 400, "num": "2", "label": "Password change section"},
        ]
    },
]

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - Screenshot Capture</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f0f0;
            overflow: hidden;
        }}
        .container {{
            width: 1486px;
            height: 827px;
            margin: 20px auto;
            position: relative;
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}
        iframe {{
            width: 100%;
            height: 100%;
            border: none;
        }}
        .annotations {{
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999999;
        }}
        .annotation {{
            position: absolute;
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
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transform: translate(-15px, -15px);
        }}
        .instructions {{
            text-align: center;
            margin: 20px;
            padding: 15px;
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
        }}
        .instructions h3 {{
            margin-bottom: 10px;
            color: #856404;
        }}
        .instructions p {{
            color: #856404;
            margin: 5px 0;
        }}
    </style>
</head>
<body>
    <div class="instructions">
        <h3>📸 Screenshot Instructions</h3>
        <p>1. Wait for the page to fully load in the frame below</p>
        <p>2. Take a screenshot of the white container area (1486x827px)</p>
        <p>3. Save as: <strong>{output}</strong> in the images/ folder</p>
        <p>4. Annotations are already visible on the page</p>
    </div>

    <div class="container">
        <iframe src="{url}" title="{title}"></iframe>
        <div class="annotations">
{annotation_html}
        </div>
    </div>

    <script>
        // Log when iframe loads
        const iframe = document.querySelector('iframe');
        iframe.addEventListener('load', () => {{
            console.log('✓ Page loaded. Ready for screenshot!');
        }});

        // Prevent annotations from being clickable
        document.querySelector('.annotations').style.pointerEvents = 'none';
    </script>
</body>
</html>
"""

def generate_annotation_html(annotations):
    """Generate HTML for annotation circles."""
    html_parts = []
    for ann in annotations:
        html = f'            <div class="annotation" style="left: {ann["x"]}px; top: {ann["y"]}px;" title="{ann["label"]}">{ann["num"]}</div>'
        html_parts.append(html)
    return "\n".join(html_parts)

def generate_html_file(page_config):
    """Generate an HTML file for a page."""
    annotation_html = generate_annotation_html(page_config["annotations"])

    html_content = HTML_TEMPLATE.format(
        title=page_config["title"],
        url=page_config["url"],
        output=page_config["output"],
        annotation_html=annotation_html
    )

    filepath = os.path.join(OUTPUT_DIR, page_config["filename"])
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"✓ Generated: {page_config['filename']}")
    return filepath

def main():
    print("HTML Capture Page Generator")
    print("=" * 60)
    print()

    generated_files = []
    for page_config in PAGES:
        filepath = generate_html_file(page_config)
        generated_files.append(filepath)

    print()
    print("=" * 60)
    print(f"Generated {len(generated_files)} HTML files")
    print()
    print("Next steps:")
    print("1. Open each HTML file in Chrome")
    print("2. Wait for the page to load")
    print("3. Use Chrome's screenshot tool or:")
    print("   - Press Cmd+Shift+4, then Space")
    print("   - Click the white container")
    print("4. Save with the suggested filename in images/")

if __name__ == "__main__":
    main()
