#!/bin/bash

# Get the merge base between current branch and main
BASE_COMMIT=$(git merge-base HEAD main)

# Get list of changed files between the current branch and main
CHANGED_FILES=$(git diff --name-only "$BASE_COMMIT" HEAD)

# Check if any changed file is under packages/docs/
if echo "$CHANGED_FILES" | grep -q '^packages/docs/'; then
  echo "Changes detected in packages/docs/, allowing deployment."
  exit 1
else
  echo "No relevant changes, skipping deployment."
  exit 0
fi
