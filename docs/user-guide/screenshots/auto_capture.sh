#!/bin/bash
# Automated screenshot capture using macOS screencapture and open command

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/images"

mkdir -p "$OUTPUT_DIR"

echo "Automated Screenshot Capture"
echo "======================================================"
echo

# Array of HTML files and their output names
declare -a pages=(
    "capture-12-knowledge-base.html:12-knowledge-base.png"
    "capture-13-prompts.html:13-prompts.png"
    "capture-14-trash.html:14-trash.png"
    "capture-15-account-settings.html:15-account-settings.png"
)

for page_info in "${pages[@]}"; do
    IFS=':' read -r html_file output_file <<< "$page_info"
    html_path="$SCRIPT_DIR/$html_file"
    output_path="$OUTPUT_DIR/$output_file"

    echo "Opening: $html_file"

    # Open the HTML file in Chrome
    open -a "Google Chrome" "$html_path"

    echo "  Waiting for page to load (5 seconds)..."
    sleep 5

    echo "  Please manually screenshot the white container area"
    echo "  Press Cmd+Shift+4, then Space, then click the window"
    echo "  Save as: $output_file in the images/ folder"
    echo
    read -p "  Press Enter when done..."

    echo "  ✓ Completed: $output_file"
    echo

    # Close the Chrome tab (user has to do this)
    echo "  Close the Chrome tab and press Enter to continue..."
    read -p ""
done

echo "======================================================"
echo "All screenshots should now be captured!"
echo "Check the images/ directory."
