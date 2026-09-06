"""Kişisel sohbet masaüstü arayüzü. Bas-konuş döngüsü arka planda çalışır."""

from __future__ import annotations

import queue
import threading
import tkinter as tk
from collections.abc import Callable

import customtkinter as ctk

from sohbet.audio.recorder import PushToTalkRecorder
from sohbet.errors import AppError, user_message
from sohbet.live import LiveSession, create_live
from sohbet.turn_live import TurnLiveSession
from sohbet.session import ChatSession
from sohbet.ui import theme
from sohbet.voices import VOICE_LABELS, label_for, voice_from_label


class ChatApp(ctk.CTk):
    def __init__(
        self,
        session: ChatSession,
        api_ready: bool,
        startup_error: str | None = None,
    ) -> None:
        super().__init__()
        self.session = session
        self.recorder = PushToTalkRecorder()
        self._live: LiveSession | TurnLiveSession | None = None
        self._events: queue.Queue[tuple[str, object]] = queue.Queue()
        self._busy = False

        theme.apply_appearance()
        self.title("Sohbet")
        self.geometry("920x760")
        self.minsize(760, 620)
        self.configure(fg_color=theme.CREAM)

        self._build()
        self._set_api_status(connected=api_ready, checking=False)
        if startup_error and not api_ready:
            self._show_error(startup_error)
        self.after(80, self._drain_events)
        self.protocol("WM_DELETE_WINDOW", self._on_close)

    def _build(self) -> None:
        header = ctk.CTkFrame(self, fg_color=theme.CREAM, corner_radius=0)
        header.pack(fill="x", padx=28, pady=(22, 8))

        title = ctk.CTkLabel(
            header,
            text="Sohbet",
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=32, weight="bold"),
            text_color=theme.COFFEE,
        )
        title.pack(side="left")

        subtitle = ctk.CTkLabel(
            header,
            text="kişisel sesli sohbet",
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=14),
            text_color=theme.MUTED,
        )
        subtitle.pack(side="left", padx=(12, 0), pady=(10, 0))

        self.status_dot = ctk.CTkLabel(header, text="●", font=ctk.CTkFont(size=16), text_color=theme.WARN)
        self.status_dot.pack(side="right")
        self.status_label = ctk.CTkLabel(
            header,
            text="API kontrol ediliyor",
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=13),
            text_color=theme.MUTED,
        )
        self.status_label.pack(side="right", padx=(0, 8))

        body = ctk.CTkFrame(self, fg_color=theme.CREAM)
        body.pack(fill="both", expand=True, padx=28, pady=8)

        history_card = ctk.CTkFrame(body, fg_color=theme.PAPER, corner_radius=18)
        history_card.pack(fill="both", expand=True)
        history_card.pack_propagate(False)

        hist_title = ctk.CTkLabel(
            history_card,
            text="Konuşma",
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=13, weight="bold"),
            text_color=theme.COFFEE_SOFT,
        )
        hist_title.pack(anchor="w", padx=18, pady=(14, 0))

        self.history = ctk.CTkTextbox(
            history_card,
            fg_color=theme.PAPER,
            text_color=theme.ESPRESSO,
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=14),
            wrap="word",
            activate_scrollbars=True,
            border_width=0,
        )
        self.history.pack(fill="both", expand=True, padx=10, pady=(4, 12))
        self.history.configure(state="disabled")

        reply_card = ctk.CTkFrame(body, fg_color=theme.CREAM_DARK, corner_radius=18, height=120)
        reply_card.pack(fill="x", pady=(12, 0))
        reply_card.pack_propagate(False)

        reply_title = ctk.CTkLabel(
            reply_card,
            text="Cevap",
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=13, weight="bold"),
            text_color=theme.COFFEE_SOFT,
        )
        reply_title.pack(anchor="w", padx=18, pady=(12, 0))

        self.reply_label = ctk.CTkLabel(
            reply_card,
            text="Canlı konuşmayı aç veya bas-konuş ile konuş.",
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=15),
            text_color=theme.COFFEE,
            wraplength=760,
            justify="left",
            anchor="w",
        )
        self.reply_label.pack(fill="x", padx=18, pady=(4, 14))

        controls = ctk.CTkFrame(self, fg_color=theme.CREAM)
        controls.pack(fill="x", padx=28, pady=(4, 10))

        self.mic_button = ctk.CTkButton(
            controls,
            text="🎤  Bas-konuş",
            width=200,
            height=48,
            corner_radius=24,
            fg_color=theme.COFFEE,
            hover_color=theme.COFFEE_SOFT,
            text_color=theme.FOAM,
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=15, weight="bold"),
        )
        self.mic_button.pack(side="left")
        self.mic_button.bind("<ButtonPress-1>", self._on_mic_press)
        self.mic_button.bind("<ButtonRelease-1>", self._on_mic_release)

        self.text_entry = ctk.CTkEntry(
            controls,
            placeholder_text="Yazarak da konuş…",
            width=260,
            height=40,
            corner_radius=16,
            fg_color=theme.PAPER,
            border_color=theme.LATTE,
            text_color=theme.ESPRESSO,
            placeholder_text_color=theme.MUTED,
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=13),
        )
        self.text_entry.pack(side="left", padx=(18, 0))
        self.text_entry.bind("<Return>", self._on_text_submit)

        self.voice_var = ctk.BooleanVar(value=True)
        self.voice_switch = ctk.CTkSwitch(
            controls,
            text="Sesli cevap",
            variable=self.voice_var,
            command=self._on_voice_toggle,
            progress_color=theme.LATTE,
            button_color=theme.COFFEE,
            button_hover_color=theme.COFFEE_SOFT,
            fg_color=theme.CREAM_DARK,
            text_color=theme.COFFEE,
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=13),
        )
        self.voice_switch.pack(side="left", padx=22)

        clear_btn = ctk.CTkButton(
            controls,
            text="Geçmişi temizle",
            width=150,
            height=40,
            corner_radius=16,
            fg_color=theme.CREAM_DARK,
            hover_color=theme.LATTE,
            text_color=theme.COFFEE,
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=13),
            command=self._clear_history,
        )
        clear_btn.pack(side="right")

        extras = ctk.CTkFrame(self, fg_color=theme.CREAM)
        extras.pack(fill="x", padx=28, pady=(0, 4))

        self.live_var = ctk.BooleanVar(value=True)
        self.live_switch = ctk.CTkSwitch(
            extras,
            text="Canlı konuşma",
            variable=self.live_var,
            command=self._on_live_toggle,
            progress_color=theme.LATTE,
            button_color=theme.COFFEE,
            button_hover_color=theme.COFFEE_SOFT,
            fg_color=theme.CREAM_DARK,
            text_color=theme.COFFEE,
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=13),
        )
        self.live_switch.pack(side="left", padx=(0, 18))

        voice_label = ctk.CTkLabel(
            extras,
            text="Ses tonu",
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=13),
            text_color=theme.COFFEE,
        )
        voice_label.pack(side="left")

        current = "nova"
        if hasattr(self.session.tts, "voice"):
            current = getattr(self.session.tts, "voice") or "nova"
        self.voice_choice = ctk.CTkOptionMenu(
            extras,
            values=list(VOICE_LABELS.values()),
            command=self._on_voice_choice,
            width=220,
            height=32,
            fg_color=theme.CREAM_DARK,
            button_color=theme.COFFEE,
            button_hover_color=theme.COFFEE_SOFT,
            dropdown_fg_color=theme.PAPER,
            dropdown_hover_color=theme.CREAM_DARK,
            text_color=theme.COFFEE,
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=13),
        )
        self.voice_choice.set(label_for(current))
        self.voice_choice.pack(side="left", padx=(10, 0))

        self.hint = ctk.CTkLabel(
            self,
            text="Canlı: düğmeye bir kez bas, konuşmaya başla. Sustuğunda cevap gelir; sözünü kesmek için konuş.",
            font=ctk.CTkFont(family=theme.FONT_FAMILY, size=12),
            text_color=theme.MUTED,
        )
        self.hint.pack(padx=28, pady=(0, 18), anchor="w")

        self.mic_button.configure(command=self._on_mic_click)
        self.mic_button.configure(text="🎤  Canlı başlat")

    def _on_voice_choice(self, label: str) -> None:
        chosen = self.session.set_tts_voice(voice_from_label(label))
        if self._live is not None:
            self._live.set_voice(chosen)
        self.hint.configure(text=f"Ses tonu: {label_for(chosen)}. Bir sonraki cevap bu sesle okunur.")

    def _on_voice_toggle(self) -> None:
        self.session.voice_enabled = bool(self.voice_var.get())

    def _on_live_toggle(self) -> None:
        if self.live_var.get():
            if self.recorder.is_recording():
                try:
                    self.recorder.stop()
                except Exception:
                    pass
            self.mic_button.configure(text="🎤  Canlı başlat", fg_color=theme.COFFEE, hover_color=theme.COFFEE_SOFT)
            self.hint.configure(text="Canlı: düğmeye bir kez bas, konuşmaya başla. Sustuğunda cevap gelir.")
            return
        self._stop_live(user_stopped=True)
        self.mic_button.configure(text="🎤  Bas-konuş", fg_color=theme.COFFEE, hover_color=theme.COFFEE_SOFT)
        self.hint.configure(text="Bas-konuş: düğmeyi basılı tut, konuş, bırak.")

    def _on_mic_click(self) -> None:
        if self.live_var.get():
            self._toggle_live()

    def _toggle_live(self) -> None:
        if self._live is not None and self._live.running:
            self._stop_live(user_stopped=True)
            return
        self._start_live()

    def _current_voice(self) -> str:
        if hasattr(self.session.tts, "voice"):
            return getattr(self.session.tts, "voice") or "nova"
        return "nova"

    def _start_live(self) -> None:
        self.session.player.stop()
        try:
            live = create_live(self.session, self._on_live_event)
            live.start()
        except Exception as exc:
            detail = user_message(exc)
            if isinstance(exc, AppError) and exc.detail:
                detail = f"{detail} ({exc.detail[:120]})"
            self._show_error(detail)
            return
        self._live = live
        self.mic_button.configure(text="●  Canlı · durdur", fg_color=theme.RECORD, hover_color="#9A4A2E")
        self.reply_label.configure(text="Dinliyorum. Konuşman yeterli, düğmeye tekrar basmana gerek yok.")
        self.hint.configure(text="Canlı oturum açık. Sözünü kesmek için konuş.")

    def _stop_live(self, user_stopped: bool = False) -> None:
        live = self._live
        self._live = None
        if live is not None:
            try:
                live.stop()
            except Exception:
                pass
        if self.live_var.get():
            self.mic_button.configure(text="🎤  Canlı başlat", fg_color=theme.COFFEE, hover_color=theme.COFFEE_SOFT)
            if user_stopped:
                self.hint.configure(text="Canlı durdu. Tekrar başlatmak için düğmeye bas.")

    def _on_live_event(self, kind: str, text: str) -> None:
        self._events.put((f"live_{kind}", text))

    def _on_text_submit(self, _event: tk.Event | None = None) -> None:
        text = self.text_entry.get().strip()
        if not text or self._busy:
            return
        if self._live is not None and self._live.running:
            self.hint.configure(text="Canlı oturum açıkken yazma kapalı. Önce canlıyı durdur veya konuş.")
            return
        self.text_entry.delete(0, "end")
        self._run_async(lambda: self.session.handle_text(text), after=self._on_turn_done)

    def _set_api_status(self, connected: bool, checking: bool = False) -> None:
        if checking:
            self.status_dot.configure(text_color=theme.WARN)
            self.status_label.configure(text="API kontrol ediliyor")
            return
        if connected:
            self.status_dot.configure(text_color=theme.OK)
            provider = ""
            if self.session.settings is not None:
                provider = self.session.settings.resolved_provider
            if provider == "groq":
                self.status_label.configure(text="Groq bağlı (ücretsiz)")
            else:
                self.status_label.configure(text="API bağlı")
            return
        self.status_dot.configure(text_color=theme.ERR)
        configured = bool(self.session.settings and self.session.settings.api_configured)
        if configured:
            self.status_label.configure(text="API yanıt vermedi")
        else:
            self.status_label.configure(text="API bağlı değil")

    def _append_history(self, who: str, text: str) -> None:
        self.history.configure(state="normal")
        prefix = "Sen" if who == "user" else "Bot"
        self.history.insert("end", f"{prefix}\n{text}\n\n")
        self.history.see("end")
        self.history.configure(state="disabled")

    def _clear_history(self) -> None:
        was_live = self._live is not None and self._live.running
        self._stop_live()
        self.session.clear()
        self.history.configure(state="normal")
        self.history.delete("1.0", "end")
        self.history.configure(state="disabled")
        self.reply_label.configure(text="Geçmiş temiz. Yeni bir şey söyle, baştan başlarız.")
        if was_live and self.live_var.get():
            self._start_live()

    def _on_mic_press(self, _event: tk.Event) -> None:
        if self.live_var.get() or self._busy:
            return
        try:
            self.recorder.start()
        except Exception as exc:
            self._show_error(user_message(exc))
            return
        self.mic_button.configure(text="●  Dinliyorum…", fg_color=theme.RECORD, hover_color="#9A4A2E")
        self.hint.configure(text="Konuşuyorsun. Bitince düğmeyi bırak.")

    def _on_mic_release(self, _event: tk.Event) -> None:
        if self.live_var.get() or not self.recorder.is_recording():
            return
        try:
            wav_bytes = self.recorder.stop()
        except Exception as exc:
            self.mic_button.configure(text="🎤  Bas-konuş", fg_color=theme.COFFEE, hover_color=theme.COFFEE_SOFT)
            self._show_error(user_message(exc))
            return
        self.mic_button.configure(text="🎤  Bas-konuş", fg_color=theme.COFFEE, hover_color=theme.COFFEE_SOFT)
        self._run_async(lambda: self.session.handle_audio(wav_bytes), after=self._on_turn_done)

    def _run_async(self, work: Callable[[], tuple[str, str]], after: Callable[[str, str], None]) -> None:
        if self._busy:
            return
        self._busy = True
        self.hint.configure(text="Düşünüyor…")

        def target() -> None:
            try:
                result = work()
                self._events.put(("ok", result))
            except Exception as exc:
                self._events.put(("err", user_message(exc)))

        threading.Thread(target=target, daemon=True).start()
        self._pending_after = after

    def _on_turn_done(self, user_text: str, reply: str) -> None:
        self._append_history("user", user_text)
        self._append_history("assistant", reply)
        self.reply_label.configure(text=reply)
        self.hint.configure(text="Tekrar konuşmak için basılı tut.")

    def _show_error(self, message: str) -> None:
        self.reply_label.configure(text=message)
        self.hint.configure(text="Hata oluştu, uygulama açık kalmaya devam ediyor.")

    def _drain_events(self) -> None:
        try:
            while True:
                kind, payload = self._events.get_nowait()
                self._busy = False
                if kind == "ok":
                    user_text, reply = payload  # type: ignore[misc]
                    self._pending_after(user_text, reply)
                elif kind == "live_user":
                    self._append_history("user", str(payload))
                elif kind == "live_assistant_partial":
                    self.reply_label.configure(text=str(payload))
                elif kind == "live_assistant":
                    self._append_history("assistant", str(payload))
                    self.reply_label.configure(text=str(payload))
                    self.hint.configure(text="Cevap geldi. Konuşmaya devam edebilirsin.")
                elif kind == "live_status":
                    self.hint.configure(text=str(payload))
                elif kind == "live_err":
                    self._show_error(str(payload))
                    self._stop_live()
                else:
                    self._show_error(str(payload))
        except queue.Empty:
            pass
        self.after(80, self._drain_events)

    def _on_close(self) -> None:
        self._stop_live()
        try:
            if self.recorder.is_recording():
                self.recorder.stop()
        except Exception:
            pass
        self.session.player.stop()
        self.destroy()


def run_app(
    session: ChatSession,
    api_ready: bool,
    startup_error: str | None = None,
) -> None:
    app = ChatApp(session, api_ready=api_ready, startup_error=startup_error)
    app.mainloop()
