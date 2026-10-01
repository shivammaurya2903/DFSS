@echo off
cd /d E:\Projects\DFSS\backend
node src\index.js &
timeout 3
echo.
echo Testing backend health endpoint:
curl -s http://localhost:5000/api/health
echo.
echo.
echo Starting storage node 1:
cd E:\Projects\DFSS\storage-nodes\node-1
node src\index.js &
timeout 3
echo.
echo Testing storage node 1 health endpoint:
curl -s http://localhost:5001/internal/health
echo.
echo All tests complete.