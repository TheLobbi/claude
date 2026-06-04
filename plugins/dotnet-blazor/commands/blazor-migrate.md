---
name: blazor-migrate
intent: Migrate .NET applications from older versions or other frameworks to .NET 10 Blazor
tags:
  - dotnet-blazor
  - command
  - migration
  - upgrade
inputs:
  - source-framework
  - target
risk: high
cost: high
description: Guides and executes migration from .NET 6/7/8/9 to .NET 10, or from MVC/Razor Pages/Web Forms to Blazor
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
---

# /blazor-migrate - Migration Assistant

## Usage

```
/blazor-migrate [--from net6|net7|net8|net9|mvc|razor-pages|webforms|angular|react] [--to net10|blazor] [--analyze-only] [--incremental]
```

## Migration Paths

| From | To | Complexity | Strategy |
|------|----|-----------|----------|
| .NET 8/9 | .NET 10 | Low | TFM update + API changes |
| .NET 6/7 | .NET 10 | Medium | Incremental upgrade through versions |
| ASP.NET MVC | Blazor | High | Component-by-component migration |
| Razor Pages | Blazor | Medium | Page-to-component conversion |
| Web Forms | Blazor | Very High | Full rewrite recommended |
| Angular/React SPA | Blazor WASM | High | Component mapping + API reuse |

## .NET Version Upgrade Workflow

### Phase 1: Analysis
```bash
# Check current SDK and target framework
dotnet --list-sdks
grep -r "TargetFramework" **/*.csproj

# Check for deprecated APIs
dotnet tool install -g upgrade-assistant
upgrade-assistant analyze ./MySolution.sln
```

### Phase 2: Update TFM
```xml
<!-- Before -->
<TargetFramework>net9.0</TargetFramework>
<!-- After -->
<TargetFramework>net10.0</TargetFramework>
```

### Phase 3: Update NuGet packages
```bash
dotnet outdated
dotnet restore
```

### Phase 4: Address breaking changes
- Review Microsoft's breaking changes doc for target version
- Update deprecated API calls
- Test thoroughly

## MVC to Blazor Migration

1. **Keep API controllers** - They work alongside Blazor
2. **Convert Views to Components** - Each .cshtml view becomes a .razor component
3. **Replace ViewModels with Parameters** - Component parameters replace ViewBag/ViewData
4. **Convert jQuery to C#** - JS interop only when necessary
5. **Migrate authentication** - ASP.NET Core Identity works with both

### View to Component Mapping
```
MVC                          → Blazor
@model ViewModel             → @code { [Parameter] public ViewModel Model }
@Html.ActionLink()           → <NavLink href="/path">
@Html.PartialAsync()         → <ChildComponent />
@section Scripts {}          → IJSRuntime injection
ViewBag/ViewData             → [CascadingParameter] or service injection
_Layout.cshtml               → MainLayout.razor
```

## Output

1. Migration analysis report (breaking changes, effort estimate)
2. Updated project files
3. Converted components/pages
4. Updated NuGet references
5. Test verification results
