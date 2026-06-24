# Detection matrices

Full signal-to-config mapping used by the claude-code-setup skill.

## Languages

| Signal | Language | LSP |
|---|---|---|
| `package.json` | Node.js | typescript-language-server if tsconfig.json too |
| `tsconfig.json` | TypeScript | typescript-language-server |
| `pyproject.toml` / `requirements.txt` / `Pipfile` | Python | pyright |
| `go.mod` | Go | gopls |
| `Cargo.toml` | Rust | rust-analyzer |
| `pom.xml` / `build.gradle` | Java | jdtls |
| `*.csproj` | C# | omnisharp |
| `Gemfile` | Ruby | solargraph |
| `composer.json` | PHP | intelephense |
| `Package.swift` | Swift | sourcekit-lsp |
| `mix.exs` | Elixir | elixir-ls |

## Frameworks

| Signal | Framework |
|---|---|
| `next.config.*` | Next.js |
| `nuxt.config.*` | Nuxt |
| `vite.config.*` | Vite |
| `angular.json` | Angular |
| `svelte.config.*` | SvelteKit |
| `remix.config.*` | Remix |
| `astro.config.*` | Astro |
| `nest-cli.json` | NestJS |
| `manage.py` | Django |
| `main.py` + fastapi import | FastAPI |
| `config/routes.rb` | Rails |
| `spring` in pom.xml/build.gradle | Spring Boot |

## Infrastructure

| Signal | Tool |
|---|---|
| `Dockerfile` | Docker |
| `docker-compose*` | Docker Compose |
| `kubernetes/` | Kubernetes |
| `helm/` | Helm |
| `terraform/` | Terraform |
| `pulumi/` | Pulumi |
| `.github/workflows/` | GitHub Actions |
| `.gitlab-ci.yml` | GitLab CI |
| `Jenkinsfile` | Jenkins |
| `.circleci/` | CircleCI |
| `serverless.yml` | Serverless |
| `cdk.json` | AWS CDK |
| `*.bicep` | Azure Bicep |
| `vercel.json` | Vercel |
| `netlify.toml` | Netlify |
| `wrangler.toml` | Cloudflare Workers |
| `fly.toml` | Fly.io |
| `.harness/` | Harness |

## Databases and services

| Signal | Service |
|---|---|
| `prisma/` | Prisma |
| `drizzle.config.*` | Drizzle |
| `knexfile.*` | Knex |
| `.env*DATABASE_URL*postgres` | PostgreSQL |
| `.env*DATABASE_URL*mysql` | MySQL |
| `.env*MONGO*` | MongoDB |
| `.env*REDIS*` | Redis |
| `supabase/` | Supabase |
| `firebase.json` | Firebase |
| `.env*STRIPE*` | Stripe |
| `.env*SENTRY*` | Sentry |
| `.env*SLACK*` | Slack |

## Test frameworks

| Signal | Framework |
|---|---|
| `jest.config*` | Jest |
| `vitest.config*` | Vitest |
| `cypress.config*` | Cypress |
| `playwright.config*` | Playwright |
| `pytest.ini` / `conftest.py` | Pytest |
| `.rspec` | RSpec |
| `phpunit.xml` | PHPUnit |
| `*_test.go` | Go testing |
| `*.test.rs` / `*_test.rs` | Rust testing |

## Package managers

| Signal | PM |
|---|---|
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | Yarn |
| `package-lock.json` | npm |
| `bun.lockb` | Bun |
| `poetry.lock` | Poetry |
| `Pipfile.lock` | Pipenv |
| `uv.lock` | uv |

## Monorepos

| Signal | Tool |
|---|---|
| `turbo.json` | Turborepo |
| `nx.json` | Nx |
| `pnpm-workspace.yaml` | pnpm workspaces |
| `lerna.json` | Lerna |
| `rush.json` | Rush |

## Codebase scale

Rough LOC count via git:
- <10k LOC → minimal config
- 10k–100k → standard config
- 100k+ → split CLAUDE.md, per-directory CLAUDE.md stubs, subagents recommended
- Monorepo → always per-package CLAUDE.md
