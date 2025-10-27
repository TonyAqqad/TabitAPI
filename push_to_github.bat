@echo off
echo ========================================
echo Push Tabit API to GitHub
echo ========================================
echo.

REM Check if repository URL is provided
if "%1"=="" (
    echo ERROR: Please provide your GitHub repository URL
    echo.
    echo Usage: push_to_github.bat https://github.com/YOUR_USERNAME/TabitAPI.git
    echo.
    echo To create a repository:
    echo   1. Go to https://github.com/new
    echo   2. Name it: TabitAPI
    echo   3. DO NOT check "Initialize with README"
    echo   4. Copy the repository URL
    echo   5. Run this script with the URL
    echo.
    pause
    exit /b 1
)

echo Adding remote: %1
git remote add origin %1

echo.
echo Pushing to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Your code is now on GitHub!
    echo ========================================
    echo.
    echo Repository: %1
) else (
    echo.
    echo ========================================
    echo ERROR: Could not push to GitHub
    echo ========================================
    echo.
    echo Common issues:
    echo - Repository doesn't exist yet
    echo - Not authenticated with GitHub
    echo - Wrong repository URL
    echo.
    echo If you haven't created the repo:
    echo   1. Go to https://github.com/new
    echo   2. Create repository named: TabitAPI
    echo   3. Copy the URL and try again
    echo.
    pause
)

