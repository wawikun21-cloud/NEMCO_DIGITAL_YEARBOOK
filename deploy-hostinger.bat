@echo off
echo ==========================================
echo  NEMCO Digital Yearbook - Hostinger Build
echo ==========================================

echo.
echo [1/4] Building client...
cd client
call npm install --include=dev
call npm run build
if errorlevel 1 (
    echo ERROR: Client build failed!
    exit /b 1
)
cd ..

echo.
echo [2/4] Building server...
cd server
call npm install --production
if errorlevel 1 (
    echo ERROR: Server install failed!
    exit /b 1
cd ..

echo.
echo [3/4] Build complete!
echo.
echo [4/4] Deployment instructions:
echo   1. Upload the 'server/' folder to Hostinger as a Node.js app
echo   2. Set root directory to 'server'
echo   3. Set entry file to 'src/server.js'
echo   4. Set Node.js version to 20.x
echo   5. Add .env variables from server/.env
echo   6. The Express server will serve both API and built client
echo.
echo ==========================================
