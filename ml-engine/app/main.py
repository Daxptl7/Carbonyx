from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.score import anomaly_detector, router as score_router
import uvicorn

app = FastAPI(
    title="Carbonyx AI/ML Anomaly Engine",
    description="Patent Module 110: Multi-Source Correlation, Anomaly Detection & XAI Reasoner",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(score_router, tags=["Risk Scoring"])

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "Carbonyx AI/ML Engine",
        "version": "1.0.0",
        "anomalyModel": anomaly_detector.info()
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
