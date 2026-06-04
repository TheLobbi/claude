---
name: blazor-deploy
intent: Deploy .NET Blazor apps to Azure, Docker, or Kubernetes with proper configuration
tags:
  - dotnet-blazor
  - command
  - deploy
  - azure
  - docker
  - kubernetes
inputs:
  - target
  - environment
risk: high
cost: medium
description: Generates deployment configuration and scripts for Azure App Service, Container Apps, Docker, or Kubernetes
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
---

# /blazor-deploy - Deploy .NET Application

## Usage

```
/blazor-deploy [--target azure-appservice|azure-container-apps|docker|k8s] [--env dev|staging|prod] [--aspire] [--ci github-actions|azure-devops] [--tls] [--monitoring]
```

## Azure Container Apps (with Aspire)

```csharp
// AppHost - Azure provisioning
var builder = DistributedApplication.CreateBuilder(args);

var insights = builder.AddAzureApplicationInsights("appinsights");
var storage = builder.AddAzureStorage("storage");
var postgres = builder.AddAzurePostgresFlexibleServer("postgres")
    .AddDatabase("appdb");

var api = builder.AddProject<Projects.Api>("api")
    .WithReference(postgres)
    .WithReference(insights)
    .WithExternalHttpEndpoints();

builder.Build().Run();
```

```bash
# Deploy with Aspire + azd
azd init
azd provision
azd deploy
```

## Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props ./
COPY **/*.csproj ./
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MyApp.Web.dll"]
```

## GitHub Actions CI/CD

```yaml
name: Deploy .NET App

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET 10
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'

      - name: Restore
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore -c Release

      - name: Test
        run: dotnet test --no-build -c Release --logger trx

      - name: Publish
        run: dotnet publish -c Release -o ./publish

      - name: Deploy to Azure
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ vars.AZURE_APP_NAME }}
          package: ./publish
```

## Output

Generate deployment configs, CI/CD pipeline, and environment-specific settings.
