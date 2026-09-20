from fastapi import FastAPI

from app.routers.ai import router as ai_router

app = FastAPI(title="Crew Hub AI Service")

app.include_router(ai_router)


@app.get("/health")
def health():
    return {"success": True, "message": "Crew Hub AI service is running"}
