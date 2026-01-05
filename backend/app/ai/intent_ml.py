import os
from joblib import load

_model = None

def _load_model():
    global _model
    if _model is None:
        path = os.getenv("INTENT_MODEL_PATH", "./artifacts/intent_model.joblib")
        if not os.path.exists(path):
            raise RuntimeError(
                f"Intent model belum ada: {path}. Jalankan: python scripts/train_intent.py"
            )
        _model = load(path)
    return _model

def predict_intent(text: str) -> tuple[str, float]:
    model = _load_model()
    label = model.predict([text])[0]
    proba = model.predict_proba([text])[0]
    conf = float(max(proba))
    print("DEBUG INTENT:", label, conf)
    return label, conf
