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

# Function to generate a random 3-digit alphanumeric string
get_random_alphanum() {
  local chars="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  local result=""
  for i in {1..3}; do
    result="${result}${chars:RANDOM%${#chars}:1}"
  done
  echo "$result"
}

new_sentence=$(get_random_sentence)
alphanum_suffix=$(get_random_alphanum)
version_string="${new_sentence} (${alphanum_suffix})"

# Write atomically
tmp="${FILE}.tmp.$$"
echo "$version_string" > "$tmp"
mv "$tmp" "$FILE"

echo "✅ Updated $FILE with: \"$version_string\""