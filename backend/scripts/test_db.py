import os
from dotenv import load_dotenv
import sqlalchemy

load_dotenv()
url = os.environ.get("DATABASE_URL")
print(f"Connecting to {url}")
try:
    engine = sqlalchemy.create_engine(url, connect_args={"connect_timeout": 5})
    with engine.connect() as conn:
        print("Connected!")
        res = conn.execute(sqlalchemy.text("SELECT 1"))
        print(res.scalar())
except Exception as e:
    print(f"Error: {e}")
