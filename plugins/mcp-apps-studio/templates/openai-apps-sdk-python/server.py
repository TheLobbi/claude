"""__APP_TITLE__ — Apps SDK / MCP Apps server (Python, FastMCP).

Standards-first: `_meta.ui.resourceUri` carries the contract and the ChatGPT
alias is dual-written for existing integrations. Data and render tools are
separate so the widget never remounts on a refetch.

Build the component bundle first:
    npm --prefix web install && npm --prefix web run build
"""

from __future__ import annotations

import pathlib
from typing import Any

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field

APP_MIME = "text/html;profile=mcp-app"

# Hosts treat this as a cache key. Breaking UI change ⇒ publish a new URI.
TEMPLATE_URI = "ui://__APP_SLUG__/v1.html"

HERE = pathlib.Path(__file__).parent
COMPONENT_JS = HERE / "web" / "dist" / "component.js"

mcp = FastMCP("__APP_TITLE__")


class Item(BaseModel):
    id: str = Field(max_length=128)
    title: str = Field(max_length=200)
    subtitle: str | None = Field(default=None, max_length=400)


class SearchResult(BaseModel):
    query: str = Field(max_length=200)
    items: list[Item] = Field(max_length=50)


# ---------------------------------------------------------------------------
# Data tool — no template. Chainable; the model can refine before rendering.
# ---------------------------------------------------------------------------


@mcp.tool(
    name="search___APP_SNAKE__",
    description=(
        "Search __APP_TITLE__ and return matching items with ids and metadata. "
        "Use when the user wants to find or list items. "
        "Returns data only — call render___APP_SNAKE__ to display it."
    ),
    annotations={"readOnlyHint": True, "idempotentHint": True},
)
def search(query: str, limit: int = 20) -> dict[str, Any]:
    limit = max(1, min(limit, 50))
    items = [
        Item(id=f"item-{i + 1}", title=f"{query} result {i + 1}",
             subtitle="Replace with your real data source.")
        for i in range(min(limit, 8))
    ]
    result = SearchResult(query=query[:200], items=items)
    return {
        "structuredContent": result.model_dump(),
        # `content` is what a text-only host and the model read. Never omit it.
        "content": [
            {"type": "text", "text": f'Found {len(items)} item(s) for "{query}".'}
        ],
    }


# ---------------------------------------------------------------------------
# Render tool — the only tool carrying the template, and it does no I/O.
# ---------------------------------------------------------------------------


@mcp.tool(
    name="render___APP_SNAKE__",
    description=(
        "Render the __APP_TITLE__ widget from prepared items. "
        "Always call search___APP_SNAKE__ first and pass its items here, "
        "filtered down to what the user actually asked about."
    ),
    annotations={"readOnlyHint": True},
    meta={
        "ui": {"resourceUri": TEMPLATE_URI},        # portable
        "openai/outputTemplate": TEMPLATE_URI,      # ChatGPT compatibility alias
        "openai/visibility": ["model", "app"],
    },
)
def render(query: str, items: list[Item]) -> dict[str, Any]:
    result = SearchResult(query=query[:200], items=items[:50])
    return {
        "structuredContent": result.model_dump(),
        "content": [
            {"type": "text", "text": f'Showing {len(result.items)} item(s) for "{query}".'}
        ],
    }


# ---------------------------------------------------------------------------
# Component resource.
# ---------------------------------------------------------------------------


@mcp.resource(TEMPLATE_URI, mime_type=APP_MIME)
def component() -> dict[str, Any]:
    if not COMPONENT_JS.exists():
        raise FileNotFoundError(
            f"{COMPONENT_JS} not found — run: npm --prefix web run build"
        )
    bundle = COMPONENT_JS.read_text(encoding="utf-8")
    return {
        "contents": [
            {
                "uri": TEMPLATE_URI,
                "mimeType": APP_MIME,
                "text": f'<div id="root"></div><script type="module">{bundle}</script>',
                # CSP lives on the resource contents. Deny-by-default: add an
                # origin only when the component provably needs it.
                "_meta": {
                    "ui": {
                        "prefersBorder": True,
                        "csp": {
                            "connectDomains": [],
                            "resourceDomains": [],
                            "frameDomains": [],
                        },
                    }
                },
            }
        ]
    }


if __name__ == "__main__":
    # Streamable HTTP so remote hosts (ChatGPT, Copilot, Claude connectors) can
    # reach it. Put OAuth 2.1 or Entra SSO in front before production.
    mcp.run(transport="streamable-http")
