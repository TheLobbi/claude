# CODEOWNERS Template

Written by `ownership-mapper --synthesize` to `CODEOWNERS.proposed`, **never**
directly to `CODEOWNERS`. Ownership is a people decision.

---

## The rule that breaks most CODEOWNERS files

**CODEOWNERS is last-match-wins.** This is the opposite of `.gitignore`.

A broad rule placed *after* a specific one silently overrides it:

```
# WRONG — the catch-all wins for every path, including billing
/src/billing/    @payments-team
*                @platform

# RIGHT — most specific last
*                @platform
/src/billing/    @payments-team
```

Order from general to specific, top to bottom.

---

## Template

```
# Owners of last resort — everything not matched below
*                           @org/platform

# ---- Application layers ----
/src/api/                   @org/api-team
/src/domain/                @org/api-team
/src/data/                  @org/data

# ---- Sensitive surfaces (humanReviewPaths) ----
# Two owners minimum: these paths require a human approval and should never
# depend on one person's availability.
/migrations/                @org/data @org/platform
/src/auth/                  @org/security @org/platform
/src/billing/               @org/payments @org/platform

# ---- CI/CD and infrastructure ----
/.github/workflows/         @org/platform
/infra/                     @org/platform
/Dockerfile                 @org/platform

# ---- Ownership of ownership ----
/CODEOWNERS                 @org/platform
/.github/CODEOWNERS         @org/platform

# ---- Bus-factor-1 paths flagged for a second owner ----
/src/billing/charge.ts      @alice          # bus factor 1 — add a second owner
/src/ingest/pipeline.ts     @bob            # bus factor 1 — add a second owner

# ---- Generated — no meaningful review ----
/src/generated/             @org/platform
```

---

## Rules

- **Every named owner must resolve.** A team or user with no repo access may be
  treated as *no* required reviewer on some configurations — a path that looks
  protected is not. Verify each one.
- **Prefer teams over individuals** for anything but a genuine single-expert
  path. Individuals go on leave; teams do not.
- **Two owners minimum on sensitive paths.** One owner plus a required review
  means one person's absence blocks every change to auth or billing.
- **Annotate bus-factor-1** rather than pretending it is fine. The comment is
  the prompt for the conversation that fixes it.
- **Generated directories** get an owner so the file is complete, but they carry
  no review expectation — fixes go to the generator.
- **CODEOWNERS owns itself.** Without a rule for it, anyone can reassign
  ownership of anything.
