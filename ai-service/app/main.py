from fastapi import FastAPI

app = FastAPI(title="Crew Hub AI Service")


@app.get("/health")
def health():
    return {"success": True, "message": "Crew Hub AI service is running"}
