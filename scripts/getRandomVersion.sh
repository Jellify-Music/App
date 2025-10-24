#!/usr/bin/env bash
set -euo pipefail

FILE="ota.version"

# Array of sentences
sentences=(
  "Git Blame violet"
  "Thank you pikachu"
  "Margelo folks are Awesome"
  "Pikachu Should have coded this"
  "meta sue violet"
)

# Read previous value if file exists
prev=""
if [[ -f "$FILE" ]]; then
  prev=$(<"$FILE")
fi

# Function to get a random new sentence (not same as prev)
get_random_sentence() {
  local choice
  while true; do
    choice="${sentences[RANDOM % ${#sentences[@]}]}"
    if [[ "$choice" != "$prev" ]]; then
      echo "$choice"
      return
    fi
  done
}

new_sentence=$(get_random_sentence)

# Write atomically
tmp="${FILE}.tmp.$$"
echo "$new_sentence" > "$tmp"
mv "$tmp" "$FILE"

echo "✅ Updated $FILE with: \"$new_sentence\""