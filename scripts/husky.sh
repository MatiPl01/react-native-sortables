#!/bin/bash
if [ -d '.git' ]; then
  npx husky install
fi
