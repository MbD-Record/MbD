# Content updates — the recurring changes

How to make the three edits that happen over and over as music gets listened
to. Nothing here changes the site; it changes one entry, and the rest of the
site stays exactly as it is.

Rules and rationale live in `CONTENT-STRUCTURE.md`. This file is the procedure.
Where the two disagree, the spec is right and this file is out of date.

**Always finish with `npm run verify`** from `mbd.ast/`. It is the same gate CI
runs: `check:content` → `astro check` → `build`. It must stay green, and the
release-row count should move by exactly the number of entries you intended.

---

## Before any of it: three rules that break silently

These cause most of the damage and none of them produce an error you can see.

**1. One entry per line, line-initial, nothing else on it.**

```
[Artist - Album](https://…)      <- correct
```

The row transform matches on *paragraph shape* — a run of consecutive lines
with no blank line between them is one paragraph, and the whole paragraph
becomes rows or becomes prose together. One line that is not an entry link
takes every entry beside it down with it. This cost 22 entries before
`paragraph-shape` was made a build failure.

**2. A URL must start with `http://` or `https://`.** Anything else and the
paragraph is rejected whole. Do not write `[x](null)` — that is a valid link to
the string `null`, it builds, and it poisons the paragraph.

**3. Notes go in trailing emphasis, never in parentheses.**

```
[Last Exit - Last Exit](https://…) *free jazz*     <- renders as a row with a note
[Last Exit - Last Exit](https://…) (free jazz)    <- poisons the paragraph
```

---

## 1. Adding an entry to the current year's month

The ongoing year is `mbd.ast/src/content/blog/2026.md`. It is the **only**
year that stays in step with you; every other year file is finished.

**Where it goes:** the `## <Month>` heading, then the right `### <Section>`.
Sections are ordered, and the order is fixed:

```
### Albums -> ### Artists -> ### Tracks -> ### Lists -> ### Labels
  -> ### Listen Again -> ### To Do
```

**Order within the month:** `2026.md` runs **oldest first**, so new entries go
at the *end* of the section. Every other year runs newest-first.

```
## October

### Albums

[…existing entries…]
[New Artist - New Album](https://…)      <- append here
```

**The label.** `Artist - Album`, artist first. Do not derive it from the URL
slug — slugs lose punctuation (`album/s-t` is "s/t") and the album title is
sometimes already in the slug. Take it from the owner's own list if there is
one, otherwise from the page's `og:title`.

**Artwork.** New entries have no thumbnail until they are in the cache, and
show a monogram until then. Use the helper — it builds the block, so you cannot
get the shape wrong:

```bash
cd mbd.ast
node scripts/og.mjs <url> [<url> ...]          # print a block
node scripts/og.mjs --write <url> [<url> ...]  # append to artwork.json
```

It appends to the end of the file (the cache is in enrichment-run order and is
deliberately **not** sorted), skips URLs already cached, and prints the artist,
album, artwork URL and `og:title` it read. A missing `https://` on the URL you
pass is added for you.

- **All seven `match` fields are emitted** — `source`, `artist`, `album`,
  `year`, `genre`, `link`, `score`. Omitting `year` or `genre` makes the
  inferred JSON type stop overlapping `ArtworkMatch` and `astro check` fails
  with "neither type sufficiently overlaps". Do not fix that error by casting
  through `unknown`; it means the shape is wrong.
- `_5` is the 700px rendition, always present, ample for the 38px thumbnail.
  `_10` is 1200px but 404s when the upload is smaller.
- `year` and `audio` are `null` when Bandcamp gave you nothing. Do not invent
  them. `audio` is not used by the row.
- **Never reformat this file wholesale.** No `ConvertTo-Json | Set-Content` —
  it adds a BOM and rewrites the entire file. Hand-edit it, or use `--write`.

**Why a script and not a one-liner.** The obvious inline `node -e "fetch(...)"`
does not run here — PowerShell splits the argument on the embedded quotes and
parens and fails before Node sees it. That is `GOTCHAS.md` §10, and it is why
this is a file in `scripts/`.

**If a fetch fails**, the helper says `CHALLENGED` or `no og:title`. A
challenged request returns **HTTP 200 with a ~3 KB body**, so the status code
proves nothing — the body length and the `_fs-ch` marker are the test. Use
Node, never `Invoke-WebRequest`, which is the client that gets challenged.

**Check:** `npm run verify`. The row count for `2026` should rise by one.

---

## 2. Moving an entry from To Do to a dated location

The entry was heard and is now recorded on a dated page. It comes **off** the
To-Do page. This is the general rule in `CONTENT-STRUCTURE.md` §7: an entry in
To Do and somewhere else is one that is no longer pending.

**Order matters — place first, remove second.** A half-finished move must leave
the entry somewhere, not nowhere.

**Step 1 — read the origin month.** It is the month the entry was *recorded
under* on the To-Do page, which is the `H2` above it (after the restructure;
`## Dec 2023` — it is the `###` month under a year `H2` today).

**Step 2 — write it into the dated page** at the correct `## <Month>` and
`### <Section>`.

**Step 3 — confirm it is there** (build, or grep the file) **before** touching
the To-Do page.

**Step 4 — annotate the dated entry.** The notation carries both dates:

```
*To Do Old <origin month> <origin year> - heard <listened month> <listened year>*
```

Worked example, `2026.md` October, from an entry listed under To Do December
2023 and heard in October 2026:

```
[Knife - Knife](https://knifedetroit.bandcamp.com/album/knife) *To Do Old Dec 2023 - heard Oct 2026*
```

Omit the origin month only when the entry carried none:
`*To Do Old - heard Oct 2026*`.

**Step 5 — delete the To-Do line.** This is what the notation is recording; do
not leave the entry in both places.

**Step 6 — log it.** One row in `TO-DO-REMOVALS.md` at the repo root: entry,
where it was, date, why, where it is now. That file is outside `mbd.ast/` on
purpose so it never reaches the site. Do not put the note in a content comment
instead — a URL-level audit cannot see comments, which is how the Octo Octa
removal was once mistaken for corruption.

**Check:** `npm run verify`. One page gains a row, the other loses one, the
total is unchanged. `to-do-elsewhere` will fail the build if you forget step 5.

---

## 3. Noting a To-Do entry without removing it

Heard it, but it stays listed. The entry does not move and no dated page
changes.

**Step 1 — append a trailing annotation and change nothing else:**

```
[JAN 19: Front 242](https://www.front242.com/) *Listened Oct 2026*
```

**Step 2 — leave it where it is.** Do not add it to a year page as well. An
entry on both pages is a removal candidate, and `to-do-elsewhere` will fail the
build.

The annotation is what makes staying deliberate. `check-content.mjs` treats
`*added*`, `*heard*`, `*listened*`, `*todo*` and `*To Do …*` as marks and
exempts those lines; anything else does not.

**Check:** `npm run verify`. The row count is unchanged.

---

## Notes render as `.mbd-row__note`, not `mbd-track`

Worth knowing before you go looking for a missing style. `rehype-track.mjs`
adds `mbd-track` to an annotated `<em>`, but it runs *first*, and
`rehype-release` then replaces the whole paragraph with generated markup that
renders the note as `<span class="mbd-row__note">` — discarding it. Measured:
`mbd-track` occurs zero times in `dist/`. Entry notes are styled by
`.mbd-row__note` in `global.css`, which is what you are looking at on the page.

So adding a word to `TRACKED` in `rehype-track.mjs` changes nothing. Add
vocabulary to `KEEPS_ENTRY` in `check-content.mjs`, which is where it counts.

---

## Reading the result

After any of the three, `mbd.ast/dist/` holds the built site. Two numbers worth
knowing:

- **Total release rows.** 878 at the time of writing. It must only move by the
  entries you intended.
- **Rows per page.** A drop on a page you did not touch means entries degraded
  to prose — go back to rule 1 at the top of this file.