#!/bin/bash

# Clean Console Logs
# This script comments out console.log statements in the codebase
# Run before production build to remove development logs

echo "🧹 Cleaning console.log statements in production build..."

# Use grep to find files with console.log statements
FILES=$(find src -type f -name "*.tsx" -o -name "*.ts" | xargs grep -l "console.log")

# Count the original number of console.log statements
ORIGINAL_COUNT=$(grep -r "console.log" --include="*.tsx" --include="*.ts" src | wc -l)
echo "Found $ORIGINAL_COUNT console.log statements in the codebase"

# Process each file
for FILE in $FILES; do
  echo "Processing $FILE"
  # Replace console.log with // console.log using sed
  # This preserves the code but disables it
  sed -i '' 's/console\.log\(/\/\/ console.log(/' "$FILE"
done

# Count the remaining active console.log statements
REMAINING_COUNT=$(grep -r "console.log" --include="*.tsx" --include="*.ts" src | grep -v "\/\/ console.log" | wc -l)
echo "✅ Done! Commented out $((ORIGINAL_COUNT - REMAINING_COUNT)) console.log statements."
echo "⚠️ $REMAINING_COUNT console.log statements are still active."

# Make the script executable
chmod +x scripts/clean-console-logs.sh 