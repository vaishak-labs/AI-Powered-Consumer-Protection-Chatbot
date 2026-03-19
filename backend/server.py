from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from groq import Groq
import uuid
import logging
import jwt
import os

# ----------------------------
# Load environment variables
# ----------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

# ----------------------------
# Create FastAPI app first ✅
# ----------------------------
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ----------------------------
# MongoDB connection
# ----------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, tlsAllowInvalidCertificates=True)
db = client[os.environ['DB_NAME']]

# ----------------------------
# Security + Config
# ----------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_MINUTES = int(os.environ.get('JWT_EXPIRATION_MINUTES', '1440'))

# ----------------------------
# Groq Client
# ----------------------------
groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))
GROQ_MODEL = "llama-3.3-70b-versatile"

# ----------------------------
# Models
# ----------------------------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    name: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RegisterRequest(BaseModel):
    username: str
    email: str
    name: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    username: str

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "New Chat"
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

# ----------------------------
# API Endpoints
# ----------------------------

# Authentication Endpoints
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    # Check if username already exists
    existing_user = await db.users.find_one({"username": request.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email already exists
    existing_email = await db.users.find_one({"email": request.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create new user
    hashed_password = pwd_context.hash(request.password)
    user = User(
        username=request.username,
        email=request.email,
        name=request.name,
        hashed_password=hashed_password
    )
    
    await db.users.insert_one(user.model_dump())
    
    # Generate JWT token
    token = jwt.encode(
        {"sub": user.username, "user_id": user.id},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    return AuthResponse(access_token=token, username=user.username)


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    # Find user by username
    user_data = await db.users.find_one({"username": request.username})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if not pwd_context.verify(request.password, user_data["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Generate JWT token
    token = jwt.encode(
        {"sub": user_data["username"], "user_id": user_data["id"]},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    return AuthResponse(access_token=token, username=user_data["username"])


# Chat Endpoints
@api_router.post("/chat/message", response_model=ChatResponse)
async def send_message(chat_request: ChatRequest):
    session_id = chat_request.session_id
    user_id = chat_request.user_id
    
    if not session_id:
        # Create a title from first message (first 50 chars)
        title = chat_request.message[:50] + ("..." if len(chat_request.message) > 50 else "")
        session = ChatSession(title=title, user_id=user_id)
        await db.chat_sessions.insert_one(session.model_dump())
        session_id = session.id
    else:
        # Update session's updated_at timestamp
        await db.chat_sessions.update_one(
            {"id": session_id},
            {"$set": {"updated_at": datetime.now(timezone.utc)}}
        )

    user_text = chat_request.message.strip().lower()
    banned_keywords = ["movie", "song", "game", "joke", "celebrity", "sports", "weather", "recipe"]

    if any(keyword in user_text for keyword in banned_keywords):
        return ChatResponse(
            response="Sorry, I can only help with consumer protection and chatbot-related tasks.",
            session_id=session_id
        )

    user_message = ChatMessage(session_id=session_id, role="user", content=chat_request.message)
    await db.chat_messages.insert_one(user_message.model_dump())

    history = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1).to_list(50)

    messages = [
        {
            "role": "system",
            "content": """You are an expert AI assistant specialized in consumer protection and rights.
You must:
- Help users understand and apply consumer laws.
- Follow user instructions like "summarize", "make short", "give options", etc.
- Be polite, clear, and accurate.
- Decline to discuss unrelated topics such as movies, entertainment, sports, jokes, or personal opinions.
If a user asks something outside consumer protection or chatbot-related tasks, say:
"Sorry, I can only help with consumer protection or chatbot-related requests."
"""
        }
    ]

    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=1024,
        )
        ai_response = completion.choices[0].message.content
    except Exception as e:
        logging.error(f"Groq API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get AI response")

    ai_message = ChatMessage(session_id=session_id, role="assistant", content=ai_response)
    await db.chat_messages.insert_one(ai_message.model_dump())

    return ChatResponse(response=ai_response, session_id=session_id)


@api_router.get("/chat/history")
async def get_chat_history(session_id: str):
    messages = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    for msg in messages:
        if isinstance(msg['timestamp'], str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    return messages


@api_router.get("/chat/sessions")
async def get_user_sessions(user_id: str):
    """Get all chat sessions for a specific user"""
    sessions = await db.chat_sessions.find(
        {"user_id": user_id}, 
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    
    for session in sessions:
        if isinstance(session.get('created_at'), str):
            session['created_at'] = datetime.fromisoformat(session['created_at'])
        if isinstance(session.get('updated_at'), str):
            session['updated_at'] = datetime.fromisoformat(session['updated_at'])
    
    return sessions


@api_router.get("/")
async def root():
    return {"message": "Consumer Protection Legal Chatbot API"}


# ----------------------------
# Include Routers & Middleware
# ----------------------------
# Include Routers & Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)

# ----------------------------
# WebSocket (✅ AFTER app defined)
# ----------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"You said: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")

# ----------------------------
# Shutdown event
# ----------------------------
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# ----------------------------
# Run Server
# ----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
