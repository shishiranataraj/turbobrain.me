# Team Claude Code — Shared Brain Setup

A guide for engineering teams using Claude Code on the same codebase, with real-time shared context via a hosted MCP server.

---

## The Problem

- Everyone's Claude Code session is isolated by default
- CLAUDE.md is static — it doesn't reflect live project state
- No one knows what another agent did unless they pull and read commits
- Bug lists, task progress, and decisions live in people's heads or Slack threads

## The Solution: A Hosted Team MCP Server

A single server your whole team's Claude Code connects to. It holds live shared state — tasks, bugs, decisions, activity — and updates in real time when anyone makes a change.

```
┌─────────────────────────────────────────┐
│         Team MCP Server (hosted)        │
│                                         │
│  tasks • bugs • decisions • activity    │
│  shared context • team notes            │
└────────────────┬────────────────────────┘
                 │  SSE / HTTP
     ┌───────────┼───────────┐
     │           │           │
  Engineer 1  Engineer 2  Engineer 3
  Claude Code  Claude Code  Claude Code
```

---

## MCP Server — What It Exposes

### Task Management
```
create_task(title, description, assignee, priority)
update_task(id, status, notes)
get_tasks(filter?)           → all open tasks
assign_task(id, engineer)
```

### Bug Tracking
```
create_bug(title, description, severity, file?)
update_bug(id, status, fix_notes)
get_bugs(filter?)            → all open bugs
link_bug_to_commit(id, sha)
```

### Shared Context
```
get_project_status()         → tasks + bugs + recent activity summary
get_decisions()              → architectural decision log
add_decision(title, rationale, alternatives_considered)
get_team_notes()             → free-form shared scratchpad
update_team_notes(content)
```

### Activity Feed
```
log_activity(engineer, action, details)   → called by git hooks
get_activity(since?)          → what has happened recently
```

### Announcements
```
post_announcement(message)    → visible to all engineers next session
get_announcements()           → unread team messages
```

---

## Setup Per Engineer

### 1. Add the MCP server to your project config

Create `.mcp.json` in the project root (commit this):

```json
{
  "mcpServers": {
    "team-brain": {
      "type": "http",
      "url": "https://your-team-mcp.fly.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${TEAM_MCP_TOKEN}"
      }
    }
  }
}
```

Each engineer sets `TEAM_MCP_TOKEN` in their environment. One shared token or per-user tokens depending on your security preference.

### 2. Update your CLAUDE.md to reference the MCP

```markdown
## Live Project State
Always call `get_project_status()` at the start of any task session.
Always call `get_announcements()` to check for team messages.
When you complete a task, call `update_task()` to mark it done.
When you find a bug, call `create_bug()` before fixing it.
When you make an architectural decision, call `add_decision()`.
```

### 3. Install the git hooks

Copy `scripts/hooks/` to your `.git/hooks/` directory:

```bash
cp scripts/hooks/* .git/hooks/
chmod +x .git/hooks/*
```

---

## Git Hooks — Auto-Updates on Push

### `post-commit` — logs every commit to the activity feed
```bash
#!/bin/bash
COMMIT_MSG=$(git log -1 --pretty=%s)
AUTHOR=$(git config user.name)
curl -s -X POST "$TEAM_MCP_URL/activity" \
  -H "Authorization: Bearer $TEAM_MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"engineer\": \"$AUTHOR\", \"action\": \"commit\", \"details\": \"$COMMIT_MSG\"}"
```

### `post-push` — notifies team of pushed branch
```bash
#!/bin/bash
BRANCH=$(git branch --show-current)
AUTHOR=$(git config user.name)
curl -s -X POST "$TEAM_MCP_URL/announcements" \
  -H "Authorization: Bearer $TEAM_MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$AUTHOR pushed to $BRANCH: $(git log -1 --pretty=%s)\"}"
```

### `pre-commit` — optional: run lint/typecheck before Claude commits
```bash
#!/bin/bash
npm run lint --silent || { echo "Lint failed. Fix before committing."; exit 1; }
```

---

## CLAUDE.md — Team Structure

Split your CLAUDE.md into layers:

```
CLAUDE.md                    ← project-wide (committed, PR-reviewed)
.claude/
  local.md                   ← engineer-specific overrides (gitignored)
  agents/
    backend.md               ← context for backend-focused agents
    frontend.md              ← context for frontend-focused agents
    reviewer.md              ← context for PR review sessions
```

### What goes in the root CLAUDE.md
- Tech stack, folder structure, naming conventions
- Where tests live and how to run them
- PR process and branch naming rules
- Code style rules (what the linter doesn't catch)
- "Never do X" rules specific to this codebase
- Pointer to the MCP server for live state

### What goes in the MCP (not CLAUDE.md)
- Current sprint tasks
- Open bugs
- Who is working on what
- Recent decisions
- Live project status

---

## Worktrees — Parallel Work Without Conflicts

When multiple engineers (or agents) are working simultaneously, use git worktrees so each has an isolated working copy:

```bash
git worktree add ../project-feature-auth feature/auth
git worktree add ../project-bugfix-api bugfix/api-timeout
```

Each Claude Code session runs in its own worktree. No file conflicts, no accidental overwrites. Claude Code has built-in worktree support via `/worktree`.

---

## PR Review with Claude Code

Standardize how your team uses Claude Code for reviews. Add to CLAUDE.md:

```markdown
## PR Review Process
When asked to review a PR:
1. Call `get_decisions()` from the team MCP to check relevant architectural decisions
2. Check for open bugs related to the changed files via `get_bugs()`
3. Review for: correctness, security, test coverage, consistency with codebase patterns
4. Post findings as inline comments, not just a summary
5. Call `log_activity()` when review is complete
```

---

## Agent Specialization

Give different Claude Code sessions different roles by pointing them at role-specific context files:

```bash
# Start a backend-focused session
claude --append-system-prompt "$(cat .claude/agents/backend.md)"

# Start a PR reviewer session
claude --append-system-prompt "$(cat .claude/agents/reviewer.md)"
```

Or use Claude Code's `/init` command to generate role-specific CLAUDE.md files per subdirectory.

---

## CI/CD Integration

Run Claude Code as a non-interactive agent in CI for automated tasks:

```yaml
# .github/workflows/claude-review.yml
- name: Claude Code PR Review
  run: |
    claude --dangerously-skip-permissions \
           --print \
           "Review the diff in this PR. Check for bugs, security issues, and consistency. Output findings as a list."
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    TEAM_MCP_TOKEN: ${{ secrets.TEAM_MCP_TOKEN }}
```

Useful for:
- Automated PR reviews on every push
- Generating changelogs
- Updating task status when a PR merges (via merge hook)
- Running exploratory analysis on new issues

---

## Onboarding Checklist for New Engineers

```markdown
- [ ] Clone repo and install dependencies
- [ ] Install Claude Code: `npm install -g @anthropic-ai/claude-code`
- [ ] Set ANTHROPIC_API_KEY in your shell profile
- [ ] Get TEAM_MCP_TOKEN from team lead, set in shell profile
- [ ] Copy .mcp.json.example to .mcp.json (or it's already committed)
- [ ] Run `cp scripts/hooks/* .git/hooks/ && chmod +x .git/hooks/*`
- [ ] Run `claude` and verify MCP connection: ask it to call get_project_status()
- [ ] Read CLAUDE.md fully before your first session
- [ ] Check get_announcements() and get_tasks() to see what's active
```

---

## Shared Decisions Log

One of the most underrated features: a persistent record of *why* decisions were made.

Every time your team makes a non-obvious architectural choice, log it:

```
add_decision(
  title: "Use Postgres JSONB instead of a separate metadata table",
  rationale: "Metadata schema changes frequently, JSONB gives flexibility without migrations",
  alternatives_considered: "Separate table, Redis, EAV pattern"
)
```

Now any engineer (or their agent) can ask "why did we choose X?" and get a real answer — not a Slack scroll.

---

## Security Notes

- Use per-user MCP tokens if you need audit logs of who changed what
- The MCP server should validate tokens and log all writes
- Rotate tokens when an engineer leaves the team
- The `.mcp.json` should be committed but tokens must stay in env vars only
- For sensitive projects, run the MCP server on a private network (VPN-only)

---

## Hosting the MCP Server

Cheapest / easiest options:

| Option | Cost | Setup time |
|--------|------|------------|
| Fly.io free tier | Free | ~10 min |
| Railway starter | $5/mo | ~5 min |
| Your existing VPS | $0 extra | ~15 min |
| Cloudflare Workers | Free tier | ~20 min |

The server itself is ~300-400 lines of Node.js with SQLite. Single binary, no infrastructure complexity.

---

## What the Team Sees in Real Time

When everything is wired up, any engineer can ask their Claude Code:

> "What's the current project status?"

And get back:
```
Open tasks: 4 (2 in progress — Sarah: auth flow, James: API pagination)
Open bugs: 2 (1 critical: null pointer in /api/users, 1 minor: CSS flash on load)
Recent activity: James pushed bugfix/api-timeout 23min ago
Announcements: "Deploying to staging at 3pm — avoid merges until 4pm" — Sarah, 1hr ago
Last decision: Use Zod for runtime validation (Feb 27)
```

Without anyone sending a single Slack message.
