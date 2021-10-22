import os
from pathlib import Path
from typing import List, Optional, Type, TypeVar
from sky_notebook.document import Document
from sky_notebook.schemas import (
    TargetMetadata, ProjectMetadata, SessionMetadata,
    SiteMetadata, RigSnapshotMetadata
)

T = TypeVar('T')

class Vault:
    """Manages the sky-notebook directory structure."""
    
    DIRS = ["targets", "projects", "sessions", "sites", "rigs", "attachments", ".sky-notebook"]
    
    def __init__(self, root_path: Path):
        self.root_path = root_path.resolve()
        
    def init_vault(self):
        """Initializes the vault directories."""
        for d in self.DIRS:
            (self.root_path / d).mkdir(parents=True, exist_ok=True)
            
    def is_valid(self) -> bool:
        """Checks if the directory is a valid vault."""
        return (self.root_path / ".sky-notebook").exists()
        
    def _get_path(self, dir_name: str, file_id: str) -> Path:
        if not file_id.endswith(".md"):
            file_id += ".md"
        return self.root_path / dir_name / file_id
        
    def save_document(self, doc: Document, dir_name: str, file_id: str):
        path = self._get_path(dir_name, file_id)
        doc.save(path)
        
    def load_document(self, dir_name: str, file_id: str, model_cls: Type[T]) -> Document[T]:
        path = self._get_path(dir_name, file_id)
        if not path.exists():
            raise FileNotFoundError(f"Document not found: {path}")
        return Document.load(path, model_cls)
        
    def list_documents(self, dir_name: str, model_cls: Type[T]) -> List[Document[T]]:
        dir_path = self.root_path / dir_name
        if not dir_path.exists():
            return []
        
        docs = []
        for file in dir_path.glob("*.md"):
            try:
                docs.append(Document.load(file, model_cls))
            except Exception as e:
                print(f"Error loading {file}: {e}")
        return docs

    # Specific helpers
    def save_session(self, session_id: str, doc: Document[SessionMetadata]):
        self.save_document(doc, "sessions", session_id)
        
    def load_session(self, session_id: str) -> Document[SessionMetadata]:
        return self.load_document("sessions", session_id, SessionMetadata)
        
    def save_target(self, target_id: str, doc: Document[TargetMetadata]):
        self.save_document(doc, "targets", target_id)
        
    def save_project(self, project_id: str, doc: Document[ProjectMetadata]):
        self.save_document(doc, "projects", project_id)
