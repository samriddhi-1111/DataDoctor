import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.routes import (
    datasets, quality, cleaning, analytics, visualizations, comparison, insights, exports
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="DataDoctor Intelligent Dataset Analysis & Quality Management System API"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under API prefix
app.include_router(datasets.router, prefix=settings.API_PREFIX)
app.include_router(quality.router, prefix=settings.API_PREFIX)
app.include_router(cleaning.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(visualizations.router, prefix=settings.API_PREFIX)
app.include_router(comparison.router, prefix=settings.API_PREFIX)
app.include_router(insights.router, prefix=settings.API_PREFIX)
app.include_router(exports.router, prefix=settings.API_PREFIX)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "DataDoctor API",
        "version": settings.APP_VERSION,
        "engine": "Python / FastAPI / Pandas / NumPy"
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "app": "DataDoctor API",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }
