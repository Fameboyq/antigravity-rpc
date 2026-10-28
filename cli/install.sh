#!/bin/bash
set -e

echo -e "\033[1;35m"
echo "  █████╗ ███╗   ██╗████████╗██╗ ██████╗ ██████╗  █████╗ ██╗   ██╗██╗████████╗██╗   ██╗"
echo " ██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝ ██╔══██╗██╔══██╗██║   ██║██║╚══██╔══╝╚██╗ ██╔╝"
echo " ███████║██╔██╗ ██║   ██║   ██║██║  ███╗██████╔╝███████║██║   ██║██║   ██║    ╚████╔╝ "
echo " ██╔══██║██║╚██╗██║   ██║   ██║██║   ██║██╔══██╗██╔══██║╚██╗ ██╔╝██║   ██║     ╚██╔╝  "
echo " ██║  ██║██║ ╚████║   ██║   ██║╚██████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║   ██║      ██║   "
echo " ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝   ╚═╝      ╚═╝   "
echo -e "\033[0m\033[36mAntigravity Discord RPC Installer for Unix/macOS\033[0m\n"

if ! command -v node >/dev/null 2>&1; then
    echo -e "\033[31m✘ Node.js not found. Please install Node.js 18+ from https://nodejs.org\033[0m"
    exit 1
fi

EXT_DEST="$HOME/.vscode/extensions/antigravity.antigravity-rpc-1.0.0"
mkdir -p "$EXT_DEST"

BASE_URL="https://raw.githubusercontent.com/A-Gift-Of-Flame/antigravity-rpc/main/extension"
FILES=("package.json" "extension.js" "discord-ipc.js" "stats-reader.js" "icon.png")

echo -e "\033[36m[*] Downloading extension files...\033[0m"
for f in "${FILES[@]}"; do
    curl -fsSL "$BASE_URL/$f" -o "$EXT_DEST/$f"
done

echo -e "\033[32m✔ Extension installed to $EXT_DEST\033[0m"
echo -e "\n\033[1;32m🚀 Done! Reload VS Code or run 'npx antigravity-rpc run'\033[0m"

