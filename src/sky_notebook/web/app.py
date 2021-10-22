import os
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path

from sky_notebook.vault import Vault
from sky_notebook.indexer import Indexer
from sky_notebook.schemas import SessionMetadata, TargetMetadata

app = FastAPI(title="Sky Notebook")

# Setup paths
web_dir = Path(__file__).parent
templates = Jinja2Templates(directory=str(web_dir / "templates"))
app.mount("/static", StaticFiles(directory=str(web_dir / "static")), name="static")

def get_vault():
    vault_path = Path(os.environ.get("SKY_NOTEBOOK_VAULT", Path.cwd()))
    return Vault(vault_path)

def get_indexer(vault):
    idx = Indexer(vault.root_path)
    # We might not want to rebuild on every request in prod, but fine for local demo
    idx.build_index(vault)
    return idx

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    vault = get_vault()
    sessions = vault.list_documents("sessions", SessionMetadata)
    sessions.sort(key=lambda s: s.metadata.start_time, reverse=True)
    return templates.TemplateResponse("index.html", {"request": request, "sessions": sessions})

@app.get("/targets", response_class=HTMLResponse)
async def list_targets(request: Request):
    vault = get_vault()
    targets = vault.list_documents("targets", TargetMetadata)
    return templates.TemplateResponse("targets.html", {"request": request, "targets": targets})

@app.get("/session/{session_id}", response_class=HTMLResponse)
async def view_session(request: Request, session_id: str):
    vault = get_vault()
    try:
        session = vault.load_session(session_id)
    except FileNotFoundError:
        return HTMLResponse("Session not found", status_code=404)
    return templates.TemplateResponse("session.html", {"request": request, "session": session})

@app.get("/search", response_class=HTMLResponse)
async def search(request: Request, q: str = ""):
    vault = get_vault()
    idx = get_indexer(vault)
    results = idx.search(q) if q else []
    return templates.TemplateResponse("search.html", {"request": request, "q": q, "results": results})
