---
name: blazor-component
intent: Generate Blazor components with correct render modes, lifecycle methods, and best-practice patterns
tags:
  - dotnet-blazor
  - command
  - blazor
  - component
inputs:
  - component-name
  - component-type
  - render-mode
risk: low
cost: low
description: Creates Blazor components following .NET 10 patterns with proper render mode, parameters, and event handling
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# /blazor-component - Generate Blazor Component

## Usage

```
/blazor-component [name] [--type page|layout|form|list|detail|modal|shared] [--render-mode server|wasm|auto|ssr] [--parameters "Name:string,Items:List<T>"] [--service ServiceName] [--syncfusion] [--test]
```

## Component Types and Patterns

### Page Component
```razor
@page "/items"
@page "/items/{Id:int}"
@rendermode InteractiveServer
@attribute [StreamRendering]
@attribute [Authorize]
@inject IItemService ItemService
@inject NavigationManager Navigation

<PageTitle>Items</PageTitle>

<h1>Items</h1>

@if (_items is null)
{
    <p><em>Loading...</em></p>
}
else
{
    @* Render items *@
}

@code {
    [Parameter] public int? Id { get; set; }
    [SupplyParameterFromQuery] public string? Search { get; set; }

    private List<ItemDto>? _items;

    protected override async Task OnInitializedAsync()
    {
        _items = await ItemService.GetItemsAsync(Search);
    }
}
```

### Form Component
```razor
@rendermode InteractiveServer

<EditForm Model="@_model" OnValidSubmit="HandleSubmit" FormName="item-form">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <div class="mb-3">
        <label for="name" class="form-label">Name</label>
        <InputText id="name" @bind-Value="_model.Name" class="form-control" />
        <ValidationMessage For="@(() => _model.Name)" />
    </div>

    <button type="submit" class="btn btn-primary" disabled="@_isSubmitting">
        @(_isSubmitting ? "Saving..." : "Save")
    </button>
</EditForm>

@code {
    [Parameter] public EventCallback<ItemDto> OnSaved { get; set; }

    private ItemFormModel _model = new();
    private bool _isSubmitting;

    private async Task HandleSubmit()
    {
        _isSubmitting = true;
        try
        {
            await OnSaved.InvokeAsync(_model.ToDto());
        }
        finally
        {
            _isSubmitting = false;
        }
    }
}
```

### Data Grid Component (Syncfusion)
```razor
@rendermode InteractiveServer
@using Syncfusion.Blazor.Grids

<SfGrid DataSource="@Items" AllowPaging="true" AllowSorting="true" AllowFiltering="true"
        Toolbar="@(new List<string> { "Add", "Edit", "Delete", "Search" })">
    <GridEditSettings AllowAdding="true" AllowEditing="true" AllowDeleting="true" Mode="EditMode.Dialog" />
    <GridPageSettings PageSize="20" />
    <GridColumns>
        <GridColumn Field="@nameof(ItemDto.Id)" HeaderText="ID" Width="80" IsPrimaryKey="true" />
        <GridColumn Field="@nameof(ItemDto.Name)" HeaderText="Name" Width="200" />
        <GridColumn Field="@nameof(ItemDto.Status)" HeaderText="Status" Width="120">
            <Template>
                @{
                    var item = (context as ItemDto)!;
                    <span class="badge bg-@GetStatusColor(item.Status)">@item.Status</span>
                }
            </Template>
        </GridColumn>
    </GridColumns>
</SfGrid>
```

### Modal/Dialog Component
```razor
@rendermode InteractiveServer

@if (IsVisible)
{
    <div class="modal show d-block" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">@Title</h5>
                    <button type="button" class="btn-close" @onclick="Close" />
                </div>
                <div class="modal-body">
                    @ChildContent
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @onclick="Close">Cancel</button>
                    <button class="btn btn-primary" @onclick="Confirm">Confirm</button>
                </div>
            </div>
        </div>
    </div>
    <div class="modal-backdrop show"></div>
}

@code {
    [Parameter] public string Title { get; set; } = "Dialog";
    [Parameter] public RenderFragment? ChildContent { get; set; }
    [Parameter] public bool IsVisible { get; set; }
    [Parameter] public EventCallback<bool> IsVisibleChanged { get; set; }
    [Parameter] public EventCallback OnConfirmed { get; set; }

    private async Task Close() => await IsVisibleChanged.InvokeAsync(false);
    private async Task Confirm()
    {
        await OnConfirmed.InvokeAsync();
        await Close();
    }
}
```

## Render Mode Decision Tree

```
Is this component interactive (handles events, has state)?
├── No → Static SSR (no @rendermode, use @attribute [StreamRendering] for async)
└── Yes
    ├── Does it need real-time server connection (SignalR, DB access)?
    │   └── Yes → @rendermode InteractiveServer
    ├── Should it work offline or reduce server load?
    │   └── Yes → @rendermode InteractiveWebAssembly
    └── Want best of both (fast start + offline)?
        └── @rendermode InteractiveAuto
```

## Component Lifecycle

| Method | When | Use for |
|--------|------|---------|
| `SetParametersAsync` | Parameters set | Custom parameter handling |
| `OnInitialized[Async]` | First render only | Initial data loading |
| `OnParametersSet[Async]` | Each parameter change | React to parameter changes |
| `OnAfterRender[Async]` | After DOM update | JS interop, focus management |
| `Dispose/DisposeAsync` | Component removed | Cleanup subscriptions, timers |

## Naming conventions

- Pages: `{Feature}/{Action}.razor` (e.g., `Items/List.razor`, `Items/Edit.razor`)
- Shared components: `Shared/{ComponentName}.razor`
- Layout: `Layout/{LayoutName}.razor`
- Code-behind: `{Component}.razor.cs` (partial class, same name)

## Output

Generate:
1. `.razor` file with proper render mode and structure
2. `.razor.cs` code-behind if complex logic
3. `.razor.css` if component-scoped styles needed
4. bUnit test file if `--test` flag
