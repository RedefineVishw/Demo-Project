---
name: ship-ticket
description: Use when the user pastes a block of raw ticket/task description text (e.g. copied from Wrike — has a title and description of work to do) and asks to implement it, or when the user explicitly says "ship this ticket". Drives the full flow from reading the ticket through implementation, an interactive human browser-review checkpoint with an auto-recorded video, commit + push + PR on approval, then an automated post-commit artifact with test results and the recording.
---

# Ship Ticket

Four steps. Exactly one human checkpoint (Step 3 — now a live browser
review instead of a text diff). Everything else — context gathering,
implementation, opening/recording the browser, committing, pushing,
opening the PR, and the final summary artifact — runs automatically once
that checkpoint is cleared.

Never fabricate a video, a PR, a test result, or a "verified" claim without
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
The stop signal comes from a button in the browser itself, not a chat
reply.

1. Open the relevant page/flow in a real, visible browser via the
   Playwright MCP tools (headed, not headless — see `.mcp.json`). Video
   recording starts automatically the moment the browser opens; nothing
   needs to be manually triggered.
2. Inject a floating **"⏹ Stop & Review"** button into the page (via the
   browser's JS-evaluation tool) — fixed position (e.g. bottom-right),
   high z-index, styled distinctly from the app's own UI so it's obviously
   not part of the product. This is a script, not a one-off DOM edit: it
   also watches for the button disappearing (SPA route changes / React
   re-renders can wipe injected nodes) and re-adds it automatically, so it
   survives normal navigation around the flow.
3. Tell the user plainly, once: the browser is open and recording — click
   the on-page "Stop & Review" button when done, no need to reply here.
   Then go quiet in chat and poll (via the wait/snapshot tools, on a short
   interval) for the click signal. Do not ask the user anything else while
   polling.
4. On click, the button should flip to a visible "Stopping…" state so the
   user gets confirmation the click registered, and write an invisible
   signal marker into the page for Claude to detect.
5. The moment the signal is detected: close the browser via Playwright MCP
   (this finalizes the recorded video file locally), then immediately —
   with no intervening chat message — ask with exactly two paths (use
   AskUserQuestion):
   - **Yes, ship it** — proceed immediately to commit/push/PR (below) and
     then Step 4. No second confirmation.
   - **Needs changes** — capture what they want adjusted, apply it, and
     repeat this step (reopen the browser, re-inject the button,
     re-record) until they pick "yes" (or tell you to stop).

If the JS-evaluation or wait/poll tools needed for the on-page button
genuinely aren't available in a given session, say so plainly and fall back
to asking for a plain "done" reply in chat instead of silently pretending
the button exists.

On "yes" — this whole block should complete in seconds. Nothing slow
belongs here:

1. `git add` only the files that were actually changed for this ticket.
2. Draft a commit message matching this repo's existing style — check
   recent `git log` for tense, length, and whether prefixes/ticket IDs are
   used. Don't invent a conventional-commits format the repo doesn't use.
3. Commit.
4. Push the current branch.
5. Open a PR via `gh pr create`, with a title and body drafted from the
   ticket (what it asked for) and what was actually implemented, plus a
   plain line at the bottom: "Verification artifact: generating…" — Step 4
   will edit this in afterward via `gh pr edit`, not block PR creation on
   it. Don't fabricate a PR number or URL — if `gh pr create` fails (no
   remote, no auth), say so plainly instead of inventing one.
6. Tell the user the commit/push/PR is done and give them the PR link —
   right here, immediately. Don't make them wait through Step 4 to hear
   this. They're free to move on to their next ticket at this point.

## Step 4 — Packaging (runs in the background, doesn't block the user)

The slow part — running tests, uploading the video, writing the report —
is exactly the part that shouldn't hold anyone up. Launch the
`verify-and-summarize` subagent via the Agent tool **in the background**
(`run_in_background: true`) immediately after Step 3 finishes, so test
output/file noise stay out of this conversation AND the user isn't stuck
watching a spinner for something that isn't fast. Give it:

- The ticket text (including acceptance criteria, if present).
- What was implemented (short description + files changed).
- The commit hash and the PR URL from Step 3.
- The local path to the video file Step 3 just recorded.

When it completes (you'll get notified — don't poll for it), run
`gh pr edit` to replace the "generating…" placeholder line with the real
artifact link, then surface the subagent's verdict and copy-paste block to
the user. If the user has already moved on to a new ticket by then, still
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
2. Upload the recorded video file as an Artifact asset (`Artifact` tool,
   `upload_asset` action) so it's a real, playable link — not a local file
   path.
3. Publish a single Artifact structured as:
   - **What was done** — plain summary of the implementation.
   - **Test results** — pass/fail breakdown from step 1 above, failures
     called out honestly rather than buried.
   - **Pull request** — the PR link from Step 3.
   - **Recorded walkthrough** — the uploaded video, embedded and playable.
   - **Screenshots** (optional) — a few key frames if useful alongside the
     video.
   - **For the manager / non-technical reader** — 2-4 plain-English
     sentences, no jargon.
4. Return to this conversation only: pass/fail verdict, the artifact link,
   and a copy-paste-ready plain-text block mirroring the artifact (what
   was done, test results, PR link, artifact link) so the user can paste
   that straight into a Wrike comment — matching the style of "I've added
   X, one test is failing because Y, here's the PR, here's the artifact."

If the subagent finds a real failure the human's browser review didn't
catch (e.g. an automated test that fails), surface that to the user
plainly — the commit/push/PR already happened at Step 3, so say clearly
that packaging found an issue post-commit rather than implying nothing
shipped.
