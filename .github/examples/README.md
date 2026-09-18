# Optional integration examples

The `jira/` directory preserves historical Jira integration examples. They were
removed from active Actions because this repository has no Jira repository
secrets, its build observer failed on 74 of 78 sampled runs, and its configuration
example was incorrectly installed as an executable workflow (25 failures).

Product validation remains in `.github/workflows/`. No working Jira coverage is
claimed or replaced by a successful no-op. A future integration should have an
owner, configured credentials, named upstream workflows and validation before
activation. The historical shell snippets have not been certified for reuse.
