@echo off
cd /d "%~dp0"
echo Ask Elon v7 -^> http://localhost:8080
python -m http.server 8080 --directory dist
