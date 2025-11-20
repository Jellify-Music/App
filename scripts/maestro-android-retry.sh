#!/bin/bash

# Script to run Maestro Android tests with retry logic
# Usage: ./maestro-android-retry.sh <jellyfin_url> <username>

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Error: Missing required arguments"
  echo "Usage: $0 <jellyfin_url> <username>"
  exit 1
fi

JELLYFIN_URL="$1"
USERNAME="$2"
node scripts/maestro-android.js "$JELLYFIN_URL" "$USERNAME"
