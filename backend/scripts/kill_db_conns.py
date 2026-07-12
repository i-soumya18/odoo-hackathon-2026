import os
from dotenv import load_dotenv
import sqlalchemy

load_dotenv()
url = os.environ.get("DATABASE_URL")
engine = sqlalchemy.create_engine(url)

with engine.connect() as conn:
    # Kill all other connections
    conn.execute(sqlalchemy.text("""
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE pid <> pg_backend_pid() 
        AND datname = 'ecosphere'
    """))
    conn.commit()
    print("Killed other connections")
