# Rules and memory

Repository contracts and working commands live in [AGENTS.md](../../AGENTS.md),
imported by [../CLAUDE.md](../CLAUDE.md).

Claude Code loads rules without `paths` frontmatter globally; files with
`paths` apply to matching work. These files are separate from callable skills
and agents. Retained security, infrastructure, research, and development rules
also support the local hooks and commands.

`lessons-learned.md` is written by
[../hooks/lessons-learned-capture.sh](../hooks/lessons-learned-capture.sh) and used
by the lessons-learned MCP server. Preserve its parser contract when changing
error capture or self-healing. It is not a place to duplicate repository
inventories or generic process guidance.
