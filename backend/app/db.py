import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Paksa pakai PyMySQL (bukan MySQLdb/mysqlclient)
import pymysql
pymysql.install_as_MySQLdb()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL belum diset di Environment Variables.")

# Auto-fix kalau masih mysql://
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = "mysql+pymysql://" + DATABASE_URL[len("mysql://"):]

# Ambil CA cert Aiven dari env, tulis ke file sementara
ca_pem = os.getenv("AIVEN_CA_CERT", "")
connect_args = {}

if ca_pem.strip():
    ca_path = "/tmp/aiven-ca.pem"
    with open(ca_path, "w") as f:
        f.write(ca_pem)
    connect_args = {"ssl": {"ca": ca_path}}
else:
    # Kalau lo belum masukin cert, minimal jangan fail silent.
    # (Aiven biasanya butuh SSL, jadi ini bakal error sampai cert ada)
    raise RuntimeError("AIVEN_CA_CERT belum diset. Download CA cert dari Aiven dan set di Vercel.")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
