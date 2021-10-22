import frontmatter
from pydantic import BaseModel
from pathlib import Path
from typing import TypeVar, Generic, Type

T = TypeVar('T', bound=BaseModel)

class Document(Generic[T]):
    """Represents a Markdown file with YAML frontmatter, typed by a Pydantic model."""
    
    def __init__(self, metadata: T, content: str = "", filepath: Path = None):
        self.metadata = metadata
        self.content = content
        self.filepath = filepath

    @classmethod
    def load(cls, filepath: Path, model_cls: Type[T]) -> 'Document[T]':
        with open(filepath, 'r', encoding='utf-8') as f:
            post = frontmatter.load(f)
        metadata = model_cls(**post.metadata)
        return cls(metadata=metadata, content=post.content, filepath=filepath)

    def save(self, filepath: Path = None):
        path = filepath or self.filepath
        if not path:
            raise ValueError("No filepath specified")
        
        meta_dict = self.metadata.model_dump(exclude_unset=True, mode='json')
        post = frontmatter.Post(self.content, **meta_dict)
        
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(frontmatter.dumps(post))
        self.filepath = path
