# HikiVision

Sistema web para analizar marcaciones de asistencia desde archivos Excel o CSV.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/tipsAW/HikiVision)

## Arquitectura

- `backend/`: API FastAPI que procesa archivos, normaliza columnas y expone endpoints REST.
- `frontend/`: aplicacion React + Vite que consume la API y muestra dashboards, filtros y reportes.

## Despliegue en Render

El repositorio incluye `render.yaml` en la raiz para crear dos servicios desde Render Blueprints:

- `hikivision-backend`: Web Service Python con FastAPI.
- `hikivision-frontend`: Static Site React/Vite.

Render usa automaticamente:

- Backend build: `pip install -r requirements.txt`
- Backend start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Frontend build: `npm ci && npm run build`
- Frontend publish: `frontend/dist`

Variables configuradas en `render.yaml`:

- `PYTHON_VERSION=3.11.9`
- `CORS_ORIGINS=https://hikivision-frontend.onrender.com`
- `NODE_VERSION=24.16.0`
- `VITE_API_URL=https://hikivision-backend.onrender.com`

Si Render asigna otro subdominio o usas dominio propio, actualiza `CORS_ORIGINS` y `VITE_API_URL` en Render.

## Desarrollo local

Backend:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Por defecto, el frontend local usa `http://localhost:8000`. Para apuntarlo a otra API, crea `frontend/.env`:

```env
VITE_API_URL=https://hikivision-backend.onrender.com
```
