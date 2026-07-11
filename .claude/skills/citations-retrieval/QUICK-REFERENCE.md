# Citations & Retrieval - Quick Reference Guide

Fast lookup for common patterns and code snippets.

---

## Quick Start: Enable Citations in 5 Minutes

```python
import anthropic

client = anthropic.Anthropic(api_key="sk-...")

# 1. Load document
with open("article.txt") as f:
    document_text = f.read()

# 2. Create document with citations
document = {
    "type": "document",
    "source": {
        "type": "text",
        "media_type": "text/plain",
        "data": document_text
    },
    "title": "My Article",
    "citations": {"enabled": True}
}

# 3. Query with citations
response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": [document]},
        {"role": "user", "content": [{"type": "text", "text": "Your question"}]}
    ]
)

# 4. Extract citations
for content in response.content:
    if hasattr(content, "citations"):
        for citation in content.citations:
            print(f'"{citation.cited_text}" - {citation.document_title}')
```

---

## Document Type Cheat Sheet

### Plain Text
```python
{
    "type": "document",
    "source": {
        "type": "text",
        "media_type": "text/plain",
        "data": "Your text content here"
    },
    "title": "Document Title",
    "citations": {"enabled": True}
}
```

### PDF (Base64)
```python
import base64

with open("document.pdf", "rb") as f:
    pdf_data = base64.b64encode(f.read()).decode()

{
    "type": "document",
    "source": {
        "type": "base64",
        "media_type": "application/pdf",
        "data": pdf_data
    },
    "title": "PDF Title",
    "citations": {"enabled": True}
}
```

### Custom Chunks
```python
{
    "type": "document",
    "source": {
        "type": "content",
        "content": [
            {"type": "text", "text": "Chunk 1..."},
            {"type": "text", "text": "Chunk 2..."}
        ]
    },
    "title": "Custom Document",
    "citations": {"enabled": True}
}
```

### With Context (Non-Cited)
```python
{
    "type": "document",
    "source": {...},
    "title": "Document",
    "context": "This article is from 2024",
    "citations": {"enabled": True}
}
```

---

## Citation Types at a Glance

| Type | When | Access Fields |
|------|------|----------------|
| `char_location` | Plain text | `cited_text`, `start_char_index`, `end_char_index` |
| `page_location` | PDF | `cited_text`, `start_page_number`, `end_page_number` |
| `content_block_location` | Custom chunks | `cited_text` |

---

## Extract & Format Citations

### Get All Citations
```python
citations = []
for content in response.content:
    if hasattr(content, "citations") and content.citations:
        citations.extend(content.citations)

return citations
```

### Format as Numbered List
```python
def format_citations(response):
    output = response.content[0].text
    citations = []

    for content in response.content:
        if hasattr(content, "citations"):
            for i, c in enumerate(content.citations, 1):
                citations.append(f"[{i}] {c.cited_text} ({c.document_title})")

    if citations:
        output += "\n\nSources:\n" + "\n".join(citations)

    return output
```

### Format APA
```python
def apa_format(citation):
    return f'"{citation.cited_text}" found in {citation.document_title}.'
```

### Format Chicago
```python
def chicago_format(citation, number):
    return f'{number}. {citation.document_title}: "{citation.cited_text}"'
```

---

## Common Patterns

### Multi-Document Query
```python
documents = [
    document_1,
    document_2,
    document_3
]

response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": documents},
        {"role": "user", "content": [{"type": "text", "text": "Your question"}]}
    ]
)
```

### Combined with System Prompt
```python
response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    system="You are a helpful assistant. Use citations to back up claims.",
    messages=[
        {"role": "user", "content": [document]},
        {"role": "user", "content": [{"type": "text", "text": "Question"}]}
    ]
)
```

### Conditional Citations
```python
# Only cite if supported by document
response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    system="Only answer if supported by provided documents. Otherwise, say 'Not found in documents.'",
    messages=[
        {"role": "user", "content": [document]},
        {"role": "user", "content": [{"type": "text", "text": "Question"}]}
    ]
)
```

---

## RAG Pipeline Snippets

### Simple Document Retrieval
```python
def retrieve_documents(query, document_list, top_k=3):
    """Simple keyword-based retrieval."""
    query_terms = set(query.lower().split())
    scored = []

    for doc in document_list:
        text = doc["source"]["data"].lower()
        score = sum(1 for term in query_terms if term in text)
        if score > 0:
            scored.append((doc, score))

    return [doc for doc, _ in sorted(scored, key=lambda x: x[1], reverse=True)[:top_k]]
```

### Chunk & Retrieve
```python
import re

def chunk_document(text, chunk_size=512):
    """Split text into chunks."""
    sentences = re.split(r'[.!?]+', text)
    chunks = []
    current = ""

    for sentence in sentences:
        if len((current + sentence).split()) > chunk_size:
            if current:
                chunks.append(current.strip())
            current = sentence
        else:
            current += " " + sentence

    if current:
        chunks.append(current.strip())

    return chunks

# Use chunks in custom document
chunks = chunk_document(document_text)
doc = {
    "type": "document",
    "source": {
        "type": "content",
        "content": [{"type": "text", "text": c} for c in chunks]
    },
    "title": "Chunked Document",
    "citations": {"enabled": True}
}
```

### Add Context to Query
```python
def augment_query(query, retrieved_docs):
    """Add retrieved documents to query."""
    augmented = f"""
Based on the following documents, answer: {query}

Use citations to back up your answer.
"""
    return augmented
```

---

## Error Handling

### Check Model Support
```python
MODELS_WITH_CITATIONS = ["claude-fable-5", "claude-opus-4-8", "claude-sonnet-5", "claude-haiku-4-5"]

if model not in MODELS_WITH_CITATIONS:
    print(f"Warning: {model} may not support citations")
```

### Validate PDF is Searchable
```python
import fitz  # PyMuPDF

def is_pdf_searchable(pdf_path):
    """Check if PDF contains extractable text."""
    doc = fitz.open(pdf_path)
    text = doc.get_text()
    doc.close()
    return len(text.strip()) > 0
```

### Handle Missing Citations
```python
def extract_citations_safe(response):
    """Safely extract citations, handle missing gracefully."""
    citations = []

    for content in response.content:
        if hasattr(content, "citations") and content.citations:
            citations.extend(content.citations)

    return citations or []
```

---

## Performance Tips

### Prompt Caching (Save Costs)
```python
# Cache the document, reuse for multiple queries
response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {...},
                    "citations": {"enabled": True}
                }
            ],
            "cache_control": {"type": "ephemeral"}
        }
    ]
)
```

### Batch Queries on Same Document
```python
# Load document once, query multiple times
document = create_document("article.txt")

queries = ["Question 1?", "Question 2?", "Question 3?"]

for query in queries:
    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=512,
        messages=[
            {"role": "user", "content": [document]},
            {"role": "user", "content": [{"type": "text", "text": query}]}
        ]
    )
```

### Limit Document Size
```python
# Use only relevant excerpts
excerpt = extract_relevant_section(document_text, query)
document["source"]["data"] = excerpt
```

---

## Citation Format Comparison

| Format | Style | Code |
|--------|-------|------|
| **APA** | `(Author, Year)` | `apa_formatter()` |
| **MLA** | `(Author Page)` | `mla_formatter()` |
| **Chicago** | `Footnote [1]` | `chicago_formatter()` |
| **IEEE** | `[1]` | `ieee_formatter()` |

### Quick Converters

```python
def to_apa(citation):
    return f'"{citation.cited_text}". {citation.document_title}.'

def to_mla(citation):
    return f'{citation.document_title}. "{citation.cited_text}".'

def to_chicago(citation, num):
    return f'{num}. {citation.document_title}: "{citation.cited_text}"'

def to_ieee(citation, num):
    return f'[{num}] "{citation.cited_text}," {citation.document_title}.'
```

---

## Troubleshooting Checklist

- [ ] Using `claude-sonnet-5` or supported model?
- [ ] Documents have `"citations": {"enabled": True}`?
- [ ] Document content is actually in the message?
- [ ] Checking `response.content[].citations`?
- [ ] PDF is searchable (not a scan)?
- [ ] Not using Structured Outputs with citations?
- [ ] Document title is set?
- [ ] Using supported media types (text/plain, application/pdf)?

---

## Limits & Constraints

| Limit | Value | Note |
|-------|-------|------|
| Max document size | 10 MB | Per document |
| Max documents per message | Unlimited | But affects token count |
| Citation granularity | Sentence | Minimum unit |
| Model support | Current models (Sonnet 5, Haiku 4.5, Opus 4.8, Fable 5) | |
| Compatibility | Not with Structured Outputs | Cannot use both |

---

## Model Selection

```python
# Best for citations
model = "claude-sonnet-5"  # Full citations support

# Fast, low-cost alternative
model = "claude-haiku-4-5"  # Supported, fast

# Note: legacy claude-3-5-* models are retired and return 404
```

---

## Integration Examples

### With FastAPI
```python
from fastapi import FastAPI
import anthropic

app = FastAPI()
client = anthropic.Anthropic()

@app.post("/ask")
async def ask_document(file_path: str, question: str):
    document = enable_citations_on_document(file_path)
    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": [document]},
            {"role": "user", "content": [{"type": "text", "text": question}]}
        ]
    )
    return extract_citations(response)
```

### With LangChain
```python
from langchain.chat_models import ChatAnthropic
from langchain.schema import HumanMessage

chat = ChatAnthropic(model_name="claude-sonnet-5")

message = HumanMessage(
    content=[
        {
            "type": "document",
            "source": {...},
            "citations": {"enabled": True}
        },
        {"type": "text", "text": "Your question"}
    ]
)

response = chat([message])
```

---

## Helpful Links

- [Citations API Docs](https://platform.claude.com/docs/en/build-with-claude/citations)
- [Cookbook Example](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/using_citations.ipynb)
- [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [RAG Guide](https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects)

