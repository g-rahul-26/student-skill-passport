from sqlalchemy import Column, Integer, String, Text
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    college = Column(String)
    personal_profile = Column(Text)
    education_details = Column(Text)
    certificates = Column(Text)
    internships = Column(Text)
    projects = Column(Text)
    coding_stats = Column(String)
    technical_skills = Column(Text)
    soft_skills = Column(Text)
    verified_badges = Column(String)