from pydantic import BaseModel, Field

class BaseMetadata(BaseModel):
    id: str = Field(..., description="Unique, stable ID for the entity")
    created_at: str = Field(..., description="ISO 8601 timestamp")
    updated_at: str = Field(..., description="ISO 8601 timestamp")
