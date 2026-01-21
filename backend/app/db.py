import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import pymysql
pymysql.install_as_MySQLdb()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL belum diset di Vercel env.")

# pastiin driver bener
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = "mysql+pymysql://" + DATABASE_URL[len("mysql://"):]

# CA cert dari env (yang 1 baris)
ca_pem = os.getenv("AIVEN_CA_CERT", "").replace("\\n", "\n").strip()
if not ca_pem:
    raise RuntimeError("AIVEN_CA_CERT belum diset di Vercel env.")

ca_path = "/tmp/aiven-ca.pem"
with open(ca_path, "w") as f:
    f.write(ca_pem)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"ssl": {"ca": ca_path}},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
