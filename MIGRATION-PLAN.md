# Migration plan — past-year To Do listings into the To Do page

**Status: awaiting approval. Nothing here has been executed.**

Move the `### To Do` sections that sit on past year pages into dated blocks on
the To Do page, so that every un-listened entry lives in exactly one place.

Governed by `CONTENT-STRUCTURE.md`. Read it first, and read
`DESTINATION-CHECKLIST.md` — the two corrections docs overlap, and a large part
of this migration is entries that are on the wrong page rather than on the wrong
one.

---

## 1. Scope

Six blocks, 43 entries, two files. Nothing else moves.

| Source | Target on `To-Do.md` | Entries |
|---|---|---|
| `2024.md` `## November` | `## NOVEMBER 2024` | 6 |
| `2024.md` `## October` | `## OCTOBER 2024` | 11 |
| `2024.md` `## September` | `## SEPTEMBER 2024` | 5 |
| `2024.md` `## February` | `## FEBRUARY 2024` *(already exists — merge)* | 2 |
| `2025.md` `## March` | `## MARCH 2025` | 6 |
| `2025.md` `## February` | `## FEBRUARY 2025` | 13 |

`2017.md` … `2023.md` have no `### To Do` sections. `2026.md` has two and they
**stay** — it is the current year, and the spec puts `To Do` on the current
year's months.

After this, `### To Do` exists on `2026.md` and nowhere else.

## 2. Preconditions

The migration cannot start until these hold, because its targets are dated
blocks that do not exist yet.

1. **`To-Do.md` is restructured to the spec.** `## Catching Up` is gone and its
   contents are dated; year groupings (`## 2023` … `## 2018`) are replaced by
   month-level `H2`s; `## Oldest` exists; the five missing entries are added.
2. **The 48 misplaced entries in `DESTINATION-CHECKLIST.md` are resolved.**
   They are a separate job from this migration and a larger one, but until they
   move, the To-Do page still holds 2022 and 2023 entries that belong on year
   pages — and this migration's targets sit on that same page.
3. **`older.md` exists** and the navigation order is years → `older` → `to-do`.
4. **`check-content.mjs` knows the new shapes.** It rejects an `H2` on the To Do
   page that is neither `^(19|20)\d{2}$` nor `catching up|older`, so
   `## MARCH 2025` fails today. The rule has to change *before* the migration,
   or the build breaks on the first moved block.
5. **Baseline captured.** Per-page release-row counts and the URL set across all
   content files, recorded before anything moves. Verification is meaningless
   without it.

## 3. Resulting To Do page order

```
## MARCH 2025
## FEBRUARY 2025
## NOVEMBER 2024
## OCTOBER 2024
## SEPTEMBER 2024
## FEBRUARY 2024        ### Listen Again
## JANUARY 2024         ### Listen Again
## AUGUST 2023
## SEPTEMBER 2023
## OCTOBER 2023
## DECEMBER 2023
## AUGUST 2022
## 2021                ### Metal/Hardcore, ### Lists
## 2017
## JANUARY 2019
## OCTOBER 2019
## DECEMBER 2019
## Oldest
```

## 4. Rules for the move

- **Blocks are moved whole.** Every entry in a block goes to the target; entry
  order inside the block is preserved exactly. Nothing is reordered,
  deduplicated, relabelled or re-sectioned.
- **`## FEBRUARY 2024` merges, it does not append.** Its two Mulatu Astatke
  entries are already on the To Do page from the January-2024 restructure. The
  migration adds nothing there — the correct end state is those two entries,
  once. An agent that appends them has created duplicates.
- **Notation is preserved.** `Bloody Cumshot - Deflorantism` at `2024.md:73`
  carries `*Start from Chlamydia Rain*`. It travels with the entry. `rehype-track`
  will not style it — that wording is not in its list — but it must not be
  dropped.
- **Nothing else is touched.** Sections other than `To Do`, entries outside the
  six blocks, and every year page's month structure stay as they are.
- **Source blocks are removed only after the target exists.** Never delete from
  a year page first; a half-finished migration must leave entries somewhere.

## 5. Known defects in the moved entries

Carry them; do not silently fix them. Each needs a decision, and one of them
will bite an agent using a URL-based check.

- `2025.md:45` — the label is raw source text:
  `[The Phantom&#39;s Revenge aka NS DAYZ - The Power [HT20]](url)`. The
  `&#39;` entity and the nested `[HT20]` brackets both survive as literal
  characters in the markdown. It renders, but it will defeat any script that
  counts `[...](...)` links with a naive regex, which is exactly how it
  currently reports as a mismatch.
- `2025.md:47` — `H ZETTRIO` is bare text with no URL. It is one of only three
  bare-text entries in the content, and per `GOTCHAS.md` §4 it must not end up on
  the same line as a linked entry or it takes its paragraph neighbours down with
  it. Give it a blank line either side.

## 6. Verification

Run after the move, by someone who did not perform it.

**Nothing may be lost.** The defining checks:

1. **Total release rows across all pages is unchanged.** Moving entries between
   pages redistributes the per-page counts; the total must be identical. Baseline
   today: **855**. If it drops, entries degraded to prose — see `GOTCHAS.md` §4.
2. **The URL multiset is identical.** Every URL present before is present after,
   with the same multiplicity, minus nothing. This is the check that catches a
   dropped block.
3. **`### To Do` appears only in `2026.md`.**
4. **`To-Do.md` has no `Catching Up` and no month at `H3` level.**
5. **`npm run verify` passes** — `check:content`, `astro check`, `build`.
6. **Sidebar spot-check:** `/to-do` indexes `MARCH 2025`, `FEBRUARY 2025` and the
   rest as months; `/older` indexes its own months; `Oldest` appears on neither.

Checks 1 and 2 are the ones that matter. Checks 3–6 confirm structure, which is
easier to eyeball and much easier to get wrong quietly.

**A check that has never been seen to fail is not a check.** Before relying on
1 and 2, run them against a deliberate single-entry deletion and confirm they go
red.

## 7. Multiple agents

**The agents are an audit, not a workforce.** The point is redundancy against
lost or malformed entries, not finishing sooner. 43 entries is not a large
amount of work and splitting it by file would cost more in conflicts than it
saves.

So the shape is: **one agent moves, several agents check, none of the checkers
did the move.**

- **The mover.** One agent performs the whole migration. It owns `To-Do.md` for
  the duration, because every agent writing to that file conflicts on the same
  region and a conflict there loses entries silently rather than loudly.
- **The checkers.** Each independently re-derives the result from the sources —
  `MbD-to-do-corrections.md`, `MbD-Dated-corrections.md`, `DESTINATION-CHECKLIST.md`
  — and compares it against the moved content. They run the §6 checks themselves
  rather than reading the mover's report.
- **They disagree, and that is the point.** Two checkers computing the same
  thing independently is what catches the mover's wrong assumption. A checker
  that starts from the mover's conclusion inherits it. Give each checker the
  sources, not the mover's diff.
- **Checkers must not share state with each other** until they have both
  reported, or they converge on one answer and the redundancy is gone.

Three checkers is the useful number: enough that a single mistaken check is
outvoted, few enough that each stays independent. If you only have two, run
them in parallel with no shared scratch file.

## 8. Risks

| Risk | Consequence | Guard |
|---|---|---|
| Agent appends `FEBRUARY 2024` instead of merging | duplicate Mulatu Astatke entries | §4 rule 2; verification check 2 |
| Entry lands without a separating blank line | whole paragraph degrades to prose, neighbours lose rows | §5; verification check 1 |
| `check-content.mjs` not updated first | build fails on the first moved block | §2.3 |
| A moved entry already exists on the To Do page under another block | duplicate | verification check 2, by multiplicity |
| Verification skipped or done by the mover | loss ships green | §6, §7 |

## 9. Rollback

Single commit, or at most two — one per year page plus the To Do page change
together. Revert is `git revert`, and the baseline in §2.4 is what confirms the
revert was complete.

Do **not** attempt this with `git filter-branch`. `GOTCHAS.md` §9 records what
that costs when it silently no-ops.