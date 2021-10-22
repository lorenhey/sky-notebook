from typing import List, Optional
from pydantic import Field
from sky_notebook.schemas.base import BaseMetadata

class ProjectMetadata(BaseMetadata):
    type: str = Field("project", frozen=True)
    name: str = Field(...)
    objective: Optional[str] = Field(None, description="Main objective of the project")
    targets: List[str] = Field(default_factory=list, description="IDs of targets involved")
    status: str = Field("active", description="active, completed, or abandoned")
