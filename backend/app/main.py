from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import httpx
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

SIGHTENGINE_API_USER = os.getenv("SIGHTENGINE_API_USER")
SIGHTENGINE_API_SECRET = os.getenv("SIGHTENGINE_API_SECRET")


@app.get("/")
def read_root():
    return {
        "status": "ok",
        "credentials_loaded": bool(
            SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET
        )
    }


@app.post("/api/detect")
async def detect_image(file: UploadFile = File(...)):

    if not SIGHTENGINE_API_USER or not SIGHTENGINE_API_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Sightengine credentials are not configured"
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file"
        )

    image_bytes = await file.read()

    files = {
        "media": (
            file.filename,
            image_bytes,
            file.content_type
        )
    }

    data = {
        "models": "genai",
        "api_user": SIGHTENGINE_API_USER,
        "api_secret": SIGHTENGINE_API_SECRET
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.sightengine.com/1.0/check.json",
                data=data,
                files=files
            )

        result = response.json()

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Sightengine"
        )

    if result.get("status") != "success":
        raise HTTPException(
            status_code=502,
            detail="Sightengine returned an error"
        )

    ai_score = result.get("type", {}).get("ai_generated")

    if ai_score is None:
        raise HTTPException(
            status_code=502,
            detail="Sightengine did not return an AI-generated score"
        )

    ai_percentage = round(ai_score * 100, 2)

    if ai_percentage >= 50:
        verdict = "Likely AI-generated"
    else:
        verdict = "Likely real"

    return {
        "filename": file.filename,
        "ai_percentage": ai_percentage,
        "verdict": verdict
    }
