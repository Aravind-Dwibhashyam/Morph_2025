#!/bin/bash

# Exit on error
set -e

# Check for argument
if [ $# -lt 1 ]; then
  echo "Usage: $0 {dev|sepolia}"
  exit 1
fi

case "$1" in
  dev)
    ./shell-scripts/dev-deploy.sh
    ;;
  sepolia)
    ./shell-scripts/sepolia-deploy.sh
    ;;
  *)
    echo "Unknown deployment target: $1"
    echo "Usage: $0 {dev|sepolia}"
    exit 1
    ;;
esac
