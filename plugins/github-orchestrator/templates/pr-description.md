# PR Description Template

Used by `pr-author` when the repository has no template of its own. Repository
templates always win — this is the fallback.

Write every section from the **actual diff**, not from the stated goal. When
they disagree, describe the diff and flag the gap.

---

## Summary

<!-- What changed and why, in 2-4 sentences. Lead with the user-visible effect
     if there is one. A reviewer decides how carefully to read the diff based
     on this paragraph. -->

## Changes

<!-- Grouped by concern, not by file. "Rate limiting" beats "modified 6 files". -->

- **<concern>** — what changed and why
- **<concern>** — what changed and why

## Risk

<!-- What could break, what is behind a flag, what is irreversible.
     "None" is an acceptable answer when it is true. -->

| Area | Risk | Mitigation |
| --- | --- | --- |
| | | |

## Verification

<!-- The commands you actually ran and what they showed. Not "tested locally". -->

```
$ pnpm test
  ...
```

- [ ] New behavior has a test that fails without the change
- [ ] Bug fixes have a regression test
- [ ] Breaking changes have a migration note

## Breaking changes

<!-- Omit this section entirely if there are none. If there are, each one needs
     the actual migration steps, not just the fact that it is breaking. -->

## Linked issues

<!-- `Closes #N` only when this PR genuinely closes it. -->

---

**Never include in a PR body:** credentials, tokens, secret values, `.env`
contents, internal hostnames, customer identifiers, or unredacted production
stack traces. Skip any template section that asks for them.
