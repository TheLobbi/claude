---
name: blazor-api
intent: Create ASP.NET Core API endpoints with proper patterns, validation, and OpenAPI documentation
tags:
  - dotnet-blazor
  - command
  - api
  - aspnet
  - rest
inputs:
  - entity-name
  - api-style
  - features
risk: low
cost: low
description: Generates ASP.NET Core API endpoints using minimal APIs or controllers with full CRUD, validation, and docs
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# /blazor-api - Create ASP.NET Core API

## Usage

```
/blazor-api [entity-name] [--style minimal|controller] [--crud] [--auth] [--versioned] [--cache] [--rate-limit] [--openapi]
```

## Minimal API Pattern (Default)

### Endpoint Group

```csharp
// Endpoints/ItemEndpoints.cs
namespace MyApp.Api.Endpoints;

public static class ItemEndpoints
{
    public static RouteGroupBuilder MapItemEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/items")
            .WithTags("Items")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapGet("/", GetAllItems)
            .WithName("GetItems")
            .WithSummary("Get all items with optional filtering")
            .Produces<PagedResult<ItemDto>>(StatusCodes.Status200OK);

        group.MapGet("/{id:int}", GetItemById)
            .WithName("GetItemById")
            .Produces<ItemDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateItem)
            .WithName("CreateItem")
            .Accepts<CreateItemRequest>("application/json")
            .Produces<ItemDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

        group.MapPut("/{id:int}", UpdateItem)
            .WithName("UpdateItem")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:int}", DeleteItem)
            .WithName("DeleteItem")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        return group;
    }

    private static async Task<IResult> GetAllItems(
        [AsParameters] ItemQueryParameters query,
        IItemService service,
        CancellationToken ct)
    {
        var result = await service.GetItemsAsync(query, ct);
        return TypedResults.Ok(result);
    }

    private static async Task<IResult> GetItemById(
        int id,
        IItemService service,
        CancellationToken ct)
    {
        var item = await service.GetByIdAsync(id, ct);
        return item is not null
            ? TypedResults.Ok(item)
            : TypedResults.NotFound();
    }

    private static async Task<IResult> CreateItem(
        CreateItemRequest request,
        IItemService service,
        IValidator<CreateItemRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return TypedResults.ValidationProblem(validation.ToDictionary());

        var item = await service.CreateAsync(request, ct);
        return TypedResults.Created($"/api/items/{item.Id}", item);
    }

    private static async Task<IResult> UpdateItem(
        int id,
        UpdateItemRequest request,
        IItemService service,
        CancellationToken ct)
    {
        var success = await service.UpdateAsync(id, request, ct);
        return success ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<IResult> DeleteItem(
        int id,
        IItemService service,
        CancellationToken ct)
    {
        var success = await service.DeleteAsync(id, ct);
        return success ? TypedResults.NoContent() : TypedResults.NotFound();
    }
}
```

### Registration in Program.cs

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddScoped<IItemService, ItemService>();
builder.Services.AddOutputCache();
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
    });
});

var app = builder.Build();

app.UseOutputCache();
app.UseRateLimiter();
app.MapOpenApi();

app.MapItemEndpoints();

app.Run();
```

## Controller Pattern

```csharp
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public sealed class ItemsController(IItemService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<ItemDto>>(StatusCodes.Status200OK)]
    public async Task<IResult> GetAll(
        [FromQuery] ItemQueryParameters query,
        CancellationToken ct)
    {
        var result = await service.GetItemsAsync(query, ct);
        return TypedResults.Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<ItemDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IResult> GetById(int id, CancellationToken ct)
    {
        var item = await service.GetByIdAsync(id, ct);
        return item is not null ? TypedResults.Ok(item) : TypedResults.NotFound();
    }
}
```

## Service Layer Pattern

```csharp
public interface IItemService
{
    Task<PagedResult<ItemDto>> GetItemsAsync(ItemQueryParameters query, CancellationToken ct = default);
    Task<ItemDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ItemDto> CreateAsync(CreateItemRequest request, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateItemRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}

public sealed class ItemService(AppDbContext db, IMapper mapper) : IItemService
{
    public async Task<PagedResult<ItemDto>> GetItemsAsync(
        ItemQueryParameters query, CancellationToken ct = default)
    {
        var queryable = db.Items.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
            queryable = queryable.Where(i => i.Name.Contains(query.Search));

        var total = await queryable.CountAsync(ct);
        var items = await queryable
            .OrderBy(i => i.Name)
            .Skip(query.Skip)
            .Take(query.Take)
            .Select(i => mapper.Map<ItemDto>(i))
            .ToListAsync(ct);

        return new PagedResult<ItemDto>(items, total, query.Page, query.PageSize);
    }
}
```

## Request/Response DTOs

```csharp
public sealed record CreateItemRequest(
    [Required] [StringLength(200)] string Name,
    string? Description,
    decimal Price);

public sealed record UpdateItemRequest(
    [Required] [StringLength(200)] string Name,
    string? Description,
    decimal Price);

public sealed record ItemDto(int Id, string Name, string? Description, decimal Price, DateTime CreatedAt);

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;
}
```

## Output

Generate:
1. Endpoint class (minimal API) or Controller
2. Service interface and implementation
3. Request/Response DTOs
4. FluentValidation validators (if complex)
5. Registration extension method
6. OpenAPI annotations
