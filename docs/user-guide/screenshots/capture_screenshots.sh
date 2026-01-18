#!/bin/bash
# Capture screenshots using Chrome headless mode

set -e

# Configuration
BASE_URL="https://spansurvey.net/annote"
OUTPUT_DIR="$(dirname "$0")/images"
WIDTH=1486
HEIGHT=827

# Find Chrome binary
if [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif [ -f "/Applications/Chromium.app/Contents/MacOS/Chromium" ]; then
    CHROME="/Applications/Chromium.app/Contents/MacOS/Chromium"
else
    echo "Error: Chrome or Chromium not found"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Screenshot Capture Tool"
echo "========================================"
echo "Chrome: $CHROME"
echo "Output: $OUTPUT_DIR"
echo ""

# Function to capture a screenshot
capture() {
    local filename="$1"
    local url="$2"
    local output="$OUTPUT_DIR/$filename"

    echo "Capturing: $filename"
    echo "  URL: $url"

    "$CHROME" \
        --headless \
        --disable-gpu \
        --window-size=$WIDTH,$HEIGHT \
        --screenshot="$output" \
        --hide-scrollbars \
        "$url" 2>/dev/null

    if [ -f "$output" ]; then
        echo "  ✓ Saved: $output"
    else
        echo "  ✗ Failed to save screenshot"
    fi
    echo ""
}

# Capture each page
capture "12-knowledge-base-base.png" "$BASE_URL/knowledge"
capture "13-prompts-base.png" "$BASE_URL/prompts"
capture "14-trash-base.png" "$BASE_URL/settings/trash"
capture "15-account-settings-base.png" "$BASE_URL/settings/account"

echo "========================================"
echo "Screenshots captured!"
echo "Run annotate_screenshots.py to add annotations."
