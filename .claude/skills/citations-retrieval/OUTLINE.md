# Citations & Retrieval Skill - Implementation Outline

## Executive Summary

The "citations-retrieval" skill provides comprehensive capabilities for implementing Anthropic's Citations API and Retrieval-Augmented Generation (RAG) patterns. It enables agents to ground responses in source documents with precise citations, improve accuracy through contextual retrieval, and build trustworthy AI systems.

---

## I. Document-Based Citations (Foundation)

### A. What Are Citations?
- Precise source attribution for model-generated responses
- Automatic chunking and location tracking
- Three citation types: text, PDF, custom content
- Zero output token cost for cited text

### B. Citation Types
```
1. Plain Text Citations (char_location)
   - Auto-chunked at sentence boundaries
   - Character index tracking
   - Best for articles, help docs, knowledge bases

2. PDF Citations (page_location)
   - Page number tracking
   - Multi-page range support
   - Requires searchable PDFs (no scans)

3. Custom Content Citations (content_block_location)
   - Full chunking control
   - Useful for structured data
   - No automatic chunking
```

### C. Response Structure
```python
{
  "text": "Response text with citations",
  "citations": [
    {
      "type": "char_location" | "page_location" | "content_block_location",
      "cited_text": "Exact source text",
      "document_title": "Source document",
      "start_page_number": 1,  # For PDFs only
      "end_page_number": 2
    }
  ]
}
```

---

## II. Retrieval-Augmented Generation (RAG)

### A. RAG Pipeline Overview
```
Query Input
    ↓
Document Chunking & Embedding
    ↓
Vector Database Indexing
    ↓
Semantic Similarity Search (Retrieve)
    ↓
Chunk Ranking & Selection
    ↓
Query Augmentation with Context
    ↓
LLM Generation with Citations
    ↓
Grounded Response + Sources
```

### B. Key Components

**1. Document Preprocessing**
- Chunk documents into semantic units (sentences, paragraphs)
- Preserve context around chunks (10-20% overlap)
- Extract and store metadata (section, date, author)
- Clean and normalize text

**2. Embedding & Indexing**
- Convert chunks to vector embeddings
- Store in vector database (e.g., pgvector, Pinecone, Weaviate)
- Create BM25 indexes for keyword matching
- Enable hybrid search (semantic + keyword)

**3. Retrieval**
- Execute semantic similarity search
- Apply keyword filtering (BM25)
- Implement contextual retrieval (preserve context)
- Use reranking to improve relevance
- Return top-k most relevant chunks

**4. Augmentation**
- Combine query with retrieved chunks
- Provide context to the model
- Include document metadata
- Format for clarity

**5. Generation**
- Generate response with provided context
- Enable citations on context documents
- Model grounds claims in provided sources
- Return structured response + citations

**6. Source Verification**
- Validate citations match sources exactly
- Verify chunk boundaries
- Check no hallucinated sources
- Display attribution clearly

### C. Performance Metrics

**Retrieval Quality:**
- Baseline: 49% reduction in retrieval failures with Contextual Embeddings
- With reranking: 67% reduction in failures
- Goal: >90% retrieval accuracy for relevant documents

**Citation Quality:**
- Guaranteed valid citations (no hallucinated sources)
- Higher precision than prompt-based approaches
- Lower hallucination rate

---

## III. Source Attribution & Grounding

### A. Grounding Principles
```
1. Trustworthiness: Connect responses to verifiable sources
2. Transparency: Show relationship between claims and sources
3. Auditability: Provide source links and metadata
4. Accessibility: Make sources clickable and searchable
5. Completeness: Include all relevant source information
```

### B. Grounding Metadata Structure
```python
{
  "response_text": "...",
  "grounding_metadata": {
    "support_indices": [0, 1, 2],  # Which source chunks support which text
    "grounding_chunks": [
      {
        "source_title": "Article Title",
        "chunk_index": 0,
        "text": "Source chunk text",
        "url": "https://...",
        "metadata": {"section": "...", "page": 1}
      }
    ]
  }
}
```

### C. Best Practices
- Display sources with response (footnotes, sidebars, etc.)
- Make sources clickable for verification
- Show confidence levels (certain vs. partial match)
- Highlight which parts of response are cited
- Provide search suggestions for related topics
- Include freshness indicators (date updated)

---

## IV. Citation Formatting Standards

### A. Major Formats (Quick Reference)

| Format | In-Text | Reference | Use Case |
|--------|---------|-----------|----------|
| **APA** | (Author, Year) | Full citation in References | Psychology, Education, Sciences |
| **MLA** | (Author Page) | Full citation in Works Cited | Humanities, Literature |
| **Chicago** | Footnote [1] | Numbered bibliography | History, Business, Fine Arts |
| **IEEE** | [1] | Numbered reference list | Engineering, CS, IT |

### B. Implementation Strategy
```
1. Extract citation data from response
2. Normalize formats (author, title, source, date)
3. Select target format (user-configurable)
4. Generate formatted bibliography
5. Insert in-text citations
```

### C. Example: APA Format
```
In-text: According to Smith (2024), citations improve...

Reference:
Smith, J., Johnson, M., & Lee, R. (2024). Title of article.
  Journal Name, 15(3), 234-245.
  https://doi.org/10.xxxx/xxxxx
```

---

## V. Implementation Patterns

### A. Pattern 1: Basic Citations
**Goal:** Enable citations on individual documents
**Complexity:** Low
**Key Functions:**
- Load document (text or PDF)
- Enable citations
- Query with document
- Extract citations

### B. Pattern 2: Custom Chunking
**Goal:** Fine-grained control over citation granularity
**Complexity:** Medium
**Key Decisions:**
- Chunk size (512-2048 tokens)
- Chunk boundaries (semantic)
- Metadata preservation
- Overlap strategy

### C. Pattern 3: Citation Visualization
**Goal:** Format citations for user consumption
**Complexity:** Medium
**Output Formats:**
- Numbered references [1], [2], [3]
- Sidebar with sources
- Footnotes/endnotes
- Bibliography

### D. Pattern 4: RAG Pipeline
**Goal:** Build end-to-end retrieval-augmented system
**Complexity:** High
**Components:**
- Document ingestion
- Chunking & embedding
- Vector indexing
- Retrieval
- Augmentation
- Generation

### E. Pattern 5: Contextual Retrieval
**Goal:** Improve RAG retrieval accuracy
**Complexity:** High
**Techniques:**
- Preserve context during embedding
- Hybrid search (semantic + keyword)
- Reranking after retrieval
- Multi-stage filtering

---

## VI. Key Limitations & Constraints

### A. Citations API Limitations
| Limitation | Impact | Workaround |
|-----------|--------|-----------|
| Incompatible with Structured Outputs | Cannot use both features | Choose citations OR JSON schema |
| PDF scanning not supported | Scanned PDFs can't be cited | Use OCR or text extraction first |
| Model support limited | Only Sonnet 4.5, Haiku 3 | Use other models with prompt-based |
| Minimum granularity | Won't cite < 1 sentence | Use custom chunking for more control |

### B. RAG Challenges
| Challenge | Root Cause | Solution |
|-----------|-----------|----------|
| Retrieval misses relevant docs | Poor embedding quality | Use contextual embeddings + reranking |
| Token explosion | Too many chunks | Limit retrieved chunks, rerank |
| Hallucination | Model generates unsupported claims | Use Citations API + grounding |
| Context degradation | Too much noise in prompt | Implement relevance filtering |

---

## VII. Use Case Patterns

### A. Customer Support Bot
```
Flow: User Question
      ↓
   Retrieve from Help Articles
      ↓
   Ground Response in Docs
      ↓
   Format with Citations
      ↓
   Display with Source Links
```
**Key Features:**
- Consistent answer from official sources
- Builds customer trust
- Easy to verify information
- Reduces support burden

### B. Research Assistant
```
Flow: Research Question
      ↓
   Search Academic Database
      ↓
   Extract Relevant Passages
      ↓
   Synthesize with Citations
      ↓
   Generate Bibliography
      ↓
   Output with Full Citations
```
**Key Features:**
- Academic citation formats
- Multi-source synthesis
- Automatic bibliography
- Verifiable sources

### C. Document Q&A System
```
Flow: Question About Document
      ↓
   Retrieve Relevant Sections
      ↓
   Extract & Cite
      ↓
   Provide Page References
      ↓
   Highlight in PDF
```
**Key Features:**
- Exact page numbers
- Section references
- Searchable content
- PDF highlighting

### D. Knowledge Base Search
```
Flow: Search Query
      ↓
   Semantic Search
      ↓
   Contextual Retrieval
      ↓
   Rerank Results
      ↓
   Display with Context
```
**Key Features:**
- Semantic understanding
- Context preservation
- Relevance ranking
- Source grouping

---

## VIII. Integration Points

### A. Claude Projects RAG Mode
- Automatic document chunking
- Semantic search integration
- Up to 10x knowledge expansion
- Transparent to API (auto-handled)

### B. Files API Integration
- Upload documents via Files API
- Reference by file_id in messages
- No need for base64 encoding
- Persistent document storage

### C. Prompt Caching
- Cache source documents separately
- Citation blocks not cached
- Reduced latency for frequent queries
- Cost savings on document tokens

### D. Related Skills
- **vector-db**: Embedding generation & storage
- **database**: Chunk storage & indexing
- **confluence**: Document source (Confluence pages)
- **deep-analysis**: Complex document analysis
- **llm-integration**: Multi-model orchestration

---

## IX. Implementation Roadmap

### Phase 1: Basic Citations (Week 1-2)
- [ ] Implement basic citations with test documents
- [ ] Extract and format citations
- [ ] Display numbered references
- [ ] Test with plain text and PDF

### Phase 2: Citation Formatting (Week 3)
- [ ] Implement APA formatter
- [ ] Add MLA support
- [ ] Add Chicago support
- [ ] Add IEEE support

### Phase 3: Simple RAG (Week 4-5)
- [ ] Build document ingestion pipeline
- [ ] Implement keyword-based retrieval
- [ ] Add contextual augmentation
- [ ] Integrate with citations

### Phase 4: Advanced RAG (Week 6-8)
- [ ] Integrate vector database
- [ ] Implement semantic search
- [ ] Add reranking
- [ ] Optimize performance

### Phase 5: Production Hardening (Week 9-10)
- [ ] Error handling & edge cases
- [ ] Performance optimization
- [ ] Security & validation
- [ ] Documentation & testing

---

## X. Troubleshooting Guide

### Issue: Citations not appearing
**Diagnosis:**
- Citations enabled on documents?
- Documents provided in messages?
- Using supported model (Sonnet 4.5)?
- Content actually from documents?

**Solutions:**
```python
# Check citations enabled
doc["citations"] = {"enabled": True}

# Verify documents in message
messages = [{"role": "user", "content": documents}]

# Use supported model
model="claude-sonnet-5"
```

### Issue: Wrong or hallucinated citations
**Diagnosis:**
- Document chunking incorrect?
- Duplicate content?
- Model hallucinating?

**Solutions:**
- Verify chunks at sentence boundaries
- Remove duplicates from documents
- Use Citations API (guarantees valid citations)

### Issue: RAG retrieval misses relevant content
**Diagnosis:**
- Query too different from documents?
- Chunks too small/large?
- Embeddings low quality?

**Solutions:**
- Use contextual embeddings
- Adjust chunk size (512-2048 tokens)
- Add reranking
- Implement hybrid search

---

## XI. Key Takeaways

1. **Citations API** provides precise, hallucination-free source attribution
2. **RAG patterns** extend knowledge beyond context window limits
3. **Contextual retrieval** dramatically improves retrieval accuracy (49-67%)
4. **Grounding** builds trust through transparent sourcing
5. **Multiple citation formats** support diverse use cases
6. **Hybrid approach** (semantic + keyword) works best
7. **Document chunking** is critical for quality
8. **Reranking** improves retrieval precision
9. **Metadata preservation** enables rich attribution
10. **Integration with Claude** is seamless via API

---

## XII. Further Learning

### Official Resources
- [Anthropic Citations API Documentation](https://platform.claude.com/docs/en/build-with-claude/citations)
- [Anthropic Cookbook - Citations Example](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/using_citations.ipynb)
- [Contextual Retrieval Announcement](https://www.anthropic.com/news/contextual-retrieval)

### Related Topics
- Vector Databases: Pinecone, Weaviate, pgvector
- Embedding Models: OpenAI, Cohere, Voyage AI
- Reranking: Cross-encoders, LLM-based
- Citation Managers: Zotero, Mendeley, BiblioConnect

### Best Practices
- RAG Evaluation: NDCG, MRR, MAP metrics
- Citation Quality: Precision, Recall, F1
- User Trust: Transparency, Auditability, Verification

