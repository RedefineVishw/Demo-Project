---
name: ship-ticket
description: Use when the user pastes a block of raw ticket/task description text (e.g. copied from Wrike — has a title and description of work to do) and asks to implement it, or when the user explicitly says "ship this ticket". Drives the full flow from reading the ticket through implementation, one diff-review gate, auto-commit on approval, then automated post-commit browser verification and an auto-published artifact summary.
---

# Ship Ticket

Four steps. Exactly one human checkpoint (Step 3). Everything else — context
gathering, implementation, staging, committing, browser verification, and
the final summary artifact — runs automatically once that checkpoint is
cleared.

Never fabricate a video, a Jam link, or a "verified" claim without real
evidence behind it. If something can't be captured automatically (see the
Jam note in Step 4), say so plainly in the output instead of pretending it
happened.

## Step 1 — Ingest the ticket

The user pastes raw ticket text (title + description). Read it and hold it
as the spec for what follows. No API/ticket-system fetching — paste-only.

## Step 2 — Implement, following the project's own rules

Do this without asking the user to walk you through it:

1. Read `CLAUDE.md` at the repo root (or the closest equivalent —
   `CONTRIBUTING.md`, `RULEBOOK.md`, `README.md` — if `CLAUDE.md` doesn't
   exist) for conventions, structure, and any stated rules.
2. Identify which part of the app the ticket touches, and run `git log` /
   `git blame` on those files/modules to see how similar changes were made
   recently — naming, structure, test/keyword patterns. Follow an existing
   pattern rather than inventing a new one if one clearly applies.
3. If — and only if — something that changes user-facing behavior is
   genuinely ambiguous (which page/component, what the expected behavior
   is, multiple valid approaches), ask one short, specific question before
   writing code. Don't stall on things you can reasonably infer from the
   ticket and the codebase.
4. Implement the change, keeping the diff as small and targeted as the
   ticket allows.

## Step 3 — Review gate (the one human checkpoint)

Show:

- The full diff (`git diff`).
- A one-line explanation of what changed and why.

Then ask, with exactly two paths (use AskUserQuestion):

- **Yes, ship it** — proceed immediately to commit (below) and then Step 4.
  No second confirmation before committing — this "yes" is the approval
  for both the diff and the commit.
- **Needs changes** — capture what the user wants adjusted, apply it, and
  show the diff again. Loop this step until they pick "yes" (or tell you
  to stop).

On "yes":

1. `git add` only the files that were actually changed for this ticket.
2. Draft a commit message matching this repo's existing style — check
   recent `git log` for tense, length, and whether prefixes/ticket IDs are
   used. Don't invent a conventional-commits format the repo doesn't use.
3. Commit.

## Step 4 — Automated verification and artifact

Hand this whole step to the `verify-and-summarize` subagent (via the Agent
tool), so the browser noise, screenshots, and logs stay out of this
conversation. Give it:

- The ticket text.
- What was implemented (short description + files changed).
- The commit hash just created.
- Whether video is required (see below).

**Before invoking it**, determine and ask about video:

1. Auto-classify the change as **static** (copy/text/style/label changes
   with no behavioral or flow difference) or **flow-changing** (forms,
   checkout, multi-step interactions, anything where a user's path through
   the app is different than before).
2. Regardless of that classification, explicitly ask the user with a
   yes/no question — "Is a video walkthrough required for this
   verification?" — showing your recommendation (yes for flow-changing,
   no for static) but letting them override it either way. Don't skip this
   ask even when the answer seems obvious.

**No Jam MCP server is connected in this environment.** The subagent
should still attempt an automated, non-manual verification via the
Playwright MCP browser tools (navigate, interact, screenshot, capture
console/network) regardless of the video answer — that's not optional and
doesn't require Jam. Video specifically is the part that depends on Jam:

- If video was requested and a Jam MCP connector happens to be available,
  use it to actually record.
- If video was requested and no Jam MCP connector is available, do not
  fabricate one. Fall back to a step-by-step screenshot storyboard from
  the Playwright walkthrough as the visual evidence, and say plainly in
  the artifact that a real video wasn't captured (no Jam connector) —
  offer that the user can record one manually and share it if they want
  the video specifically.
- If video was not requested, the screenshot storyboard + console/network
  evidence from the Playwright walkthrough is sufficient on its own.

The subagent should:

1. Drive the relevant flow in a real browser via Playwright MCP tools,
   covering what the ticket asked for.
2. Capture screenshots, console errors, and failed network requests.
3. Diff the current commit against the previous commit / last merged
   state (`git log`, `git diff HEAD~1..HEAD --stat`, etc.) to describe
   what changed relative to what shipped before.
4. Cross-check: does the browser evidence actually match what Step 2
   implemented? Flag anything that doesn't (console errors, failed
   requests, missing behavior) instead of assuming success.
5. Publish a single Artifact containing: technical summary (files changed,
   what was implemented, edge cases/tradeoffs), the previous-vs-current
   comparison, embedded screenshots, the video/storyboard section, and a
   manager-friendly plain-English summary (2-4 sentences, no jargon).
6. Return to this conversation only: pass/fail verdict, the artifact link,
   and a short plain-text mirror of the technical + manager summaries
   (so the user can paste that directly into a Wrike comment without
   opening the artifact).

If the subagent reports a mismatch (console errors, failed calls, behavior
that doesn't match the ticket), surface that to the user plainly — the
commit already happened at Step 3, so say clearly that verification found
an issue post-commit rather than implying nothing shipped.
