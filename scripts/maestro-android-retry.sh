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

attempt=1
max_attempts=3
success=false

while [ $attempt -le $max_attempts ]; do
  echo "Attempt $attempt of $max_attempts..."
  
  if node scripts/maestro-android.js "$JELLYFIN_URL" "$USERNAME"; then
    echo "Tests passed on attempt $attempt"
    success=true
    break
  else
    echo "Tests failed on attempt $attempt"
    
    if [ $attempt -lt $max_attempts ]; then
      echo "Cleaning up and retrying..."
      rm -rf *.mp4 || true
      pkill -f maestro || true
      sleep 5
    fi
    
    attempt=$((attempt + 1))
  fi
done

if [ "$success" = false ]; then
  echo "All $max_attempts attempts failed"
  exit 1
fi

echo "Tests completed successfully!"

