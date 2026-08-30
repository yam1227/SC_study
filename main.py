import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from routers.auth import router as auth_router
from routers.crypto import router as crypto_router
from routers.network import router as network_router
from routers.web_security import router as web_security_router
from routers.system import router as system_router

app = FastAPI(
    title="Security & Specialist Exam Training API (SC_study)",
    description="情報処理安全確保支援士試験 対策インタラクティブラボ バックエンドAPI",
    version="2.0.0"
)

# Enable CORS for local testing/cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Sub-Routers
app.include_router(system_router)
app.include_router(auth_router)
app.include_router(crypto_router)
app.include_router(network_router)
app.include_router(web_security_router)

# Mount static assets
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    # Use user-specified port (10000+)
    uvicorn.run("main:app", host="127.0.0.1", port=18000, reload=True)
