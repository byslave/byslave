@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python yok. Once https://www.python.org/downloads/ adresinden Python kur.
  echo Kurulumda "Add python.exe to PATH" kutusunu isaretle.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo Sanal ortam kuruluyor...
  python -m venv .venv
)

call .venv\Scripts\activate.bat

echo Paketler kontrol ediliyor...
python -m pip install -q -r requirements.txt
if errorlevel 1 (
  echo Paket kurulumu basarisiz. Internetini kontrol et.
  pause
  exit /b 1
)

if not exist ".env" (
  copy /y ".env.example" ".env" >nul
)

findstr /r /c:"OPENAI_API_KEY=sk-" ".env" >nul
if errorlevel 1 (
  echo.
  echo .env dosyasina OpenAI anahtarini yazman gerekiyor.
  echo Notepad acilacak. OPENAI_API_KEY= satirinin sagina sk- anahtarini yapistir, kaydet, kapat.
  echo.
  notepad .env
)

echo Bot aciliyor...
python main.py
if errorlevel 1 (
  echo Bot kapandi veya hata verdi.
  pause
)
