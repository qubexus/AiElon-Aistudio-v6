#!/usr/bin/env bash
# Uruchamia gotowy build webowy z katalogu dist/ na http://localhost:8080
cd "$(dirname "$0")" || exit 1
echo "Ask Elon v7 -> http://localhost:8080"
python3 -m http.server 8080 --directory dist
