import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC

class IntentClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.model = LinearSVC()
        self._train()

    def _train(self):
        data = pd.read_csv("app/data/intents.csv")
        X = self.vectorizer.fit_transform(data["text"])
        y = data["intent"]
        self.model.fit(X, y)

    def predict(self, text: str) -> str:
        X = self.vectorizer.transform([text])
        return self.model.predict(X)[0]