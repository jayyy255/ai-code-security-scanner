from fastapi import FastAPI

app = FastAPI(
    title="Code Security Scanner Service",
    version="1.0.0",
    description="This service is responsible for scanning code for security vulnerabilities and generating reports."
)

@app.get("/")
async def root():
    return {"service": "scanner-service","status": "running","version":"1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}