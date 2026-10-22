# Changelog

## [2.1.0]

### Added
- Chakra UI v3 as a third output target next to CSS/Tailwind and styled-components: new `chakra-ui-v3` skill (createSystem, tokens, semantic tokens, colorPalette contract, recipes, color mode, v2 banned list) and Chakra sections in `css-generation`, `component-patterns`, `/component`, `/tokens`, `/convert`, `/style`, and four agents.
- `design-styles` MCP server (`mcp-server/`, zero dependencies): style search, `generate_chakra_system`, `generate_tokens`, `check_contrast`. Extendable with `DESIGN_STYLES_PATH`.
- Official `chakra-ui` MCP server (`@chakra-ui/react-mcp`) declared in `mcpServers`.
- Modern-principles guidance (semantic tokens first, dark mode via tokens, logical properties, reduced motion, WCAG AA verified by tool).

### Changed
- README and context summary now list all six skills; plugin guide uses `pnpm`.
- Style-consistency hook advisories mention Chakra tokens/recipes.
