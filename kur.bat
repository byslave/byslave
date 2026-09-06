@echo off
setlocal
cd /d "%~dp0"

set PY=py
where py >nul 2>nul
if errorlevel 1 set PY=python

echo Python surumu:
%PY% --version

if not exist ".venv\Scripts\python.exe" (
  echo Sanal ortam kuruluyor...
  %PY% -3.12 -m venv .venv 2>nul
  if not exist ".venv\Scripts\python.exe" %PY% -m venv .venv
)

echo pip guncelleniyor...
.venv\Scripts\python.exe -m pip install --upgrade pip
echo Paketler (hazir tekerlek, derleme yok)...
.venv\Scripts\python.exe -m pip install --only-binary=:all: numpy
if errorlevel 1 (
  echo.
  echo Numpy Python 3.14 icin hazir gelmedi.
  echo https://www.python.org/downloads/release/python-31210/
  echo adresinden Python 3.12 kur, sonra bu klasorde .venv klasorunu silip kur.bat'i tekrar calistir.
  pause
  exit /b 1
)
.venv\Scripts\python.exe -m pip install customtkinter "openai>=1.59" python-dotenv sounddevice soundfile pygame websockets gTTS
if errorlevel 1 (
  echo Paket kurulumu basarisiz.
  pause
  exit /b 1
)
echo Tamam. Simdi baslat.bat veya:
echo   .venv\Scripts\python.exe main.py
pause
