@echo off
cd /d "%~dp0"
if exist ".env" (
  echo .env zaten var.
) else (
  copy /y "env.ornek.txt" ".env" >nul
  echo .env olusturuldu.
)
notepad .env
