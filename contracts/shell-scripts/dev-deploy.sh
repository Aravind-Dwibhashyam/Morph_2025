#!/bin/bash

# Exit immediately if any command fails
set -e

echo "Deploying contract to Anvil..."

forge script script/Morph.s.sol \
  --fork-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80