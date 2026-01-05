import os
import pandas as pd
from joblib import dump
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

DATA_PATH = os.path.join("app/data", "intents.csv")
OUT_PATH = os.getenv("INTENT_MODEL_PATH", "./artifacts/intent_model.joblib")

def main():
    df = pd.read_csv(DATA_PATH)
    X = df["text"].astype(str).tolist()
    y = df["label"].astype(str).tolist()

    clf = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1,2), lowercase=True)),
        ("lr", LogisticRegression(max_iter=2000))
    ])

    clf.fit(X, y)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    dump(clf, OUT_PATH)
    print(f"Saved intent model -> {OUT_PATH}")

if __name__ == "__main__":
    main()
