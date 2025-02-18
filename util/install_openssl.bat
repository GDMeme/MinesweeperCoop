@echo off

SET scriptDir=%~dp0
SET serverDir=%scriptDir:util=%
SET serverDir=%serverDir:~0,-1%server

REM Check if we are in the 'util' directory
IF NOT "%scriptDir%"=="%CD%\" (
    echo Error: Please run this script from the 'util' directory.
    exit /b 1
)

REM Check if Chocolatey is installed
IF NOT EXIST "%ProgramData%\chocolatey\bin\choco.exe" (
    echo Installing Chocolatey...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    REM Wait for Chocolatey to be available after installation
    timeout /t 5 /nobreak
)

REM Check if OpenSSL is installed
where openssl >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Installing OpenSSL...
    choco install openssl -y
    REM Wait for OpenSSL installation to complete
    timeout /t 5 /nobreak
)

REM Ensure OpenSSL is recognized
where openssl >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo OpenSSL installation failed. Please restart the terminal and try again.
    exit /b 1
)

REM Change to the server directory
cd /d "%serverDir%"

REM Run OpenSSL command
echo Running OpenSSL command to generate the certificate and key...
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365 -passout pass:fdsa -subj "/"

REM Display the server directory path correctly
echo Certificate and key have been generated in "%serverDir%"!
pause
