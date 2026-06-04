---
name: blazor-scaffold
intent: Scaffold CRUD pages, forms, and data grids from Entity Framework Core models
tags:
  - dotnet-blazor
  - command
  - scaffold
  - crud
  - entity-framework
inputs:
  - entity-name
  - scaffold-type
risk: low
cost: medium
description: Generates complete CRUD UI (list, create, edit, detail, delete) from EF Core entity definitions with Syncfusion or standard components
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# /blazor-scaffold - Scaffold CRUD from Models

## Usage

```
/blazor-scaffold [entity-name] [--ui syncfusion|standard] [--features search,sort,filter,export,inline-edit] [--auth] [--api]
```

## Workflow

1. Read the EF Core entity/model class
2. Generate DTOs (Create, Update, Response)
3. Generate service interface and implementation
4. Generate API endpoints (if --api)
5. Generate Blazor pages: List, Create/Edit, Detail, Delete confirmation
6. Generate FluentValidation validators
7. Wire up DI registration

## Generated Files

```
Components/Pages/{Entity}/
├── List.razor           # DataGrid with search, sort, filter, pagination
├── Create.razor         # Create form with validation
├── Edit.razor           # Edit form with validation
├── Detail.razor         # Read-only detail view
└── _Imports.razor       # Scoped imports

Services/
├── I{Entity}Service.cs  # Interface
└── {Entity}Service.cs   # Implementation

Models/
├── {Entity}Dto.cs              # Response DTO
├── Create{Entity}Request.cs    # Create request
├── Update{Entity}Request.cs    # Update request
└── {Entity}QueryParameters.cs  # Query/filter params

Validators/
├── Create{Entity}Validator.cs
└── Update{Entity}Validator.cs
```

## Syncfusion Grid Example

```razor
@page "/products"
@rendermode InteractiveServer
@inject IProductService ProductService

<SfGrid @ref="_grid" DataSource="@_products" AllowPaging="true" AllowSorting="true"
        AllowFiltering="true" AllowExcelExport="true" Toolbar="@_toolbar">
    <GridEditSettings AllowAdding="true" AllowEditing="true" AllowDeleting="true"
                      Mode="EditMode.Dialog" />
    <GridEvents OnActionComplete="OnActionComplete" TValue="ProductDto" />
    <GridColumns>
        <GridColumn Field="@nameof(ProductDto.Id)" IsPrimaryKey="true" Width="80" />
        <GridColumn Field="@nameof(ProductDto.Name)" Width="200" />
        <GridColumn Field="@nameof(ProductDto.Price)" Format="C2" Width="120" />
        <GridColumn Field="@nameof(ProductDto.Category)" Width="150">
            <FilterTemplate>
                <SfDropDownList DataSource="@_categories" TItem="string" TValue="string" />
            </FilterTemplate>
        </GridColumn>
        <GridColumn HeaderText="Actions" Width="150">
            <Template>
                @{
                    var item = (context as ProductDto)!;
                    <a href="/products/@item.Id" class="btn btn-sm btn-info">View</a>
                    <a href="/products/@item.Id/edit" class="btn btn-sm btn-warning">Edit</a>
                }
            </Template>
        </GridColumn>
    </GridColumns>
</SfGrid>
```

## Output

Generates a complete CRUD feature set ready to use, with proper render modes, validation, and navigation.
