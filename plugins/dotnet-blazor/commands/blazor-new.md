---
name: blazor-new
intent: Scaffold a new .NET 10 Blazor Web App, API project, or microservice solution with best-practice structure
tags:
  - dotnet-blazor
  - command
  - scaffold
  - blazor
  - aspnet
inputs:
  - project-type
  - project-name
  - render-mode
  - features
risk: low
cost: medium
description: Creates a new .NET 10 solution with proper project structure, NuGet packages, and configuration
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
---

# /blazor-new - Create New .NET Solution

## Usage

```
/blazor-new [project-type] [project-name] [--render-mode server|wasm|auto] [--auth identity|entra|jwt|none] [--db sqlserver|postgres|sqlite|cosmos] [--ui syncfusion|fluentui|mudblazor|none] [--aspire] [--docker] [--tests]
```

## Project Types

| Type | Description | Template |
|------|------------|---------|
| `webapp` (default) | Blazor Web App with SSR + interactivity | `blazor` |
| `api` | ASP.NET Core Web API (minimal APIs) | `webapi` |
| `fullstack` | Blazor Web App + separate API project | `blazor` + `webapi` |
| `microservice` | Aspire-orchestrated multi-service solution | `aspire-starter` |
| `grpc` | gRPC service | `grpc` |

## Workflow

### Phase 1: Solution Creation

```bash
# Create solution
dotnet new sln -n {ProjectName}

# For webapp
dotnet new blazor -n {ProjectName}.Web --interactivity {RenderMode} --auth {AuthType} -f net10.0

# For fullstack (adds API project)
dotnet new webapi -n {ProjectName}.Api --use-minimal-apis -f net10.0

# For microservice (Aspire)
dotnet new aspire-starter -n {ProjectName} -f net10.0

# Shared class library
dotnet new classlib -n {ProjectName}.Shared -f net10.0

# Add projects to solution
dotnet sln add {ProjectName}.Web/{ProjectName}.Web.csproj
```

### Phase 2: Project Structure

```
{ProjectName}/
├── {ProjectName}.sln
├── Directory.Build.props          # Shared MSBuild properties
├── Directory.Packages.props       # Central package management
├── .editorconfig                  # Code style rules
├── global.json                    # SDK version pinning
├── {ProjectName}.Web/
│   ├── Program.cs                 # App host and DI setup
│   ├── Components/
│   │   ├── App.razor              # Root component
│   │   ├── Routes.razor           # Router
│   │   ├── Layout/
│   │   │   ├── MainLayout.razor
│   │   │   └── NavMenu.razor
│   │   └── Pages/
│   │       ├── Home.razor
│   │       └── Error.razor
│   ├── Services/                  # Business logic services
│   ├── Models/                    # View models and DTOs
│   └── wwwroot/                   # Static assets
├── {ProjectName}.Api/             # (fullstack/microservice)
│   ├── Program.cs
│   ├── Endpoints/                 # Minimal API endpoint groups
│   ├── Services/
│   └── Middleware/
├── {ProjectName}.Shared/
│   ├── Models/                    # Shared domain models
│   ├── DTOs/                      # Data transfer objects
│   └── Contracts/                 # Service interfaces
├── {ProjectName}.Data/            # (if --db specified)
│   ├── AppDbContext.cs
│   ├── Entities/
│   ├── Configurations/            # EF Core fluent config
│   └── Migrations/
├── {ProjectName}.Tests/           # (if --tests specified)
│   ├── Unit/
│   ├── Integration/
│   └── E2E/
└── {ProjectName}.AppHost/         # (if --aspire specified)
    └── Program.cs                 # Aspire orchestration
```

### Phase 3: Essential Configuration

**Program.cs (Blazor Web App)**:
```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()    // For Server mode
    .AddInteractiveWebAssemblyComponents(); // For WASM mode

// Add Syncfusion (if --ui syncfusion)
builder.Services.AddSyncfusionBlazor();

// Add EF Core (if --db specified)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// Add authentication (if --auth specified)
builder.Services.AddAuthentication().AddMicrosoftIdentityWebApp(builder.Configuration);

var app = builder.Build();

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode();

app.Run();
```

**Directory.Build.props**:
```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
</Project>
```

**global.json**:
```json
{
  "sdk": {
    "version": "10.0.100",
    "rollForward": "latestFeature"
  }
}
```

### Phase 4: NuGet Packages

Install based on flags:

| Flag | Packages |
|------|----------|
| `--ui syncfusion` | `Syncfusion.Blazor.Themes`, `Syncfusion.Blazor.Core`, relevant component packages |
| `--ui fluentui` | `Microsoft.FluentUI.AspNetCore.Components` |
| `--ui mudblazor` | `MudBlazor` |
| `--db sqlserver` | `Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.EntityFrameworkCore.Tools` |
| `--db postgres` | `Npgsql.EntityFrameworkCore.PostgreSQL` |
| `--auth identity` | `Microsoft.AspNetCore.Identity.EntityFrameworkCore` |
| `--auth entra` | `Microsoft.Identity.Web`, `Microsoft.Identity.Web.UI` |
| `--aspire` | `Aspire.Hosting`, `Aspire.Dashboard` |
| `--tests` | `xunit`, `bunit`, `Microsoft.AspNetCore.Mvc.Testing`, `FluentAssertions` |
| `--docker` | Generate `Dockerfile` and `docker-compose.yml` |

### Phase 5: Validation

```bash
dotnet restore
dotnet build --no-restore
# If tests: dotnet test --no-build
```

## Output

Provide:
1. Solution structure tree
2. Key file contents (Program.cs, App.razor)
3. Next steps for the user
4. Relevant documentation links
