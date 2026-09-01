@echo off
cd /d "%~dp0"
title Book Forge Launcher
start "" "node_modules\electron\dist\electron.exe" .
