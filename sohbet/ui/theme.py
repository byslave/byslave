"""Krem / kahve paleti."""

from __future__ import annotations

CREAM = "#F4E9DC"
CREAM_DARK = "#E8D5BF"
PAPER = "#FFF8F0"
COFFEE = "#4A3428"
COFFEE_SOFT = "#6B4F3F"
LATTE = "#C4A484"
ESPRESSO = "#2C1C14"
FOAM = "#FAF3EA"
MUTED = "#8A7464"
RECORD = "#B85C38"
OK = "#6B8F71"
WARN = "#B0893E"
ERR = "#A33B2B"

FONT_FAMILY = "Segoe UI"


def apply_appearance() -> None:
    import customtkinter as ctk

    ctk.set_appearance_mode("light")
    ctk.set_default_color_theme("green")
