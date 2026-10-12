# To-Do removals — ledger

**This file is part of the repo but never part of the site.** It lives at the repo
root, outside `mbd.ast/`, so Astro never reads it and nothing here is rendered.
Do not move it under `mbd.ast/src/` or `public/`.

Every entry that has ever come off a To-Do list is recorded here, with when and
how. It exists because a URL-level audit cannot see these: most of the entries
below were removed cleanly, leaving nothing to diff against, and one of them
(`Octo Octa`) had no URL at all in the original, which is why a model reviewing
the content initially reported it as accidental corruption.

The originals are the plaintext files at the repo root (`MbD`,
`MbD Jan 2024.txt`, `MbD through 2023.txt`) and, for the single-file archive,
`git show 5cb95ee:mbd.ast/src/content/blog/2018.md`. An agent checking this
ledger should reconcile it against those.

## The rule this ledger protects

**A To-Do listing stays in To-Do.** Its record type — album, artist, track,
list, interview, or anything else — never decides where it is filed. Do not
move a To-Do entry into a release or artist section because its URL happens to
point at an album page or an artist page. What a page links to is irrelevant
here; what matters is that it is still to be listened to.

This reverses an earlier `### Artists` split, which reclassified three To-Do
entries by link type and has since been reverted.

## Removals

| Entry | Where it was | Removed | How / why | Where it is now |
|---|---|---|---|---|
| Slow Pulp - Falling Apart | To-Do, Catching Up (orig `2018.md:81`) | 2026-10-11, commit `f6705fd` | Already-listened: appeared in a yearly list, and the standing rule is that anything in a year comes out of To Do | `2024.md`, under *Listen Again* |
| Pulses - It Wasn't Supposed To Be Like This | To-Do, Catching Up (orig `2018.md:123`) | 2026-10-11, commit `f6705fd` | Already-listened: same rule | `2024.md`, under *Listen Again* |
| Haru Nemuri - Shunka Ryougen | To-Do, Catching Up (orig `2018.md:149`) | 2026-10-11, commit `f6705fd` | Already-listened: same rule | `2023.md`, under *Tracks* |
| Knife - Knife | To-Do, 2023 December (orig `MbD through 2023.txt:582`) | 2026-10-12, uncommitted | Already-listened. Listed on both the To Do page and `2026.md` October — see `CONTENT-STRUCTURE.md` §7: an entry in To Do and elsewhere comes off To Do | `2026.md`, October, under *Albums*, annotated `*To Do Old Dec 2023 - heard Oct 2026*` |
| A Guide to U.K. Jazz in 2017 | To-Do, 2021 Lists (corrections doc `:305`) | 2026-10-12, uncommitted | Already-listened, and a double entry: the same URL was already in `2017.md` under *Lists*, where the originals put it. The link is a 2017 article | `2017.md`, under *Lists* |
| Octo Octa - Resonant Body | To-Do, `OCT 19` block (orig `2018.md:489`) | owner's request, predates this ledger | Removed deliberately at the owner's request. No URL ever attached — the original line is bare text — which is why it is invisible to any URL-based check | Nowhere. Not a loss |

### Octo Octa, in full

The original line is:

```
Octo Octa - Resonant Body
```

with no URL. During the 2026-10-11 verification pass an automated check flagged
it as a deletion, and it was briefly restored. The owner confirmed the removal
had been intentional, so it was taken back off. It is recorded here rather than
in a content comment because the reason is not visible in the content.

A URL-level reconciliation of To-Do.md against the original will never surface
this entry — it has no URL to compare. If you are auditing for loss, compare
**labels**, not URLs.

## Additions are not removals

Entries that arrived *in* To Do during normalisation are not recorded here;
only departures are. Notably:

- The Hip-Hop and Noise artist notes under 2024 October were notes, not
  sections. Folding them in added Moor Mother, Deathgrips, JPEGMAFIA, Armand
  Hammer, Brainbombs and Useless Children to that month's To-Do list. Nothing
  left.

## Adding to this table

Record an entry when (and only when) it leaves a To-Do list. One row, with the
original line location, the date, the reason, and its new home — which may
honestly be "nowhere". Keep the reason specific: "already listened" and
"removed on request" are different facts and both have come up already.
