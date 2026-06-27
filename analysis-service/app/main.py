from fastapi import FastAPI
from app.routers.analyze import router as scan_router
from app.routers.health import router as health_router

app = FastAPI(
    title="Code Security Scanner Service",
    version="1.0.0",
    description="This service is responsible for scanning code for security vulnerabilities and generating reports."
)

@app.get("/")
async def root():
    return {"service": "scanner-service","status": "running","version":"1.0.0"}

app.include_router(health_router)

app.include_router(scan_router)