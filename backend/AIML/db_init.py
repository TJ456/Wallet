from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()
db_url = os.getenv("db_url")

engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()