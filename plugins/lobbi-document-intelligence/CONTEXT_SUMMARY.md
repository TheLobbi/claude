# lobbi-document-intelligence Context Summary

## Plugin purpose
AI-powered document processing for insurance and financial services. Covers PDF data extraction, intelligent form classification, OCR pipeline design, extracted data validation, document routing automation, and extraction audit trail specifications.

## Skill index
- `skills/pdf-extractor/SKILL.md` — Design AI extraction configs for insurance/mortgage PDFs
- `skills/form-classifier/SKILL.md` — Build document classification models and routing rules
- `skills/ocr-pipeline/SKILL.md` — Design OCR pipeline architecture with pre/post-processing
- `skills/data-validator/SKILL.md` — Extracted data validation rules and exception handling
- `skills/document-router/SKILL.md` — Intelligent document routing based on classification output
- `skills/extraction-auditor/SKILL.md` — Audit trail and quality metrics for extraction pipelines

## Agent index
- `agents/document-architect.md` — Architects end-to-end document intelligence pipelines
- `agents/extraction-engineer.md` — Designs extraction configs and validation rules for specific document types
- `agents/pipeline-optimizer.md` — Analyzes and optimizes OCR pipeline accuracy and throughput

## When-to-load guidance
Load this summary first. Open specific skill files based on the document processing stage being designed.

## When to open deeper docs
| Signal | Open docs | Why |
| --- | --- | --- |
| You need setup or usage details | README.md | Install steps and command/usage reference. |
| You are changing plugin behavior | the relevant commands/, agents/, or skills/ file | Source of truth for behavior. |
| You need the full inventory | commands/, agents/, skills/ directories | Complete list beyond this summary. |
