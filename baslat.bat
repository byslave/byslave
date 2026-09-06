@echo off
setlocal
cd /d "%~dp0"

set PY=python
where python >nul 2>nul
if errorlevel 1 set PY=py

where %PY% >nul 2>nul
if errorlevel 1 (
  echo Python yok. https://www.python.org/downloads/ adresinden kur.
  echo Add python.exe to PATH kutusunu isaretle.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo Sanal ortam kuruluyor...
  %PY% -m venv .venv
)

echo Paketler kontrol ediliyor...
.venv\Scripts\python.exe -m pip install -q --upgrade pip
.venv\Scripts\python.exe -m pip install -q -r requirements.txt
if errorlevel 1 (
  echo Paket kurulumu basarisiz. Derleyici gerekmez; pip ve numpy guncel olmali.
  pause
  exit /b 1
)

if not exist ".env" (
  copy /y "env.ornek.txt" ".env" >nul
)

findstr /r /c:"GROQ_API_KEY=gsk" ".env" >nul
if errorlevel 1 findstr /r /c:"OPENAI_API_KEY=sk-" ".env" >nul
if errorlevel 1 (
  echo.
  echo .env icine GROQ_API_KEY yaz. Ucretsiz anahtar: https://console.groq.com/keys
  echo Notepad acilacak. GROQ_API_KEY= satirinin sagina gsk_ anahtarini yapistir, kaydet, kapat.
  echo.
  notepad .env
)

echo Bot aciliyor...
.venv\Scripts\python.exe main.py
if errorlevel 1 (
  echo Bot kapandi veya hata verdi.
  pause
)
