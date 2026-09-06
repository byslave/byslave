"""Uygulama ayarları. API anahtarları yalnızca ortam / .env üzerinden okunur."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

from sohbet.voices import normalize_voice

PROJECT_ROOT = Path(__file__).resolve().parent.parent
GROQ_BASE = "https://api.groq.com/openai/v1"
DEFAULT_GROQ_MODEL = "qwen/qwen3.8-27b"

# Groq ücretsiz planda kapanmış modeller — eski .env dosyaları bozulmasın.
DEPRECATED_GROQ_MODELS = {
    "llama-3.1-8b-instant": DEFAULT_GROQ_MODEL,
    "llama-3.3-70b-versatile": DEFAULT_GROQ_MODEL,
    "qwen/qwen3-32b": DEFAULT_GROQ_MODEL,
    "meta-llama/llama-4-scout-17b-16e-instruct": DEFAULT_GROQ_MODEL,
}


def _clean_env(value: str) -> str:
    text = (value or "").strip()
    if len(text) >= 2 and text[0] == text[-1] and text[0] in {'"', "'"}:
        return text[1:-1].strip()
    return text


def _is_placeholder_secret(value: str) -> bool:
    """gsk_... / sk-... gibi şablon veya çok kısa değerleri anahtar sayma."""
    text = _clean_env(value)
    if not text:
        return True
    if "..." in text or text.endswith("...") or set(text) <= {".", "*", "x", "_", "-"}:
        return True
    if text in {"gsk_", "sk-", "sk-proj-", "your_key", "gsk_senin_anahtarin"}:
        return True
    if text.startswith("gsk_") and len(text) < 20:
        return True
    if text.startswith("sk-") and len(text) < 20:
        return True
    return False


def _is_env_key(name: str) -> bool:
    return bool(name) and all(ch.isalnum() or ch == "_" for ch in name)


def _env(name: str, default: str = "") -> str:
    return _clean_env(os.getenv(name, default))


def remap_groq_model(model: str) -> str:
    name = _clean_env(model) or DEFAULT_GROQ_MODEL
    return DEPRECATED_GROQ_MODELS.get(name, name)


def _env_candidates(explicit: Path | None = None) -> list[Path]:
    if explicit is not None:
        return [explicit]
    seen: set[Path] = set()
    out: list[Path] = []
    for path in (PROJECT_ROOT / ".env", Path.cwd() / ".env"):
        resolved = path.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)
        out.append(path)
    return out


def parse_env_text(text: str) -> dict[str, str]:
    """İlk geçerli değeri tut. Şablon gsk_... ve komut satırlarını atla."""
    found: dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = _clean_env(value)
        if not _is_env_key(key):
            continue
        if key in {"GROQ_API_KEY", "OPENAI_API_KEY"}:
            if key in found or _is_placeholder_secret(value):
                continue
            found[key] = value
            continue
        if key not in found and value:
            found[key] = value
    return found


def _apply_parsed(parsed: dict[str, str]) -> None:
    for key, value in parsed.items():
        current = os.environ.get(key, "")
        if key in {"GROQ_API_KEY", "OPENAI_API_KEY"}:
            if current and not _is_placeholder_secret(current):
                continue
            os.environ[key] = value
            continue
        if not current:
            os.environ[key] = value
    if _is_placeholder_secret(_env("GROQ_API_KEY")):
        os.environ.pop("GROQ_API_KEY", None)
    if _is_placeholder_secret(_env("OPENAI_API_KEY")):
        os.environ.pop("OPENAI_API_KEY", None)


def _read_env_text(path: Path) -> str:
    for encoding in ("utf-8", "utf-8-sig", "utf-16", "utf-16-le", "cp1254"):
        try:
            return path.read_text(encoding=encoding)
        except (OSError, UnicodeError):
            continue
    return ""


def _load_env_file(path: Path) -> bool:
    if not path.exists():
        return False
    text = _read_env_text(path)
    parsed = parse_env_text(text) if text else {}
    if parsed:
        _apply_parsed(parsed)
        return True
    load_dotenv(path, override=False)
    _apply_parsed({})
    return True


def _clear_empty_base_url() -> None:
    # Boş OPENAI_BASE_URL SDK'yı kırıyor (protokolsüz adres).
    if not _env("OPENAI_BASE_URL"):
        os.environ.pop("OPENAI_BASE_URL", None)


def load_env(env_path: Path | None = None) -> None:
    """Proje kökündeki .env dosyasını yükle. Mevcut ortam değişkenlerini ezme."""
    for path in _env_candidates(env_path):
        if path.exists():
            _load_env_file(path)
            break
    _clear_empty_base_url()


def _search_dirs() -> list[Path]:
    seen: set[Path] = set()
    out: list[Path] = []
    for path in (PROJECT_ROOT, Path.cwd()):
        resolved = path.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)
        out.append(path)
    return out


def _file_has_filled_key(path: Path) -> bool:
    if not path.exists():
        return False
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return False
    for raw in text.splitlines():
        line = raw.strip().replace(" ", "")
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        if key in {"GROQ_API_KEY", "OPENAI_API_KEY"} and not _is_placeholder_secret(value):
            return True
    return False


def inspect_env_file(path: Path | None = None) -> dict[str, object]:
    """Anahtar yazmadan .env kargaşasını özetle."""
    target = path or PROJECT_ROOT / ".env"
    info: dict[str, object] = {
        "exists": target.exists(),
        "key_lines": 0,
        "placeholder_key": False,
        "real_key": False,
        "command_line": False,
        "models": [],
    }
    if not target.exists():
        return info
    text = _read_env_text(target)
    models: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if "python.exe" in line.lower() or line.lower().startswith(".venv"):
            info["command_line"] = True
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = _clean_env(value)
        if key == "GROQ_API_KEY":
            info["key_lines"] = int(info["key_lines"]) + 1
            if _is_placeholder_secret(value):
                info["placeholder_key"] = True
            else:
                info["real_key"] = True
        if key == "GROQ_MODEL" and value:
            models.append(value)
    info["models"] = models
    return info


def diagnose_setup(settings: Settings | None = None) -> str:
    """Anahtar yoksa kullanıcıya dosya adını / konumu anlat. Anahtar yazdırılmaz."""
    if settings is not None and settings.api_configured:
        return ""

    env_exists = False
    env_txt = False
    example_has_key = False
    for folder in _search_dirs():
        if (folder / ".env").exists():
            env_exists = True
        if (folder / ".env.txt").exists() or (folder / "env.txt").exists():
            env_txt = True
        if _file_has_filled_key(folder / ".env.example") or _file_has_filled_key(folder / "env.ornek.txt"):
            example_has_key = True

    if env_txt and not env_exists:
        return (
            "`.env` yok; `.env.txt` var. Windows uzantıyı gizliyor olabilir. "
            "Dosya adını tam olarak `.env` yap (uzantısız), botu yeniden aç."
        )
    if example_has_key:
        return (
            "Anahtar `.env.example` veya `env.ornek.txt` içinde duruyor. "
            "Aynı satırı `main.py` yanındaki `.env` dosyasına taşı."
        )
    if not env_exists:
        return (
            "`.env` bulunamadı. `env.ornek.txt` dosyasını kopyalayıp adını `.env` yap, "
            "içine GROQ_API_KEY=gsk_... yaz. Anahtar: https://console.groq.com/keys"
        )
    inspected = inspect_env_file()
    if inspected["placeholder_key"] and inspected["real_key"]:
        return (
            "`.env` içinde GROQ_API_KEY iki kez var. `gsk_...` yazan satırı sil; "
            "yalnız gerçek anahtar kalsın. Komut satırını da sil."
        )
    if inspected["placeholder_key"] and not inspected["real_key"]:
        return (
            "`.env` içinde anahtar `gsk_...` diye duruyor. Groq konsolundaki gerçek anahtarı yaz."
        )
    if inspected["command_line"]:
        return (
            "`.env` içine `.venv\\Scripts\\python.exe main.py` yazılmış. "
            "O satırı sil; komutu terminale yaz."
        )
    return (
        "`.env` var ama GROQ_API_KEY boş. https://console.groq.com/keys adresinden "
        "ücretsiz anahtar alıp `GROQ_API_KEY=` sağına gerçek anahtarı yaz."
    )


@dataclass(frozen=True)
class Settings:
    openai_api_key: str
    openai_model: str
    openai_stt_model: str
    openai_tts_model: str
    openai_tts_voice: str
    openai_base_url: str | None
    openai_realtime_model: str = "gpt-4o-mini-realtime-preview"
    groq_api_key: str = ""
    groq_model: str = DEFAULT_GROQ_MODEL
    groq_stt_model: str = "whisper-large-v3"
    provider: str = "auto"
    sample_rate: int = 16000
    live_sample_rate: int = 24000

    @property
    def resolved_provider(self) -> str:
        wanted = (self.provider or "auto").strip().lower()
        if wanted == "groq" and self.groq_api_key.strip():
            return "groq"
        if wanted == "openai" and self.openai_api_key.strip():
            return "openai"
        if self.groq_api_key.strip():
            return "groq"
        if self.openai_api_key.strip():
            return "openai"
        return "none"

    @property
    def api_configured(self) -> bool:
        return self.resolved_provider != "none"

    @property
    def active_api_key(self) -> str:
        if self.resolved_provider == "groq":
            return self.groq_api_key.strip()
        return self.openai_api_key.strip()

    @property
    def client_base_url(self) -> str | None:
        if self.resolved_provider == "groq":
            return GROQ_BASE
        return self.openai_base_url

    @property
    def llm_model(self) -> str:
        if self.resolved_provider == "groq":
            return self.groq_model
        return self.openai_model

    @property
    def stt_model(self) -> str:
        if self.resolved_provider == "groq":
            return self.groq_stt_model
        return self.openai_stt_model

    @property
    def uses_gtts(self) -> bool:
        return self.resolved_provider == "groq"

    @property
    def uses_openai_realtime(self) -> bool:
        return self.resolved_provider == "openai"


def get_settings() -> Settings:
    load_env()
    base_url = _env("OPENAI_BASE_URL") or None
    return Settings(
        openai_api_key=_env("OPENAI_API_KEY"),
        openai_model=_env("OPENAI_MODEL", "gpt-4o-mini") or "gpt-4o-mini",
        openai_stt_model=_env("OPENAI_STT_MODEL", "whisper-1") or "whisper-1",
        openai_tts_model=_env("OPENAI_TTS_MODEL", "tts-1") or "tts-1",
        openai_tts_voice=normalize_voice(_env("OPENAI_TTS_VOICE", "nova")),
        openai_base_url=base_url,
        openai_realtime_model=(
            _env("OPENAI_REALTIME_MODEL", "gpt-4o-mini-realtime-preview")
            or "gpt-4o-mini-realtime-preview"
        ),
        groq_api_key="" if _is_placeholder_secret(_env("GROQ_API_KEY")) else _env("GROQ_API_KEY"),
        groq_model=remap_groq_model(_env("GROQ_MODEL", DEFAULT_GROQ_MODEL)),
        groq_stt_model=_env("GROQ_STT_MODEL", "whisper-large-v3") or "whisper-large-v3",
        provider=_env("PROVIDER", "auto") or "auto",
    )
