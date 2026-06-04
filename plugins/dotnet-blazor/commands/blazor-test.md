---
name: blazor-test
intent: Generate and run tests for Blazor components, APIs, and services using xUnit, bUnit, and integration testing
tags:
  - dotnet-blazor
  - command
  - testing
  - xunit
  - bunit
inputs:
  - target
  - test-type
risk: low
cost: low
description: Creates comprehensive test suites for Blazor components (bUnit), API endpoints (WebApplicationFactory), and services (xUnit)
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# /blazor-test - Generate Tests

## Usage

```
/blazor-test [target-file-or-class] [--type unit|integration|e2e|component] [--coverage] [--watch]
```

## bUnit Component Test

```csharp
using Bunit;
using FluentAssertions;

public sealed class ItemListTests : TestContext
{
    [Fact]
    public void Should_Render_Items_When_Loaded()
    {
        // Arrange
        var items = new List<ItemDto>
        {
            new(1, "Item A", null, 10.00m, DateTime.UtcNow),
            new(2, "Item B", null, 20.00m, DateTime.UtcNow)
        };
        var mockService = Substitute.For<IItemService>();
        mockService.GetItemsAsync(Arg.Any<CancellationToken>()).Returns(items);
        Services.AddSingleton(mockService);

        // Act
        var cut = RenderComponent<ItemList>();

        // Assert
        cut.FindAll("tr").Count.Should().Be(3); // header + 2 items
        cut.Markup.Should().Contain("Item A");
    }

    [Fact]
    public void Should_Show_Loading_Initially()
    {
        var cut = RenderComponent<ItemList>();
        cut.Markup.Should().Contain("Loading...");
    }

    [Fact]
    public void Should_Navigate_On_Item_Click()
    {
        var nav = Services.GetRequiredService<FakeNavigationManager>();
        var cut = RenderComponent<ItemList>(p =>
            p.Add(c => c.Items, new List<ItemDto> { new(1, "Test", null, 10m, DateTime.UtcNow) }));

        cut.Find("tr[data-id='1']").Click();

        nav.Uri.Should().EndWith("/items/1");
    }
}
```

## API Integration Test

```csharp
public sealed class ItemEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.WithWebHostBuilder(builder =>
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<AppDbContext>();
            services.AddDbContext<AppDbContext>(opts =>
                opts.UseInMemoryDatabase("TestDb"));
        });
    }).CreateClient();

    [Fact]
    public async Task Get_Items_Returns_200()
    {
        var response = await _client.GetAsync("/api/items");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = await response.Content.ReadFromJsonAsync<PagedResult<ItemDto>>();
        items.Should().NotBeNull();
    }

    [Fact]
    public async Task Create_Item_Returns_201()
    {
        var request = new CreateItemRequest("New Item", "Description", 29.99m);

        var response = await _client.PostAsJsonAsync("/api/items", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
    }

    [Fact]
    public async Task Get_NonExistent_Item_Returns_404()
    {
        var response = await _client.GetAsync("/api/items/99999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
```

## Service Unit Test

```csharp
public sealed class ItemServiceTests
{
    private readonly AppDbContext _db;
    private readonly ItemService _service;

    public ItemServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
        _service = new ItemService(_db);
    }

    [Fact]
    public async Task CreateAsync_Should_Persist_Item()
    {
        var request = new CreateItemRequest("Test", null, 10m);

        var result = await _service.CreateAsync(request);

        result.Id.Should().BeGreaterThan(0);
        result.Name.Should().Be("Test");
        _db.Items.Should().HaveCount(1);
    }
}
```

## Running Tests

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test project
dotnet test tests/MyApp.Tests.Unit

# Watch mode
dotnet watch test --project tests/MyApp.Tests.Unit
```
