import typer
import os
import uvicorn
from pathlib import Path
from datetime import datetime
from typing import Optional
from sky_notebook.vault import Vault
from sky_notebook.document import Document
from sky_notebook.schemas import SessionMetadata, TargetMetadata, ProjectMetadata
from sky_notebook.indexer import Indexer

app = typer.Typer(help="Sky Notebook CLI")

def get_vault() -> Vault:
    vault = Vault(Path.cwd())
    if not vault.is_valid():
        typer.echo("Error: Not in a sky-notebook vault. Run 'sky-notebook init' first.")
        raise typer.Exit(code=1)
    return vault

@app.command()
def init():
    """Initialize a new sky-notebook vault in the current directory."""
    vault = Vault(Path.cwd())
    if vault.is_valid():
        typer.echo("Vault already initialized here.")
        return
    vault.init_vault()
    typer.echo(f"Initialized sky-notebook vault at {vault.root_path}")

@app.command()
def new_target(target_id: str, name: str, ra: str = None, dec: str = None):
    """Create a new observing target."""
    vault = get_vault()
    now = datetime.utcnow().isoformat() + "Z"
    meta = TargetMetadata(
        id=target_id,
        created_at=now,
        updated_at=now,
        name=name,
        ra=ra,
        dec=dec
    )
    doc = Document(metadata=meta, content=f"# {name}\n\nNotes about this target...\n")
    vault.save_target(target_id, doc)
    typer.echo(f"Created target '{target_id}'")

@app.command()
def start_session(
    session_id: str, 
    observing_night: str, 
    target: str = None,
    project: str = None
):
    """Start a new observing session."""
    vault = get_vault()
    now = datetime.utcnow().isoformat() + "Z"
    meta = SessionMetadata(
        id=session_id,
        created_at=now,
        updated_at=now,
        observing_night=observing_night,
        start_time=now,
        timezone="UTC",
        project=project,
        targets=[target] if target else []
    )
    doc = Document(metadata=meta, content=f"# Session {session_id}\n\nObservations started...")
    vault.save_session(session_id, doc)
    typer.echo(f"Started session '{session_id}' for night {observing_night}")

@app.command()
def end_session(session_id: str, outcome: str = "successful"):
    """End an active observing session."""
    vault = get_vault()
    doc = vault.load_session(session_id)
    now = datetime.utcnow().isoformat() + "Z"
    doc.metadata.end_time = now
    doc.metadata.outcome = outcome
    doc.metadata.updated_at = now
    vault.save_session(session_id, doc)
    typer.echo(f"Ended session '{session_id}' with outcome: {outcome}")

@app.command()
def note(session_id: str, content: str):
    """Add a quick note to an active session."""
    vault = get_vault()
    try:
        doc = vault.load_session(session_id)
    except FileNotFoundError:
        typer.echo(f"Session {session_id} not found.")
        raise typer.Exit(1)
        
    now = datetime.utcnow().isoformat() + "Z"
    doc.content += f"\n\n> {now} - {content}"
    doc.metadata.updated_at = now
    vault.save_session(session_id, doc)
    typer.echo(f"Added note to session '{session_id}'")

@app.command()
def search(query: str):
    """Search notes across the vault."""
    vault = get_vault()
    idx = Indexer(vault.root_path)
    idx.build_index(vault) # Rebuild just in case for CLI usage
    results = idx.search(query)
    
    if not results:
        typer.echo("No results found.")
        return
        
    for r in results:
        typer.echo(f"[{r['type'].upper()}] {r['title']} ({r['id']})")
        typer.echo(f"  {r['snippet']}")
        typer.echo("-" * 40)

@app.command()
def ui(port: int = 8000):
    """Launch the local web UI."""
    vault = get_vault()
    os.environ["SKY_NOTEBOOK_VAULT"] = str(vault.root_path)
    typer.echo(f"Starting UI on http://localhost:{port}")
    uvicorn.run("sky_notebook.web.app:app", host="127.0.0.1", port=port, reload=True)

@app.command()
def doctor():
    """Check integrity of the vault."""
    vault = get_vault()
    idx = Indexer(vault.root_path)
    idx.build_index(vault)
    typer.echo("Vault indexed successfully. Index is healthy.")
    # More checks to be added here
    typer.echo("Doctor check complete.")

if __name__ == "__main__":
    app()
