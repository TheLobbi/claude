---
name: code-review
description: This skill should be used when the user asks to "review code", "check changes", "analyze a PR", "do a security review", or "assess code quality" — providing comprehensive review across correctness, security, performance, accessibility, and testing.
trigger_phrases: [review code, check changes, analyze PR, code quality, security review]
categories: [review, quality, security, performance, accessibility, testing]
version: 1.0.0
last_updated: 2025-12-17
---

# Code Review Skill

Systematic code review patterns covering security, performance, accessibility, quality, and testing across languages and frameworks.

## Security Review

**Critical Checks:**
- Authentication tokens validated; authorization on sensitive ops
- Session management secure (httpOnly, secure, sameSite)
- No hardcoded credentials/API keys
- Proper RBAC implementation
- JWT tokens with proper algorithms (not 'none')
- Password hashing: bcrypt/argon2 (not MD5/SHA1)

**Input Validation:**
- User inputs sanitized
- SQL injection prevention (parameterized queries)
- XSS prevention (escaping/sanitization)
- CSRF tokens on state-changing ops
- File upload validation (type, size, content)
- JSON/XML size limits
- URL validation for redirects

**Data Protection:**
- Sensitive data encrypted at rest
- TLS/HTTPS for transit
- No sensitive data in logs
- PII handling regulation-compliant
- Secure random (crypto.randomBytes)
- Secrets in env vars or secret managers
- Encrypted database connections

**OWASP Top 10:** No injection, broken auth, data exposure, XXE, broken access control, misconfiguration, XSS, insecure deserialization, vulnerable components, insufficient logging

## Performance Review

**Database & Queries:**
- N+1 queries identified and fixed
- Proper indexing on WHERE/JOIN columns
- Query result sets limited (pagination)
- Connection pooling implemented
- Expensive queries cached
- Batch operations instead of loops

**Frontend Performance:**
- Code splitting for large bundles
- Lazy loading routes/components
- Images optimized and lazy loaded
- CSS/JS minified and compressed
- Memoization for expensive computations
- Virtual scrolling for long lists

**API & Network:**
- API responses paginated
- GraphQL queries optimized (no over-fetching)
- Response compression (gzip/brotli)
- CDN for static assets
- HTTP/2 or HTTP/3
- Proper caching headers
- Rate limiting implemented

**Memory Management:**
- Event listeners removed
- No memory leaks (closures, timers)
- Large objects disposed
- File streams closed
- WeakMap/WeakSet for caching

## Accessibility Review (WCAG 2.1 AA)

**Semantic HTML:**
- Proper heading hierarchy (h1, h2, h3)
- Semantic elements (nav, main, article, aside)
- Form labels properly associated
- Button vs link used correctly
- Tables with proper headers

**Keyboard Navigation:**
- All interactive elements accessible
- Logical tab order
- Focus indicators visible
- No keyboard traps
- Skip links for navigation

**Screen Reader Support:**
- All images have alt text
- ARIA labels where needed
- Live regions for dynamic content
- Hidden content marked properly

**Color & Contrast:**
- Text contrast >= 4.5:1 (normal)
- Text contrast >= 3:1 (large)
- Info not conveyed by color alone

**Forms:**
- Error messages associated with fields
- Required fields clearly marked
- Validation accessible
- Autocomplete attributes set

## Code Quality Standards

**Readability:**
- Descriptive variable/function names
- Functions < 50 lines
- Consistent naming (camelCase, PascalCase)
- No magic numbers
- Proper indentation

**Maintainability:**
- DRY principle followed
- SOLID principles applied
- Low coupling, high cohesion
- Proper separation of concerns
- Configuration externalized
- Feature flags for gradual rollout

**Error Handling:**
- All errors caught and handled
- User-friendly messages
- Errors logged with context
- Graceful degradation
- Retry logic for transient failures
- Circuit breakers for external services

**Comments:**
- Complex logic explained
- Why, not what (code self-explanatory)
- TODO/FIXME with issue tracking
- JSDoc/TSDoc for public APIs
- No commented-out code

## Testing Requirements

**Unit Tests:**
- All business logic tested
- Edge cases covered
- Error conditions tested
- Mocks for external dependencies
- Test coverage >= 80%
- Deterministic tests (no flaky)

**Integration Tests:**
- API endpoints tested
- Database operations tested
- External integrations tested
- Auth flows tested

**E2E Tests:**
- Critical user flows covered
- Happy paths tested
- Error scenarios tested

**Test Quality:**
- Readable and maintainable
- AAA pattern (Arrange, Act, Assert)
- Meaningful descriptions
- No interdependencies
- Fast execution (< 10s unit tests)

## Language-Specific Patterns

### TypeScript/JavaScript

**Type Safety:**
- No `any` types (use `unknown` if needed)
- Strict mode enabled
- Union types over enums
- Proper generic constraints
- Type guards for narrowing

**Modern Patterns:**
- Destructuring and defaults
- Optional chaining (?.) and nullish coalescing (??)
- Async/await over promise chains
- Arrow functions for callbacks

### React Components

**Best Practices:**
- Functional components with hooks
- Props properly typed
- Minimal, localized state
- Effect dependencies correct
- No inline function definitions
- Keys correct in lists
- useCallback/useMemo for optimization

### Node.js

**Server Setup:**
- Error handling middleware
- Request validation
- Rate limiting
- Helmet for security headers
- CORS configured
- Graceful shutdown handling

### Python

**Best Practices:**
- Type hints on functions
- PEP 8 compliance
- Context managers for resources
- List comprehensions over loops
- Dataclasses for data structures

### SQL

**Best Practices:**
- Parameterized queries only
- Indexes on WHERE/JOIN columns
- LIMIT on large queries
- Transactions for consistency
- Specify columns (no SELECT *)

## Review Process

**File Change Analysis:**
- High risk: auth, migrations, security config, payments, encryption
- Medium risk: business logic, API, queries, integrations
- Low risk: UI, tests, docs

**Impact Assessment:**
- Blast radius of change
- Backward compatibility
- Database migrations needed
- User impact
- Performance implications
- Security implications

**Approval Criteria:**
- No critical security issues
- Tests passing
- Code coverage maintained/improved
- Documentation updated
- No performance regressions
- Accessibility requirements met
- Code follows style guide
- Changes backward compatible (or migration plan exists)

**Request Changes for:**
- Critical security vulnerabilities
- Failing tests
- Missing test coverage
- Breaking changes without migration
- Performance regressions
- Accessibility violations

## Common Issues Reference

**Security:** Hardcoded secrets, SQL injection, missing auth, weak random generation, PII in logs, missing CSRF

**Performance:** N+1 queries, missing indexes, unnecessary re-renders, large bundles, sync blocking ops, memory leaks

**Code Smells:** Functions > 50 lines, nesting > 3 levels, duplication, magic numbers, poor naming, god objects

**Missing Error Handling:** Unhandled rejections, missing try/catch, no input validation, silent failures, generic messages

**Incomplete Tests:** Missing edge cases, no error tests, flaky tests, no integration tests, no accessibility tests

## Review Workflow

1. **Initial Scan** (2 min): PR description, file changes, high-risk files
2. **Deep Dive** (15-30 min): Review each file, apply checklists, note issues
3. **Testing Verification** (5 min): Check coverage, test quality
4. **Documentation Check** (3 min): Updated docs, breaking changes
5. **Feedback Generation** (5 min): Organize by severity, code suggestions
6. **Decision** (1 min): Approve, request changes, or comment

## Tools Integration

**Automated Checks:**
- ESLint/Prettier: Code style
- SonarQube: Quality metrics
- Snyk/Dependabot: Security vulnerabilities
- Jest/Vitest: Test coverage
- Lighthouse: Performance/accessibility
- TypeScript: Type safety

**Manual Review Focus:**
- Business logic correctness
- Architecture decisions
- Security implications
- UX impact
- Maintainability

## Best Practices Summary

1. Security first
2. Performance matters
3. Accessibility is non-negotiable
4. Quality over speed
5. Constructive feedback
6. Continuous improvement
