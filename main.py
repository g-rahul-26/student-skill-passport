from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import database

# 1. Create tables first
try:
    models.Base.metadata.create_all(bind=database.engine)
    print("Database connected and tables created!")
except Exception as e:
    print(f"DATABASE CONNECTION ERROR: {e}")

# 2. Define the App
app = FastAPI()

# 3. Define the Routes
@app.post("/register")
def register_user(
    name: str, email: str, college: str,
    personal_profile: str, education_details: str,
    certificates: str, internships: str,
    projects: str, coding_stats: str,
    technical_skills: str, soft_skills: str,
    verified_badges: str,
    db: Session = Depends(database.get_db)
):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        name=name, email=email, college=college,
        personal_profile=personal_profile,
        education_details=education_details,
        certificates=certificates,
        internships=internships,
        projects=projects,
        coding_stats=coding_stats,
        technical_skills=technical_skills,
        soft_skills=soft_skills,
        verified_badges=verified_badges
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "user": new_user}