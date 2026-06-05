---
name: template
intent: Manage and interact with templates - list, search, view details, generate from templates, and validate template configurations
tags:
  - template
  - generation
  - configuration
inputs: []
risk: medium
cost: medium
description: Manage and interact with templates - list, search, view details, generate from templates, and validate template configurations
model: sonnet
---

# Template Management Command

Manage and interact with project templates across all supported formats.

## Overview

The `/template` command provides a comprehensive interface for discovering, learning about, generating from, and validating templates.

---

## Subcommands

### 1. `/template list`

List all available templates organized by category.

**Syntax:**
```bash
/template list [--format <format>] [--category <category>] [--tag <tag>]
```

**Options:**
```
--format <format>      Filter by template format (handlebars, cookiecutter, copier, maven, harness)
--category <category>  Filter by category (web, api, cli, desktop, infra, devops, monorepo)
--tag <tag>           Filter by tag (e.g., python, nodejs, kubernetes)
--local               Show only local templates
--remote              Show only remote templates
```

**Output:**
```
Available Templates

Format: Cookiecutter
├─ python-package (0.2.1)
│  Author: Your Team
│  Description: Standard Python package template with pytest, linting
│  Categories: python, cli
│  ⭐ 12 uses

├─ fastapi-api (1.0.0)
│  Author: Your Team
│  Description: FastAPI REST API with async, SQLAlchemy
│  Categories: python, api
│  ⭐ 8 uses

Format: Copier
├─ fullstack-app (2.1.0)
│  Author: Your Team
│  Description: Full-stack app with frontend/backend, versioned
│  Categories: nodejs, typescript, fullstack
│  ⭐ 15 uses

Format: Harness
├─ standard-cicd-pipeline (1.2.0)
│  Author: Harness Templates
│  Description: Standard CI/CD with build, test, deploy stages
│  Categories: harness, cicd
│  ⭐ 25 uses
```

**Example:**
```bash
/template list --format cookiecutter
/template list --category python
/template list --tag kubernetes
```

---

### 2. `/template search <query>`

Search templates by name, description, or tags.

**Syntax:**
```bash
/template search <query> [--format <format>] [--limit <n>]
```

**Query Options:**
- Search by template name: `python`, `fastapi`
- Search by description keywords: `rest api`, `kubernetes deployment`
- Search by tags: `#python`, `#typescript`, `#kubernetes`

**Options:**
```
--format <format>      Filter results by format
--limit <n>            Maximum results to show (default: 10)
--sort <field>         Sort by: name, rating, downloads, updated (default: relevance)
--language <lang>      Filter by programming language
```

**Output:**
```
Search Results: "python" (5 results)

1. python-package (Cookiecutter)
   Version: 0.2.1
   Match Score: 95%
   Categories: #python #package #testing
   Downloads: 42
   Updated: 2 weeks ago

2. python-fastapi (Copier)
   Version: 1.0.0
   Match Score: 92%
   Categories: #python #api #async
   Downloads: 31
   Updated: 1 week ago

3. python-cli (Cookiecutter)
   Version: 0.1.0
   Match Score: 88%
   Categories: #python #cli #click
   Downloads: 18
   Updated: 1 month ago
```

**Examples:**
```bash
/template search python
/template search "rest api" --format cookiecutter
/template search #kubernetes --limit 5
/template search fastapi --sort downloads
```

---

### 3. `/template info <name>`

Display detailed information about a specific template.

**Syntax:**
```bash
/template info <template_name> [--version <version>] [--details]
```

**Options:**
```
--version <version>    Show specific version (default: latest)
--details              Show full variable documentation
--examples             Show example instantiations
--changelog            Show version history
--raw                  Show raw template configuration
```

**Output:**
```
Template: python-package
Version: 0.2.1 (latest: 0.2.1)
Format: Cookiecutter
Author: Your Team
License: MIT

Description:
Standard Python package template with pytest, linting, and documentation.
Perfect for creating new Python packages or standalone modules.

Latest Changes (0.2.1):
- Added type hints support
- Improved pyproject.toml structure
- Enhanced README template

Variables:
┌─ project_name (required)
│  Type: String
│  Description: Project name (lowercase, alphanumeric + underscore)
│  Pattern: ^[a-z_][a-z0-9_]*$
│  Example: my_project

├─ author_name (required)
│  Type: String
│  Description: Author name
│  Example: John Doe

├─ author_email (required)
│  Type: String
│  Description: Author email
│  Pattern: ^[^@]+@[^@]+\.[^@]+$
│  Example: john@example.com

├─ python_version (optional)
│  Type: Choice
│  Default: 3.11
│  Options: ["3.9", "3.10", "3.11", "3.12"]
│  Description: Target Python version

├─ use_docker (optional)
│  Type: Boolean
│  Default: false
│  Description: Include Dockerfile

└─ use_pytest (optional)
   Type: Boolean
   Default: true
   Description: Include pytest configuration

Repository:
  GitHub: https://github.com/your-org/python-package-template
  GitLab: https://gitlab.com/your-org/python-package-template

Statistics:
  Downloads: 42
  Uses: 42
  Rating: 4.8/5 (12 reviews)
  Last Updated: 2 weeks ago

Related Templates:
  - python-fastapi (API variant)
  - python-cli (CLI variant)
  - fastapi-api (FastAPI specific)
```

**Examples:**
```bash
/template info python-package
/template info python-package --version 0.1.0
/template info fastapi-api --details
/template info standard-cicd-pipeline --examples
```

---

### 4. `/template generate <name> [options]`

Generate a new project from a template with interactive prompts or batch mode.

**Syntax:**
```bash
/template generate <template_name> [--output <dir>] [--vars <file|json>] [--dry-run]
```

**Options:**
```
--output <dir>         Output directory (default: current directory)
--vars <file>          YAML/JSON file with variable values
--vars-json <json>     Inline JSON with variable values
--interactive          Interactive mode with prompts (default if no --vars)
--force                Overwrite existing directory
--dry-run              Preview generation without creating files
--no-git               Skip Git initialization
--no-install           Skip dependency installation
--after-generate <cmd> Run command after generation
```

**Interactive Mode:**
```
Template: python-package (0.2.1)

Project name: my_awesome_project
Author name: John Doe
Author email: john@example.com
Target Python version (3.9, 3.10, 3.11, 3.12) [3.11]: 3.11
Include Docker support? [y/N]: y
Include pytest? [Y/n]: y

Generating template...
✓ Created directory: my_awesome_project/
✓ Generated 12 files
✓ Initialized git repository
✓ Created initial commit

Next steps:
  cd my_awesome_project
  python -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  pytest tests/
```

**Batch Mode with Variables File:**
```yaml
# config.yml
project_name: my_project
author_name: Jane Smith
author_email: jane@example.com
python_version: "3.11"
use_docker: true
use_pytest: true
```

```bash
/template generate python-package --output ~/projects/my_project --vars config.yml
```

**Inline Variables:**
```bash
/template generate python-package \
  --vars-json '{"project_name":"my_proj","author_name":"John","author_email":"john@example.com"}'
```

**Dry-Run Preview:**
```bash
/template generate python-package --dry-run --vars config.yml

Would generate:
├─ my_project/
│  ├── my_project/__init__.py
│  ├── my_project/main.py
│  ├── tests/test_main.py
│  ├── setup.py
│  ├── requirements.txt
│  ├── Dockerfile
│  ├── README.md
│  └── ... (8 more files)

No files created (dry-run mode)
```

**Examples:**
```bash
/template generate python-package                          # Interactive
/template generate fastapi-api --vars config.yml           # From file
/template generate nodejs-app --force --dry-run             # Preview
/template generate fullstack-app --output ~/projects/app    # Custom path
```

---

### 5. `/template validate <path>`

Validate a template configuration for correctness and completeness.

**Syntax:**
```bash
/template validate <path> [--format <format>] [--strict] [--fix]
```

**Options:**
```
--format <format>      Template format (auto-detect by default)
--strict               Enforce strict validation rules
--fix                  Attempt to fix common issues
--show-details         Show detailed validation report
--ignore-warnings      Don't fail on warnings
```

**Output - Valid Template:**
```
✓ Template Validation: PASSED

Template: my-template
Format: Cookiecutter
Location: /path/to/template

Configuration:
  ✓ cookiecutter.json is valid JSON
  ✓ All referenced files exist
  ✓ Variable references are consistent

Variables (5 found):
  ✓ project_name - String, required, valid regex
  ✓ author_name - String, required
  ✓ author_email - String, required, valid email pattern
  ✓ python_version - Choice, optional, default valid
  ✓ use_docker - Boolean, optional

Files & Conditionals:
  ✓ 24 files total
  ✓ 2 conditional directories
  ✓ All file templates render correctly

Overall Health: EXCELLENT
  Quality Score: 95%
  Warnings: 0
  Errors: 0
```

**Output - Invalid Template:**
```
✗ Template Validation: FAILED

Errors Found (3):
  1. [CRITICAL] Undefined variable in template:
     File: README.md.jinja
     Line: 5
     Variable: {{project_author}}
     Fix: Should be {{cookiecutter.author_name}}

  2. [ERROR] Missing variable definition:
     Variable: python_version
     Referenced in: requirements.txt
     Fix: Add to cookiecutter.json choices

  3. [WARNING] Unreferenced variable:
     Variable: use_experimental_features
     Never used in any template file
     Fix: Remove from cookiecutter.json or use in template

Overall Health: POOR
  Quality Score: 42%
  Warnings: 1
  Errors: 2 critical
```

**Examples:**
```bash
/template validate ./my-template
/template validate ~/templates/python-api --strict
/template validate cookiecutter.json --show-details
/template validate . --format copier --fix
```

---

## Common Workflows

### Workflow 1: Find and Use a Template

```bash
# 1. Search for templates
/template search python

# 2. View details
/template info python-package --details

# 3. Generate from template
/template generate python-package --interactive
```

### Workflow 2: Generate with Custom Configuration

```bash
# 1. Create variables file
cat > config.yml << EOF
project_name: my_api
author_name: Jane Doe
author_email: jane@example.com
python_version: "3.11"
use_docker: true
EOF

# 2. Generate
/template generate fastapi-api --output ~/projects/my_api --vars config.yml

# 3. Verify
/template validate ~/projects/my_api
```

### Workflow 3: Explore Template Options

```bash
# List all Python templates
/template list --tag python

# List Cookiecutter templates
/template list --format cookiecutter

# Search for API templates
/template search api --limit 5

# Get detailed info
/template info fastapi-api --examples
```

### Workflow 4: Validate Your Template

```bash
# Check local template
/template validate ./my-template

# Strict validation with fix suggestions
/template validate ./my-template --strict --show-details

# Attempt auto-fixes
/template validate ./my-template --fix
```

---

## Integration with Other Commands

The `/template` command integrates with:

- **`/scaffold`** - Creates full projects from templates
- **`/harness`** - Harness-specific templates and CI/CD
- **`/generate`** - Generates code, models, tests

---

## Best Practices

1. **Always validate before sharing:** Run `/template validate` before publishing
2. **Use consistent formatting:** Follow language-specific conventions
3. **Test with dry-run first:** Use `--dry-run` to preview generation
4. **Document all variables:** Use `/template info --details` output
5. **Version your templates:** Track changes in changelog

---

## Error Reference

| Error | Solution |
|-------|----------|
| Template not found | Check spelling, run `/template list` |
| Invalid variables | Use `/template info --details` to see requirements |
| Permission denied | Check directory write permissions |
| File already exists | Use `--force` to overwrite |
| Invalid format | Validate with `/template validate --strict` |

---

## See Also

- **`/scaffold`** - Scaffold complete projects
- **`/harness`** - Harness pipeline templates
- **`/generate`** - Code generation

**⚓ Golden Armada** | *You ask - The Fleet Ships*
