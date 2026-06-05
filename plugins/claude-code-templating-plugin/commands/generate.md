---
name: generate
intent: Generate code, models, and tests from schemas and specifications - API clients, data models, test suites, database migrations
tags:
  - generate
  - code
  - models
  - tests
  - migrations
inputs: []
risk: medium
cost: medium
description: Generate code, models, and tests from schemas and specifications - API clients, data models, test suites, database migrations
model: sonnet
---

# Code Generation Command

Generate boilerplate code, models, and tests from specifications and schemas.

## Overview

The `/generate` command provides intelligent code generation for common patterns: API clients from OpenAPI specs, models from JSON schemas, test suites from code, and database migrations from models.

---

## Subcommands

### 1. `/generate api-client <spec_file>`

Generate API client from OpenAPI specification.

**Syntax:**
```bash
/generate api-client <openapi_spec> [options]
```

**Options:**
```
--language <lang>      Target language (typescript, python, go, java, csharp)
--output <dir>         Output directory
--package <name>       Package/module name
--style <style>        Code style (axios, fetch, httpx, requests, http.client)
--auth <type>          Auth handling (bearer, basic, oauth2, apikey)
--validate             Validate generated code
--overwrite            Overwrite existing files
--dry-run              Preview without generating
```

**Example 1: TypeScript API Client**

```bash
/generate api-client ./specs/petstore-api.yaml \
  --language typescript \
  --output ./src/api/generated \
  --package petstore-client \
  --style axios
```

Output:
```
Generating API Client: petstore-api
Source: ./specs/petstore-api.yaml
Language: TypeScript
Style: axios
Package: petstore-client

Analysis:
  ✓ Parsed OpenAPI 3.0.0 specification
  ✓ Found 5 endpoints
  ✓ Found 8 models
  ✓ Authentication: Bearer token

Generated Files (12):

api/
├── index.ts
├── client.ts                    # Main client class
├── endpoints/
│   ├── pets.ts                 # Pets endpoint
│   └── users.ts                # Users endpoint
├── models/
│   ├── Pet.ts
│   ├── User.ts
│   ├── CreatePetRequest.ts
│   └── Error.ts
├── types/
│   └── index.ts                # Type definitions
├── interceptors/
│   ├── auth.ts                 # Bearer token handling
│   └── errorHandler.ts
├── config.ts
└── constants.ts

Code Statistics:
  Lines of code: 1,247
  Type definitions: 12
  Methods: 24
  Comments: 156 lines

Next Steps:
  1. Install dependencies: npm install axios
  2. Import client: import { PetstoreClient } from './api'
  3. Create instance: const client = new PetstoreClient(config)
  4. Use in code: const pets = await client.pets.list()
```

**Example 2: Python API Client**

```bash
/generate api-client ./specs/github-api.yaml \
  --language python \
  --output ./github_client \
  --package github-api \
  --style httpx \
  --auth oauth2
```

**Example 3: Go API Client**

```bash
/generate api-client ./specs/slack-api.yaml \
  --language go \
  --output ./slack \
  --package slack \
  --validate
```

---

### 2. `/generate models <schema_file>`

Generate data models from JSON schema.

**Syntax:**
```bash
/generate models <schema_file> [options]
```

**Options:**
```
--language <lang>      Target language (typescript, python, java, go, rust)
--format <format>      Schema format (json-schema, graphql, protobuf)
--output <dir>         Output directory
--with-validation      Include validation rules
--with-serialization   Include serialize/deserialize methods
--dry-run              Preview without generating
```

**Example 1: TypeScript Models from JSON Schema**

```bash
/generate models ./schemas/order.schema.json \
  --language typescript \
  --output ./src/models \
  --with-validation \
  --with-serialization
```

Schema file:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Order",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "items": {
      "type": "array",
      "items": { "$ref": "#/definitions/OrderItem" }
    },
    "total": {
      "type": "number",
      "minimum": 0
    },
    "status": {
      "type": "string",
      "enum": ["pending", "confirmed", "shipped", "delivered"]
    }
  },
  "required": ["id", "items", "total", "status"],
  "definitions": {
    "OrderItem": {
      "type": "object",
      "properties": {
        "productId": { "type": "string" },
        "quantity": { "type": "integer", "minimum": 1 },
        "price": { "type": "number", "minimum": 0 }
      },
      "required": ["productId", "quantity", "price"]
    }
  }
}
```

Output:
```
Generating Models from JSON Schema
Schema: ./schemas/order.schema.json
Language: TypeScript
Output: ./src/models

Analysis:
  ✓ Parsed JSON Schema draft-07
  ✓ Found 2 types: Order, OrderItem
  ✓ Generated validation rules
  ✓ Generated serialization methods

Generated Files (4):

models/
├── index.ts
├── Order.ts                     # Main Order model
├── OrderItem.ts                 # Nested OrderItem model
└── types.ts                     # Type definitions

Order Model Features:
  ✓ Type-safe properties
  ✓ Constructor validation
  ✓ Validation methods
  ✓ Serialization (toJSON)
  ✓ Deserialization (fromJSON)
  ✓ Type guards (isOrder, isOrderItem)

Code Preview:

export interface OrderData {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
}

export class Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;

  constructor(data: OrderData) {
    this.validate(data);
    this.id = data.id;
    this.items = data.items;
    this.total = data.total;
    this.status = data.status;
  }

  validate(data: OrderData): void {
    if (!data.id || typeof data.id !== 'string') {
      throw new Error('Order: id must be a non-empty string');
    }
    if (!Array.isArray(data.items)) {
      throw new Error('Order: items must be an array');
    }
    if (data.total < 0) {
      throw new Error('Order: total must be >= 0');
    }
    // ... more validations
  }

  toJSON(): OrderData {
    return {
      id: this.id,
      items: this.items.map(item => item.toJSON()),
      total: this.total,
      status: this.status
    };
  }

  static fromJSON(data: OrderData): Order {
    return new Order(data);
  }
}
```

**Example 2: Python Models**

```bash
/generate models ./schemas/user.schema.json \
  --language python \
  --output ./models \
  --with-validation
```

---

### 3. `/generate tests <code_path>`

Generate test suite from existing code.

**Syntax:**
```bash
/generate tests <code_path> [options]
```

**Options:**
```
--language <lang>      Target language (typescript, python, java, go)
--framework <framework> Test framework (jest, pytest, mocha, vitest)
--output <dir>         Output directory
--coverage <target>    Target coverage % (default: 80)
--unit                 Generate unit tests only
--integration          Generate integration tests
--e2e                  Generate end-to-end tests
--mock-dependencies    Auto-generate mocks
```

**Example 1: Jest Unit Tests for TypeScript**

```bash
/generate tests ./src/services/OrderService.ts \
  --language typescript \
  --framework jest \
  --output ./tests \
  --coverage 80 \
  --mock-dependencies
```

Output:
```
Generating Test Suite for OrderService.ts
Framework: Jest
Output: ./tests

Analysis:
  ✓ Analyzed OrderService.ts
  ✓ Found 5 public methods
  ✓ Found 3 dependencies (logger, db, cache)
  ✓ Identified edge cases

Generated Test File (352 lines):

tests/
└── services/
    └── OrderService.test.ts

Test Coverage:

describe('OrderService', () => {
  let service: OrderService;
  let mockLogger: jest.Mocked<Logger>;
  let mockDb: jest.Mocked<Database>;
  let mockCache: jest.Mocked<Cache>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockDb = createMockDatabase();
    mockCache = createMockCache();
    service = new OrderService(mockLogger, mockDb, mockCache);
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const input = { items: [...], total: 100 };
      const result = await service.createOrder(input);
      expect(result).toBeDefined();
      expect(mockDb.create).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle validation errors', async () => {
      const invalid = { items: [], total: -1 };
      await expect(service.createOrder(invalid)).rejects.toThrow();
    });

    it('should cache result', async () => {
      const input = { items: [...], total: 100 };
      const result = await service.createOrder(input);
      expect(mockCache.set).toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('should return cached order if available', async () => {
      mockCache.get.mockResolvedValue({ id: 'order-1' });
      const result = await service.getOrder('order-1');
      expect(result).toEqual({ id: 'order-1' });
      expect(mockDb.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      mockCache.get.mockResolvedValue(null);
      mockDb.findOne.mockResolvedValue({ id: 'order-1' });
      const result = await service.getOrder('order-1');
      expect(result).toEqual({ id: 'order-1' });
      expect(mockDb.findOne).toHaveBeenCalledWith('order-1');
    });

    it('should throw for non-existent order', async () => {
      mockCache.get.mockResolvedValue(null);
      mockDb.findOne.mockResolvedValue(null);
      await expect(service.getOrder('invalid')).rejects.toThrow('Not found');
    });
  });
});

Test Statistics:
  Total test cases: 14
  Target coverage: 80%
  Estimated actual: 85%
  Dependencies mocked: 3

Next Steps:
  1. Run tests: npm test
  2. Check coverage: npm test -- --coverage
  3. Adjust test cases as needed
```

**Example 2: Pytest for Python**

```bash
/generate tests ./app/services.py \
  --language python \
  --framework pytest \
  --output ./tests \
  --coverage 85
```

---

### 4. `/generate migrations <model_path>`

Generate database migrations from data models.

**Syntax:**
```bash
/generate migrations <model_path> [options]
```

**Options:**
```
--database <db>        Database type (postgres, mysql, sqlite, mongodb)
--framework <framework> Migration framework (alembic, migrate, sequelize, knex)
--output <dir>         Output directory
--initial              Create initial migration from scratch
--from-existing        Create from existing database
--timestamp            Add timestamp to migration names
--dry-run              Preview without generating
```

**Example 1: PostgreSQL Alembic Migrations**

```bash
/generate migrations ./models/User.ts ./models/Order.ts \
  --database postgres \
  --framework alembic \
  --output ./migrations \
  --initial
```

Output:
```
Generating Database Migrations
Database: PostgreSQL
Framework: Alembic
Models: User, Order

Analysis:
  ✓ Analyzed User model (8 fields)
  ✓ Analyzed Order model (6 fields)
  ✓ Detected relationships (Order → User)
  ✓ Identified constraints and indexes

Generated Migration File:

migrations/
└── versions/
    └── 001_initial_schema.py

Migration Code:

"""Initial schema creation"""
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, onupdate=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # Create orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id')),
        sa.Column('total', sa.Numeric(10, 2), nullable=False),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('ix_orders_user_id', 'orders', ['user_id'])
    op.create_index('ix_orders_status', 'orders', ['status'])

def downgrade() -> None:
    op.drop_table('orders')
    op.drop_table('users')

Migration Statistics:
  Tables to create: 2
  Indexes to create: 3
  Foreign keys: 1
  Estimated execution time: < 1 second

Next Steps:
  1. Review migration: cat migrations/versions/001_initial_schema.py
  2. Run migration: alembic upgrade head
  3. Verify schema: psql -d mydb -c "\\dt"
```

**Example 2: MongoDB Migrations**

```bash
/generate migrations ./models/*.ts \
  --database mongodb \
  --framework migrate-mongo \
  --output ./migrations
```

---

## Common Workflows

### Workflow 1: Generate Complete API with Tests

```bash
# 1. Generate API client from spec
/generate api-client ./specs/myapi.yaml \
  --language typescript \
  --output ./src/api

# 2. Generate models from schema
/generate models ./schemas/data.schema.json \
  --language typescript \
  --output ./src/models \
  --with-validation

# 3. Generate tests
/generate tests ./src/api/client.ts \
  --framework jest \
  --output ./tests
```

### Workflow 2: Database Setup

```bash
# 1. Generate models
/generate models ./models/User.ts ./models/Post.ts

# 2. Generate migrations
/generate migrations ./models/*.ts \
  --database postgres \
  --framework alembic \
  --initial

# 3. Generate models (Python for backend)
/generate models ./schemas/database.json \
  --language python \
  --output ./app/models
```

### Workflow 3: Full Code Scaffold

```bash
# 1. Scaffold project
/scaffold nodejs-app my-api

# 2. Add OpenAPI spec
cp my-spec.yaml my-api/specs/

# 3. Generate API client
/generate api-client my-api/specs/my-spec.yaml \
  --language typescript \
  --output my-api/src/api

# 4. Generate models
/generate models my-api/schemas/models.json \
  --language typescript \
  --output my-api/src/models

# 5. Generate tests
/generate tests my-api/src \
  --framework jest
```

---

## Best Practices

1. **Always review generated code:** Don't use as-is in production
2. **Version your specifications:** Track OpenAPI and schema versions
3. **Keep specs updated:** Regenerate when specs change
4. **Test generation:** Verify generated code works with existing code
5. **Custom modifications:** Add project-specific logic after generation
6. **Validation rules:** Use `--with-validation` for input validation
7. **Documentation:** Generated code includes comments and types

---

## Integration with Other Commands

```bash
# After scaffolding
/scaffold nodejs-app my-app
/generate api-client ./specs/api.yaml --output my-app/src/api
/generate tests my-app/src --framework jest

# From template
/template generate fastapi-api my-api
/generate models ./schemas/models.json --language python
```

---

## Error Reference

| Error | Solution |
|-------|----------|
| Invalid OpenAPI spec | Validate with `/template validate` |
| Schema not found | Check file path and format |
| Language not supported | Check supported languages for type |
| Framework not available | Install framework dependency |
| Code generation failed | Check model definitions are complete |

---

## See Also

- **`/template`** - Template discovery and management
- **`/scaffold`** - Project scaffolding
- **`/harness`** - Harness integration for CI/CD

---

**⚓ Golden Armada** | *You ask - The Fleet Ships*
