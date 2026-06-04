---
name: blazor-microservice
intent: Design and scaffold a .NET microservice with Aspire orchestration, inter-service communication, and resilience
tags:
  - dotnet-blazor
  - command
  - microservices
  - aspire
  - grpc
inputs:
  - service-name
  - communication-pattern
  - features
risk: medium
cost: high
description: Creates a microservice within an Aspire-orchestrated solution with proper service boundaries, messaging, and health checks
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
---

# /blazor-microservice - Create Microservice

## Usage

```
/blazor-microservice [service-name] [--comm rest|grpc|rabbitmq|servicebus] [--db sqlserver|postgres|cosmos|redis] [--aspire] [--saga] [--health-checks] [--circuit-breaker]
```

## Aspire AppHost Orchestration

```csharp
// {SolutionName}.AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);

// Infrastructure
var postgres = builder.AddPostgres("postgres")
    .WithDataVolume()
    .WithPgAdmin();

var redis = builder.AddRedis("redis")
    .WithRedisInsight();

var rabbitmq = builder.AddRabbitMQ("messaging")
    .WithManagementPlugin();

// Databases
var catalogDb = postgres.AddDatabase("catalogdb");
var orderDb = postgres.AddDatabase("orderdb");

// Services
var catalogApi = builder.AddProject<Projects.CatalogApi>("catalog-api")
    .WithReference(catalogDb)
    .WithReference(redis);

var orderApi = builder.AddProject<Projects.OrderApi>("order-api")
    .WithReference(orderDb)
    .WithReference(rabbitmq)
    .WithReference(catalogApi);

var webApp = builder.AddProject<Projects.WebApp>("webapp")
    .WithExternalHttpEndpoints()
    .WithReference(catalogApi)
    .WithReference(orderApi)
    .WithReference(redis);

builder.Build().Run();
```

## Microservice Template

```csharp
// {ServiceName}Api/Program.cs
var builder = WebApplication.CreateBuilder(args);

// Aspire service defaults (resilience, health checks, telemetry)
builder.AddServiceDefaults();

// Database
builder.AddNpgsqlDbContext<CatalogDbContext>("catalogdb");

// Redis caching
builder.AddRedisDistributedCache("redis");

// Messaging
builder.AddRabbitMQClient("messaging");

// Service registration
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddOpenApi();

var app = builder.Build();

app.MapDefaultEndpoints(); // Health checks, alive
app.MapOpenApi();
app.MapCatalogEndpoints();

app.Run();
```

## Inter-Service Communication

### HTTP Client (with resilience)

```csharp
// In consumer service
builder.Services.AddHttpClient<ICatalogApiClient, CatalogApiClient>(client =>
{
    client.BaseAddress = new("https+http://catalog-api");
})
.AddStandardResilienceHandler(); // Aspire resilience pipeline

public sealed class CatalogApiClient(HttpClient http) : ICatalogApiClient
{
    public async Task<ProductDto?> GetProductAsync(int id, CancellationToken ct)
    {
        return await http.GetFromJsonAsync<ProductDto>($"/api/products/{id}", ct);
    }
}
```

### gRPC Communication

```protobuf
// Protos/catalog.proto
syntax = "proto3";
package catalog;

service CatalogService {
  rpc GetProduct (GetProductRequest) returns (ProductResponse);
  rpc SearchProducts (SearchRequest) returns (stream ProductResponse);
}

message GetProductRequest { int32 id = 1; }
message ProductResponse {
  int32 id = 1;
  string name = 2;
  double price = 3;
}
```

```csharp
// gRPC service implementation
public sealed class CatalogGrpcService(ICatalogService catalog) : CatalogService.CatalogServiceBase
{
    public override async Task<ProductResponse> GetProduct(
        GetProductRequest request, ServerCallContext context)
    {
        var product = await catalog.GetByIdAsync(request.Id, context.CancellationToken)
            ?? throw new RpcException(new Status(StatusCode.NotFound, "Product not found"));

        return new ProductResponse
        {
            Id = product.Id,
            Name = product.Name,
            Price = (double)product.Price
        };
    }
}
```

### Message-Based (RabbitMQ via MassTransit)

```csharp
// Shared contract
public sealed record OrderCreatedEvent(int OrderId, int CustomerId, List<OrderItem> Items);

// Publisher
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration.GetConnectionString("messaging"));
        cfg.ConfigureEndpoints(context);
    });
});

// Consumer
public sealed class OrderCreatedConsumer(ICatalogService catalog) : IConsumer<OrderCreatedEvent>
{
    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        foreach (var item in context.Message.Items)
        {
            await catalog.ReserveStockAsync(item.ProductId, item.Quantity);
        }
    }
}
```

## Resilience Patterns

```csharp
// Aspire provides standard resilience by default
// Custom policies via Microsoft.Extensions.Resilience
builder.Services.AddResiliencePipeline("catalog-pipeline", pipeline =>
{
    pipeline
        .AddRetry(new RetryStrategyOptions
        {
            MaxRetryAttempts = 3,
            Delay = TimeSpan.FromMilliseconds(500),
            BackoffType = DelayBackoffType.Exponential
        })
        .AddCircuitBreaker(new CircuitBreakerStrategyOptions
        {
            FailureRatio = 0.5,
            SamplingDuration = TimeSpan.FromSeconds(10),
            MinimumThroughput = 5,
            BreakDuration = TimeSpan.FromSeconds(30)
        })
        .AddTimeout(TimeSpan.FromSeconds(5));
});
```

## Health Checks

```csharp
// Automatically provided by AddServiceDefaults()
// Custom health checks:
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString)
    .AddRedis(redisConnectionString)
    .AddRabbitMQ();
```

## Output

Generate:
1. Service project with Aspire integration
2. AppHost registration
3. Inter-service communication contracts
4. Health checks and resilience configuration
5. Docker support files
6. Integration test project
