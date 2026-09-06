@echo off
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" kontrol.py
) else (
  py kontrol.py
)
echo.
pause
