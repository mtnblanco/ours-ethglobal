from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

app = FastAPI(title="KYC Mock Demo")

# Allow all origins for demo purposes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AddressMock(BaseModel):
    buildingNumber: Optional[str] = None
    street: Optional[str] = None
    town: Optional[str] = None
    postcode: Optional[str] = None
    country: Optional[str] = None

class UserMock(BaseModel):
    """Mock user structure based on OnfidoApplicant from your backend"""
    id: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    dob: Optional[str] = None  # Date of birth
    address: Optional[AddressMock] = None
    user_address: Optional[str] = None  # Wallet address (from WorldID flow)

@app.post("/verify")
async def verify_user(user: UserMock):
    """Demo endpoint: receives a mocked user and returns isverified=true always."""
    return {"isverified": True, "user": user.dict()}

@app.get("/health")
async def health():
    return {"status": "ok"}

# Vercel handler
handler = Mangum(app)