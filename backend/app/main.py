from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api import (
    attributes,
    campaign_members,
    campaigns,
    communications,
    contacts,
    events,
    rules,
)
from backend.app.database import engine
from backend.app.models import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="Campaign Rules Engine", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contacts.router)
app.include_router(campaigns.router)
app.include_router(campaign_members.router)
app.include_router(attributes.router)
app.include_router(rules.router)
app.include_router(communications.router)
app.include_router(events.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
