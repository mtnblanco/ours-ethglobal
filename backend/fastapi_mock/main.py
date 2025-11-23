from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

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
    """Demo endpoint: receives a mocked user and returns isverified=true always.

    Request body example:
    {
      "firstName": "John",
      "lastName": "Doe", 
      "email": "demo@example.com",
      "user_address": "0xabc...",
      "address": {
        "street": "123 Demo St",
        "town": "Demo City", 
        "country": "ES"
      }
    }

    Response:
      { "isverified": true, "user": { ... } }
    """
    return {"isverified": True, "user": user.dict()}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 9000))
    uvicorn.run(app, host="0.0.0.0", port=port)
