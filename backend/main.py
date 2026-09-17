import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.router import router

app = FastAPI(title="Excel Attendance Analysis API")

# Configurar CORS para permitir peticiones desde el frontend (React)
origins = [
    "https://hikivision-frontend.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000"
]
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    for orig in cors_origins_env.split(","):
        o = orig.strip()
        if o and o not in origins:
            origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Excel Attendance Analysis API is running"}
