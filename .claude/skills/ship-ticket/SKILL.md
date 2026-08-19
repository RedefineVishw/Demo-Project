---
name: ship-ticket
description: Trigger on the paste alone — no separate "implement this" instruction is required. Use whenever the user's message is or contains ticket/task-shaped text (a title plus a description of work, optionally Acceptance Criteria / Task Breakdown sections — the shape used by Wrike, Jira, Linear, GitHub issues, etc.), or when they explicitly say "ship this ticket" / "/ship-ticket". A bare paste of that shape, with zero other commentary, IS the instruction to run this skill. Drives the full flow from reading the ticket through implementation, an interactive human browser-review checkpoint with screenshot evidence, commit + push on approval, then an automated post-commit artifact with test results and the screenshots.
---

# Ship Ticket

Four steps. Exactly one human checkpoint (Step 3 — now a live browser
review instead of a text diff). Everything else — context gathering,
implementation, opening the browser and capturing screenshots, committing,
pushing, and the final summary artifact — runs automatically once that
checkpoint is cleared.

No PR is opened by this skill — commit and push only. Whatever happens
after push (opening a PR, notifying a team, etc.) is left to the user or
to whatever process already handles that for this repo.

Never fabricate a screenshot, a test result, or a "verified" claim without
real evidence behind it. If something can't be captured or run (no test
suite in this repo, browser tools unavailable, etc.), say so plainly in the
output instead of pretending it happened.

## Step 1 — Ingest the ticket

The user pastes raw ticket text (title + description, and often acceptance
criteria / task breakdown). Read it and hold it as the spec for what
follows. No API/ticket-system fetching — paste-only.

## Step 2 — Implement, following the project's own rules

Do this without waiting on the user to walk you through it — but don't
treat "ask questions" as capped at exactly one. Ask whenever something
genuinely needs the person's judgment, at any point during the work:

1. Read `CLAUDE.md` at the repo root (or the closest equivalent —
   `CONTRIBUTING.md`, `RULEBOOK.md`, `README.md` — if `CLAUDE.md` doesn't
   exist) for conventions, structure, and any stated rules.
2. Identify which part of the app the ticket touches, and run `git log` /
   `git blame` on those files/modules to see how similar changes were made
   recently — naming, structure, test/keyword patterns. Follow an existing
   pattern rather than inventing a new one if one clearly applies.
3. If something that changes user-facing behavior is genuinely ambiguous
   (which page/component, what the expected behavior is, multiple valid
   approaches), ask a short, specific question before or during
   implementation — don't stall on things you can reasonably infer from
   the ticket and the codebase, but don't force a single up-front question
   either if new ambiguity shows up mid-task.
4. Implement the change, keeping the diff as small and targeted as the
   ticket allows.

## Step 3 — Interactive browser review (the one human checkpoint)

This replaces a text-only diff review with the person actually driving the
change in a real browser and deciding from that, not from reading a diff.
**Claude does not automate the interaction** — no scripted clicks, form
fills, or navigation beyond opening the starting page. The human manually
operates the real functionality themselves. The stop signal is the human
closing the browser window, not a chat reply and not an injected button.

1. Open the relevant page/flow in a real, visible browser via the
   Playwright MCP tools (headed, not headless — see `.mcp.json`). This one
   navigation is the only automated action Claude takes in this step.
   **There is no video recording** — `@playwright/mcp` has no
   video/trace-capture flag (confirmed via its own `--help`; only
   `--output-dir` and `--save-session`, which saves the MCP session log,
   not a video) — so don't tell the user a recording is happening.
2. Take an initial screenshot via the browser's screenshot tool right
   after the page loads, then tell the user plainly, once: the browser is
   open — go ahead and test the change yourself, close the browser window
   when you're done, no need to reply here. Then go quiet in chat.
3. Poll on a short interval using a lightweight, read-only browser tool
   call (e.g. a snapshot or screenshot call) purely to detect state, not
   to act on the page. Each successful poll may also save a screenshot, so
   there's a sequence documenting the manual walkthrough without Claude
   ever having driven it. Do not ask the user anything else while polling,
   and do not click/type/navigate on their behalf during this loop.
4. A poll call failing because the browser/page is no longer there (closed
   by the user) is the stop signal. The moment that's detected, immediately
   — with no intervening chat message — ask with exactly two paths (use
   AskUserQuestion):
   - **Yes, ship it** — proceed immediately to commit/push (below) and
     then Step 4. No second confirmation.
   - **Needs changes** — capture what they want adjusted, apply it, and
     repeat this step (reopen the browser to the starting page, resume
     polling) until they pick "yes" (or tell you to stop).

If the poll/snapshot tools needed to detect the browser closing genuinely
aren't available in a given session, say so plainly and fall back to asking
for a plain "done" reply in chat instead of silently pretending the
detection is happening.

On "yes" — this whole block should complete in seconds. Nothing slow
belongs here:

1. `git add` only the files that were actually changed for this ticket.
2. Draft a commit message matching this repo's existing style — check
   recent `git log` for tense, length, and whether prefixes/ticket IDs are
   used. Don't invent a conventional-commits format the repo doesn't use.
3. Commit.
4. Push the current branch.
5. Draft a PR title and description as plain text (from the ticket — what
   it asked for — and what was actually implemented). This is a draft
   only: no `gh`/`az` CLI calls, no host detection, no attempt to actually
   open anything. It exists purely so Step 4 can hand it back as a
   copy-paste block for whoever opens the PR by hand.
6. Tell the user commit + push succeeded (or, if push failed — no remote,
   no permission — say exactly why, plainly). No PR is opened here. Then
   proceed to Step 4 regardless; they're free to move on to their next
   ticket at this point, they don't need to wait for it.

**Do not skip Step 4 because push failed.** Commit/push and packaging are
independent outcomes — a failed push doesn't mean there's nothing to
report; Step 4's tests/screenshots/artifact still have value on their own.

## Step 4 — Packaging (runs in the background, doesn't block the user)

The slow part — running tests, uploading the screenshots, writing the
report — is exactly the part that shouldn't hold anyone up. Launch the
`verify-and-summarize` subagent via the Agent tool **in the background**
(`run_in_background: true`) immediately after Step 3 finishes, so test
output/file noise stay out of this conversation AND the user isn't stuck
watching a spinner for something that isn't fast. Give it:

- The ticket text (including acceptance criteria, if present).
- What was implemented (short description + files changed).
- The commit hash.
- The drafted PR title/description text from Step 3.
- The local paths to the screenshot(s) Step 3 just captured.

When it completes (you'll get notified — don't poll for it), report the
subagent's verdict, the artifact link, and its copy-paste block to the
user. If the user has already moved on to a new ticket by then, still
report it plainly when it comes back rather than silently dropping it.

The subagent should:

1. If this repo has a test suite (check `package.json` scripts or existing
   CI config — don't assume a framework), run the relevant tests and
   capture a real pass/fail count. Report failures plainly and specifically
   — e.g. "1 failing: sorting-keyword test, assertion mismatch on filter
   count" — and only suggest a root cause (like a data/environment issue)
   if the error output actually supports it; otherwise just report the
   failure without guessing why. If there's no test suite, say so instead
   of skipping the section silently.
2. Upload every screenshot Step 3 captured as an Artifact asset
   (`Artifact` tool, `upload_asset` action) so each is a real, embeddable
   image link — not a local file path nobody else can open.
3. Publish a single **HTML** Artifact (not Markdown — a copy-to-clipboard
   button needs real JS, which Markdown artifacts can't run) structured as:
   - **What was done** — plain summary of the implementation.
   - **Test results** — pass/fail breakdown from step 1 above, failures
     called out honestly rather than buried.
   - **PR title & description** — the drafted text from Step 3, as a
     ready copy-paste block for whoever opens the PR by hand. Not a link
     to anything — this skill never opens the PR itself.
   - **Screenshots** — every uploaded screenshot from the walkthrough,
     embedded in order so the reviewed flow is reconstructable from the
     images alone. Each screenshot gets its own **Copy** button (SVG icon,
     no emoji) beside it that copies that image to the clipboard via the
     Clipboard API, so the recipient can paste it straight into Wrike/a PR
     comment without saving the file first. Fall back to a visible "right
     click the image to copy" hint if the Clipboard API call fails.
   - **For the manager / non-technical reader** — 2-4 plain-English
     sentences, no jargon.
4. Return to this conversation only: pass/fail verdict, the artifact link,
   and a copy-paste-ready plain-text block mirroring the artifact (what
   was done, test results, the drafted PR title/description, artifact
   link) so the user can paste the ticket summary into Wrike and the PR
   text into GitHub/Azure DevOps/wherever, without retyping either —
   matching the style of "I've added X, one test is failing because Y,
   here's the PR text, here's the artifact."

If the subagent finds a real failure the human's browser review didn't
catch (e.g. an automated test that fails), surface that to the user
plainly — the commit/push already happened at Step 3, so say clearly that
packaging found an issue post-commit rather than implying nothing shipped.
