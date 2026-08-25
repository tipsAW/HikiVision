import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.router import router

app = FastAPI(title="Excel Attendance Analysis API")

# Configurar CORS para permitir peticiones desde el frontend (React)
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Excel Attendance Analysis API is running"}
