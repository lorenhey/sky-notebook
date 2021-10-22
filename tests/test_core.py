import pytest
from pathlib import Path
from datetime import datetime, timezone
from sky_notebook.vault import Vault
from sky_notebook.schemas import SessionMetadata, TargetMetadata
from sky_notebook.document import Document
from sky_notebook.indexer import Indexer

def test_vault_init(tmp_path):
    vault = Vault(tmp_path)
    vault.init_vault()
    assert vault.is_valid()
    assert (tmp_path / "targets").exists()
    assert (tmp_path / "sessions").exists()

def test_schema_target():
    meta = TargetMetadata(
        id="m42",
        created_at="2026-09-11T00:00:00Z",
        updated_at="2026-09-11T00:00:00Z",
        name="Orion Nebula",
        aliases=["NGC 1976"],
        ra="05h35m17.3s",
        dec="-05d23m28s"
    )
    assert meta.type == "target"
    assert "NGC 1976" in meta.aliases

def test_save_and_load_session(tmp_path):
    vault = Vault(tmp_path)
    vault.init_vault()
    
    meta = SessionMetadata(
        id="s1",
        created_at="2026-09-11T00:00:00Z",
        updated_at="2026-09-11T00:00:00Z",
        observing_night="2026-09-11",
        start_time="2026-09-11T23:00:00Z",
        end_time="2026-09-12T04:00:00Z", # Night crossing test
        timezone="UTC-03:00",
        targets=["m42"]
    )
    doc = Document(metadata=meta, content="# Hello")
    vault.save_session("s1", doc)
    
    loaded = vault.load_session("s1")
    assert loaded.metadata.observing_night == "2026-09-11"
    assert loaded.metadata.end_time == "2026-09-12T04:00:00Z"
    assert loaded.content == "# Hello"

def test_indexer_search(tmp_path):
    vault = Vault(tmp_path)
    vault.init_vault()
    meta = TargetMetadata(
        id="m42",
        created_at="2026-09-11T00:00:00Z",
        updated_at="2026-09-11T00:00:00Z",
        name="Orion Nebula",
    )
    doc = Document(metadata=meta, content="A beautiful stellar nursery.")
    vault.save_target("m42", doc)
    
    idx = Indexer(tmp_path)
    idx.build_index(vault)
    
    results = idx.search("nursery")
    assert len(results) == 1
    assert results[0]['id'] == 'm42'
    assert results[0]['type'] == 'target'

def test_invalid_session_schema():
    with pytest.raises(ValueError):
        SessionMetadata(
            id="s1",
            # missing required fields
        )
