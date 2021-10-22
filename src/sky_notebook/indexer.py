import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional

class Indexer:
    def __init__(self, vault_path: Path):
        self.vault_path = vault_path
        self.db_path = vault_path / ".sky-notebook" / "index.db"
        self._init_db()
        
    def _get_conn(self):
        return sqlite3.connect(self.db_path)
        
    def _init_db(self):
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._get_conn() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    type TEXT,
                    path TEXT,
                    updated_at TEXT,
                    title TEXT,
                    content TEXT
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS facets (
                    doc_id TEXT,
                    key TEXT,
                    value TEXT,
                    FOREIGN KEY(doc_id) REFERENCES documents(id)
                )
            ''')
            # FTS for full-text search
            conn.execute('''
                CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts 
                USING fts5(id UNINDEXED, title, content)
            ''')
            conn.commit()

    def build_index(self, vault):
        """Scans the vault and builds the sqlite index."""
        with self._get_conn() as conn:
            # Clear old index
            conn.execute("DELETE FROM documents")
            conn.execute("DELETE FROM facets")
            conn.execute("DELETE FROM documents_fts")
            
            # Rebuild
            from sky_notebook.schemas import (
                TargetMetadata, ProjectMetadata, SessionMetadata,
                SiteMetadata, RigSnapshotMetadata
            )
            
            schemas = {
                "targets": TargetMetadata,
                "projects": ProjectMetadata,
                "sessions": SessionMetadata,
                "sites": SiteMetadata,
                "rigs": RigSnapshotMetadata
            }
            
            for dir_name, model_cls in schemas.items():
                docs = vault.list_documents(dir_name, model_cls)
                for doc in docs:
                    self._index_doc(conn, doc)
            conn.commit()
            
    def _index_doc(self, conn, doc):
        meta = doc.metadata
        title = getattr(meta, "name", meta.id)
        if hasattr(meta, "observing_night"):
            title = f"Session {meta.id} on {meta.observing_night}"
            
        conn.execute(
            "INSERT INTO documents (id, type, path, updated_at, title, content) VALUES (?, ?, ?, ?, ?, ?)",
            (meta.id, meta.type, str(doc.filepath), meta.updated_at, title, doc.content)
        )
        conn.execute(
            "INSERT INTO documents_fts (id, title, content) VALUES (?, ?, ?)",
            (meta.id, title, doc.content)
        )
        
        # Facets
        if hasattr(meta, "targets") and meta.targets:
            for t in meta.targets:
                conn.execute("INSERT INTO facets (doc_id, key, value) VALUES (?, ?, ?)", (meta.id, "target", t))
        if hasattr(meta, "project") and meta.project:
            conn.execute("INSERT INTO facets (doc_id, key, value) VALUES (?, ?, ?)", (meta.id, "project", meta.project))
        
    def search(self, query: str) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute('''
                SELECT d.id, d.type, d.title, snippet(documents_fts, -1, '[', ']', '...', 64) as snippet
                FROM documents_fts fts
                JOIN documents d ON fts.id = d.id
                WHERE documents_fts MATCH ?
                ORDER BY rank
            ''', (query,)).fetchall()
            return [dict(r) for r in rows]
