# backend/app/services/intent_classifier.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple, Optional

import joblib


@dataclass
class IntentClassifier:
    model_path: str = "models/intent_model.joblib"

    def __post_init__(self) -> None:
        self.pipeline: Optional[object] = None
        try:
            self.pipeline = joblib.load(self.model_path)
        except Exception:
            # Model belum ada / path salah: biar server tetap jalan
            self.pipeline = None

    def predict(self, text: str) -> Tuple[str, float]:
        """
        WAJIB return (intent, confidence) saja.
        confidence: 0.0 - 1.0
        """
        if not text:
            return "unknown", 0.0

        # Kalau model belum ada, pakai rule super sederhana biar demo tetap hidup
        if self.pipeline is None:
            t = text.lower()
            if "kamar" in t and ("kosong" in t or "tersedia" in t):
                return "check_availability", 0.8
            if "harga" in t or "rp" in t:
                return "ask_price", 0.7
            if "fasilitas" in t or "wifi" in t or "ac" in t:
                return "ask_facilities", 0.7
            if "lokasi" in t or "alamat" in t:
                return "ask_location", 0.7
            return "unknown", 0.2

        # Kalau pipeline sklearn tersedia
        label = self.pipeline.predict([text])[0]

        confidence = 0.6
        if hasattr(self.pipeline, "predict_proba"):
            proba = self.pipeline.predict_proba([text])[0]
            confidence = float(max(proba))

        return str(label), float(confidence)
