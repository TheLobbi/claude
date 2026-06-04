# Changelog

## [2.0.1] - 2026-06-04

### Changed
- Refreshed Claude Code model references to the June 2026 generation: agent frontmatter
  `model: claude-opus-4-6` → `opus` (alias, future-proof) in `blazor-architect` and
  `microservices-designer`; the syncfusion-blazor skill's recommended-models note
  `Claude Sonnet 4.5+` → `Claude Sonnet 4.6+`.

## [2.0.0] - 2026-03-29

### Added
- **DDD/CQRS skill** - Aggregates, value objects, domain events, repository pattern, MediatR, EF Core DDD mapping
- **Worker services skill** - BackgroundService, Channel-based queues, PeriodicTimer, standalone workers
- **Docker containers skill** - Multi-stage Dockerfiles, Docker Compose, YARP API gateway, integration events
- **.NET AI skill** - Microsoft.Extensions.AI, Semantic Kernel, MCP server/client, embeddings, vector search, tokenization
- 60+ Microsoft Learn DDD/CQRS/architecture reference URLs
- 70+ ASP.NET Core and Blazor documentation URLs
- 50+ MicrosoftDocs GitHub repo references
- Syncfusion Blazor MCP (`@syncfusion/blazor-assistant`) integration
- Syncfusion Agentic UI Builder documentation
- Syncfusion Knowledge Base articles (Blazor + ASP.NET Core)

### Enhanced
- **microservices-patterns** - API gateway, data sovereignty, composite UI, async messaging, outbox pattern, security
- **csharp-patterns** - C# 15 features, .NET 10/11 additions, Microsoft.Extensions.AI
- **aspnet-core-apis** - Rate limiting (4 algorithms), DI keyed services, middleware order, Native AOT, Options pattern
- **blazor-components** - Directive ordering, prerendering control, state management, naming rules
- **blazor-forms-validation** - @bind:get/set/after/event/format, child component binding
- **signalr-realtime** - Hub methods reference, JS client, transport fallback
- **grpc-services** - Decision matrix, client/bidi streaming, project setup
- **cloud-native-deploy** - Azure App Service (3 methods), Azure SDK, Key Vault/Blob/Service Bus
- **dotnet-ai** - Verified function calling, MCP server/client, tokenization, package table
- **syncfusion-blazor** - MCP integration, Agentic UI Builder, KB articles

### Verified
- All skill content verified against actual `microsoft_docs_fetch` results (not training data)

## [1.0.0] - 2026-03-29

### Added
- Initial plugin with 8 commands, 6 agents, 15 skills
- Blazor Web App development (Server, WASM, Auto render modes)
- ASP.NET Core minimal APIs and controllers
- C# microservices with .NET Aspire orchestration
- Syncfusion Blazor UI component integration (DataGrid, Charts, Scheduler)
- Entity Framework Core data access patterns
- gRPC and SignalR real-time communication
- Authentication (Identity, Entra ID, JWT)
- Cloud-native deployment (Azure, Docker, K8s)
- Testing (xUnit, bUnit, integration tests)
- Hooks for .cs/.razor file validation
- 100+ documentation reference URLs
