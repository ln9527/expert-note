# Edge Case Test Document - Special Characters & Formatting

This document tests the system's robustness with special characters, markdown syntax, and edge cases.

## Section 1: Special Characters

Testing quotes: "double quotes" and 'single quotes' and `backticks`. [[MICRO: Ensure markdown code blocks use triple backticks for multi-line code]]

Testing symbols: @mentions, #hashtags, $variables, %percentages, &ampersands, *asterisks*. [[MACRO: When documenting code syntax, always escape special characters that have markdown meaning]]

Testing unicode: 中文测试, émojis 🔴🟡🟢, symbols ≈≠±×÷. [[MESO: Unicode characters in academic writing should be avoided unless linguistically necessary]]

## Section 2: Markdown Conflicts

Here's some **bold text** and *italic text* and ***bold italic***. [[MICRO: Nested markdown formatting may not render consistently across all platforms]]

Here's a [link](https://example.com) and an image ![alt](url). [[MESO: Links and images in annotations should be tested for proper escaping]]

## Section 3: Code and Formatting

```javascript
const test = "This is code";
// Does annotation work inside code blocks?
```

[[MICRO: Code blocks should be excluded from annotation detection to avoid false positives]]

## Section 4: Very Long Annotation

This is a test of a very long annotation that spans multiple lines and contains a lot of text to see how the system handles annotations that are significantly longer than typical comments. [[MACRO: Very long annotations should be broken into multiple focused annotations - each annotation should make one clear point rather than bundling multiple insights together which makes knowledge extraction less precise and reduces reusability]]

## Section 5: Empty and Minimal

[[MICRO: x]]

[[MESO: ]]

Test text here.
