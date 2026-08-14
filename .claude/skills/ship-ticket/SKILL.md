---
name: ship-ticket
description: Use when the user pastes a block of raw ticket/task description text (e.g. copied from Wrike — has a title and description of work to do) and asks to implement it, or when the user explicitly says "ship this ticket". Drives the full flow from reading the ticket through implementation, diff review, Jam-based verification, gated commit, and a copy-paste Wrike-ready summary.
---

# Ship Ticket

Drive a pasted ticket from raw text to a verified, committed change and a
copy-paste summary — one step at a time, pausing for human input at the
points marked below. Do not skip steps or collapse them into one shot; the
pauses are load-bearing.

Never fetch from a ticket system and never fabricate a Jam link or claim
verification happened without one. If any step fails or is genuinely
uncertain, stop and say so instead of guessing.

## Step 1 — Parse the ticket

The user pastes raw ticket text (title + description). From it extract:

- **What needs to change** — the concrete behavior/output being asked for.
- **Where it likely lives** — which page/component/module in this app, based
  on names, terminology, or areas mentioned in the ticket.
- **Ambiguities** — anything not fully specified (see Step 3).

Restate this back briefly (a few lines) before moving on, so the user can
correct a misread before any code gets touched.

## Step 2 — Gather context before writing any code

- Read `CLAUDE.md` at the repo root for coding conventions. If it doesn't
  exist, say so, and fall back to whatever conventions doc the repo has
  (e.g. `CONTRIBUTING.md`, `RULEBOOK.md`, `README.md`) if one is present.
- Run `git log` and `git blame` on the files/modules the ticket likely
  touches (identified in Step 1) to see how similar changes were made
  recently, and match that style — naming, structure, test patterns, etc.
- If you find an existing commit or PR that solved something similar in this
  codebase, follow its pattern rather than inventing a new one.

## Step 3 — Ask before assuming

If, after Steps 1–2, any of the following are still unclear, **stop and ask
one specific, short question** before writing any code:

- Which page/component the change belongs in (if more than one is plausible).
- What the expected behavior actually is.
- There are multiple valid implementation approaches with different
  user-facing tradeoffs.

Do not silently guess on anything that changes user-facing behavior. If
everything is unambiguous, say so explicitly and proceed.

## Step 4 — Implement the change

Write the code following the conventions found in Step 2. Keep the diff as
small and targeted as reasonably possible — don't refactor unrelated code or
widen scope beyond what the ticket asks for.

## Step 5 — Show the diff and pause

Show the full diff (`git diff`) plus a one-line explanation of what changed
and why.

**Stop here. Do not proceed to Step 6 until the user responds** — they may
want changes to the implementation itself.

## Step 6 — Verification via Jam

Ask the user to:

1. Manually test the change in the browser.
2. Record a Jam (open the Jam extension, walk through the change, stop
   recording).
3. Paste the resulting Jam link back into the chat.

Do not proceed past this point without a real, user-provided Jam link. Do
not fabricate one and do not claim verification happened without one.

Once the user pastes the Jam link, hand off to the `verify-and-summarize`
subagent (via the Agent tool) rather than pulling Jam data into this
context directly — give it:

- The Jam link.
- A short description of what Step 4 was supposed to implement (so it can
  cross-check).
- The list of files changed.

The subagent will report back whether the recording matches expectations or
flags a mismatch. If it flags a mismatch (console errors, failed network
calls, behavior that doesn't match the implementation), **report that to the
user and stop — do not proceed to Step 7.**

## Step 7 — Stage and commit, only with explicit approval

Once verification passes:

1. Run `git add` on the changed files (only those files).
2. Draft a commit message following this repo's existing commit message
   style — check recent `git log` output for the pattern (tense, length,
   prefixes/tags, whether it references a ticket ID) and match it rather
   than assuming a style.
3. Show the staged files and the drafted commit message.
4. **Only run `git commit` after the user explicitly replies "yes" or
   "commit."** Never commit automatically, and never combine this with
   Step 5's or Step 6's pause.

## Step 8 — Generate the copy-paste output

Produce a single block of plain text/markdown, ready to paste directly into
a Wrike comment with no editing needed, with two clearly separated sections:

**Technical summary** — files changed, what was implemented, any edge cases
or tradeoffs, written for another developer or for a PR description.

**Manager-friendly summary** — 2-4 plain-English sentences describing what
changed and why it matters, no jargon, written for a non-technical reader of
the Wrike ticket.

Include the Jam link under both sections.

## Dry-run mode

If the user asks to test/dry-run this skill, walk through Steps 1–8 live
against a ticket they paste, pausing at Steps 3 (only if ambiguous), 5, and
6/7 exactly as above, so they can confirm the flow works end-to-end before
using it for real.
