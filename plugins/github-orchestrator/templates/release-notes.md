# Release Notes Template

Used by `changelog-scribe`. Release notes are read once, in a hurry, by someone
deciding whether to upgrade. Lead with what changed for them — not a commit list.

---

## Highlights

<!-- 2-4 sentences. Why does this release matter? If the answer is "it doesn't,
     it's maintenance", say that in one line and move on. -->

## Breaking changes

<!-- Before everything else, because it is what stops an upgrade.
     Omit the section entirely when there are none. -->

### `<what changed>`

<!-- What the old behavior was and what it is now. -->

**Migration:** <!-- The actual steps. Not "update your code" — the specific
change a consumer makes, and any temporary escape hatch. -->

## Added

- <!-- User-facing capability, written as an effect -->

## Fixed

- <!-- The symptom a user experienced, and that it no longer happens.
       "Fixed a 500 error when requesting a user id that does not exist;
       the API now returns 404." -->

## Security

<!-- Always with the advisory identifier and the affected versions. A security
     fix buried under "Fixed" is a fix nobody applies urgently. -->

- <!-- GHSA-xxxx: what was vulnerable, which versions, what to do -->

## Deprecated

- <!-- What is deprecated, what replaces it, when it will be removed -->

---

**Full changelog:** https://github.com/<owner>/<repo>/compare/<prev>...<this>

---

## Rules

- **Omit internal refactors** with no observable effect. A release note padded
  with `chore:` entries trains readers to skip it.
- **Translate commits to effects.** `perf(ingest): batch writes` becomes
  "Ingest throughput increased roughly 4×; batches now flush every 200ms
  instead of per event."
- **Every breaking change carries migration steps.** A breaking change without
  them is an incident scheduled for whenever someone upgrades.
- **Never include** credentials, internal hostnames, or customer identifiers.
- **Credit contributors** by GitHub handle. Never guess at anyone's pronouns.
