#!/bin/bash
set -e

echo "Installing ngrok..."
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok-v3-stable-linux-arm.tgz | sudo tar xz -C /usr/local/bin

echo "ngrok installed! Now run:"
echo "  ngrok config add-authtoken YOUR_TOKEN_HERE"
echo ""
echo "Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
