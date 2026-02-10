#!/bin/bash
set -e

echo "Installing ngrok..."

ARCH=$(uname -m)
if [ "$ARCH" = "aarch64" ]; then
  URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.zip"
elif [ "$ARCH" = "armv7l" ] || [ "$ARCH" = "armv6l" ]; then
  URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm.zip"
else
  URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.zip"
fi

echo "Detected arch: $ARCH"
echo "Downloading from: $URL"

TMP=$(mktemp -d)
curl -sSL "$URL" -o "$TMP/ngrok.zip"
cd "$TMP" && unzip -o ngrok.zip && sudo mv ngrok /usr/local/bin/
rm -rf "$TMP"

echo ""
echo "ngrok installed! Now run:"
echo "  ngrok config add-authtoken YOUR_TOKEN_HERE"
echo ""
echo "Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
