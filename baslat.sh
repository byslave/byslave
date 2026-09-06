#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python3 yok. Once Python kur."
  exit 1
fi

if [ ! -x .venv/bin/python ]; then
  echo "Sanal ortam kuruluyor..."
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install -q -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
fi

if ! grep -q '^OPENAI_API_KEY=sk-' .env; then
  echo ".env icine OPENAI_API_KEY=sk-... yaz, kaydet, sonra bu dosyayi tekrar calistir."
  exit 1
fi

echo "Bot aciliyor..."
exec python main.py
