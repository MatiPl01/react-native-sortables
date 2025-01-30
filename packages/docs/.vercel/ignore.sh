#!/bin/bash

# Fetch the list of changed files in the last commit
CHANGED_FILES=$(git diff --name-only HEAD^ HEAD)

# Check if any changed file is under packages/docs/
if echo "$CHANGED_FILES" | grep -q '^packages/docs/'; then
  exit 1 # This allows deployment
fi

exit 0 # This prevents deployment
