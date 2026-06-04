# lobbi-mortgage-domain Context Summary

## Plugin purpose
Mortgage broker and lender automation covering the full loan lifecycle — loan pipeline tracking, TRID disclosure generation, AUS system integration, closing checklists, RESPA/HMDA compliance scanning, and borrower self-service portal design.

## Skill index
- `skills/loan-pipeline/SKILL.md` — Design loan origination pipeline tracking and status workflows
- `skills/disclosure-generator/SKILL.md` — Generate TRID Loan Estimate and Closing Disclosure specs
- `skills/aus-integration/SKILL.md` — AUS (DU/LP/GUS) integration workflow specifications
- `skills/closing-checklist/SKILL.md` — Pre-closing and post-closing checklist automation
- `skills/mortgage-compliance/SKILL.md` — RESPA, TRID, HMDA, QM/ATR compliance checklists
- `skills/borrower-portal/SKILL.md` — Borrower self-service portal design specifications

## Agent index
- `agents/mortgage-architect.md` — Architects loan origination and servicing automation
- `agents/disclosure-specialist.md` — Designs regulatory disclosure workflows and timing requirements
- `agents/mortgage-compliance-advisor.md` — Validates mortgage workflows against federal lending regulations

## When-to-load guidance
Load this summary first. Open specific skill files based on the loan process stage being automated.

## When to open deeper docs
| Signal | Open docs | Why |
| --- | --- | --- |
| You need setup or usage details | README.md | Install steps and command/usage reference. |
| You are changing plugin behavior | the relevant commands/, agents/, or skills/ file | Source of truth for behavior. |
| You need the full inventory | commands/, agents/, skills/ directories | Complete list beyond this summary. |
