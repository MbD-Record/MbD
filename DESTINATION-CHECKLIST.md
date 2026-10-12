# Destination checklist — `MbD-Dated-corrections.md`

Every entry in `MbD-Dated-corrections.md` has a destination: a page, a month,
and sometimes a section. This is that destination, per entry, against where the
entry actually is. **Nothing here has been executed.**

Governed by `CONTENT-STRUCTURE.md`. Runs before `MIGRATION-PLAN.md`.

---

## 1. Result

| | Count |
|---|---|
| Entries in the source doc | 96 |
| Already on their destination page | 46 |
| **On the wrong page** | **48** |
| Genuinely missing | 0 |

Not one entry has been lost. All 96 exist on the site. The damage is entirely
**misplacement** — and 40 of the 48 sit on the To-Do page when the source says
they belong on a year page.

Two entries initially read as missing and are not:

- `SEED Ensemble - Driftglass` → `2017.md:45`, filed artist-only. Correct
  destination, thinner label than the source.
- `The Plot to Blow Up the Eiffel Tower` → `To-Do.md:373`, filed as
  `… - Love In The Fascist Brothel`. On the wrong page, but present.

## 2. Why they ended up mixed

Both corrections docs have a **JANUARY 2024** block, and they do not contain
the same entries:

- `MbD-Dated-corrections.md` "JAN 2024" → `2024.md ## January`:
  El Ten Eleven, Angel Hair, CLSM, Wolf Bridagde, Cursebinder, Septus, Natural
  Information Society, Regarder les hommes tomber, plus Tracks and Playlists.
- `MbD-to-do-corrections.md` "JAN 2024 TO DO" → the To-Do page's
  `## JANUARY 2024`: Hammock, Heroin, Mohinder, Unwound ×2, Shudder to Think,
  Solid Brass, Garden State, Indian Summer ×2, Universal Order of Armageddon,
  Chino Horde, Policy of Three, Shotmaker, Macroblique, Drain, Zulu, Yatsu,
  Freedom Fist, Aerosol Jesus, Rejoice, Malleus, Harm's Way, Rabbit, plus a
  `Listen Again` group.

The first normalisation pass merged both into one invented group,
`## Catching Up`, on the To-Do page. That single decision is responsible for 11
of the 48 moves. Everything else follows from the To-Do page keeping year
groupings (`## 2023` … `## 2018`) instead of month-level blocks, which put
2023 and 2022 entries on the wrong page wholesale.

**These two blocks are the mixing the destination check was meant to catch, and
they are the first thing to fix.**

## 3. The 48 moves, by source block

### → `2024.md ## January` (8) — currently `To-Do › Catching Up › *`

| Entry | Currently |
|---|---|
| El Ten Eleven | `Catching Up › Artists` |
| Angel Hair - Insect Immortality | `Catching Up › Albums` |
| CLSM - Infinity Shit | `Catching Up › Albums` |
| Wolf Bridagde - The Enemy: Reality | `Catching Up › Albums` |
| Cursebinder - Drifting | `Catching Up › Albums` |
| Septus - Phantom Indigo | `Catching Up › Albums` |
| Natural Information Society | `Catching Up › Albums` |
| Regarder les hommes tomber - ASCENSION | `Catching Up › Albums` — **and twice over** |

`Slow Pulp - Falling Apart` also appears under this block's `Tracks` heading,
but it is in the source's **March** Tracks block too and is correctly on
`2024.md:141` with `*heard Mar 2024*`. Leave it.

### → `2024.md ## January ### Tracks` (2) and `### Playlists` (1)

| Entry | Destination | Currently |
|---|---|---|
| Coliseum - Behind the sheltering sky | `### Tracks` | `Catching Up › Tracks` |
| Pulses - Run the Ghouls | `### Tracks` | `Catching Up › Tracks` |
| Intelligent DnB 1994-2000 | `### Playlists` | `Catching Up › Lists` |

`Playlists` is not a heading of its own — it maps to `### Lists`, resolved in
§5.1.

### → `2023.md` (20)

| Destination | Entries | Currently |
|---|---|---|
| `## December` | Thin - Dusk, Gendo Ikari - Rokubungi, Cognizant, Shitgrinder - S/T, Extortion - Seething, Trauma Bond, Hella, Mur - Truth | `To-Do › 2023 › December` |
| `## October` | Sewerslvt, Rorcal - Silence, Sprain, Deathwhite, Chepang - Chatta, Wormrot - Hiss, Goldie B - Nu Area | `To-Do › 2023 › December` |
| `## September` | Zombieshark, Codex Orzhova | `To-Do › 2023 › December` |
| `## August` | Empire State Bastard, Turnstile - Glow on, Mamaleek - Come and See | `To-Do › 2022 › August` and `2023 › August` |

`Haru Nemuri - Shunka Ryougen` is already correct at `2023.md` under October
Tracks. `Empire State Bastard` is currently duplicated across two To-Do blocks
and needs a single home.

### → `2022.md` (6)

| Destination | Entries | Currently |
|---|---|---|
| `## August` | Trauma Bond - Winter's Light, Scarcity - Aveilut, Abraham - Debris de mondes perdus | `To-Do › 2022 › August` |
| `## February` | Third Eye Foundation - Semtex, DJ CAM - Substances, Basement 5 - 1965-80 | `To-Do › 2022 › February` |

### → `2021.md` (3) — currently on `2017.md`, which is a different page

| Entry | Currently |
|---|---|
| Hagan - Forward Focus | `2017 › Albums` |
| Electric Dark Souls - 2021 Remast. | `2017 › Albums` |
| 68 - Give one take one | `2017 › Albums` |

The source block is dated 2021 with no month, so `2021.md` takes them as bare
entries at the level its other undated content sits.

### → `older.md`, the Older post (8)

| Entry | Currently |
|---|---|
| Sondra Sun-Odeon | `2017 › Albums` |
| Nao 1 | `2017 › Albums` |
| Nao 2 | `2017 › Albums` |
| Ephel Duath - Painter's Palette | `To-Do › 2023 › September` |
| Dir en Grey | `To-Do › 2023 › September` |
| Beecher - Breaking the Fourth Wall | `To-Do › Older › Metal/Hardcore` |
| pageninetynine | `To-Do › Older › Metal/Hardcore` |
| Skycamefalling - To Forever Embrace the Sun | `To-Do › Older › Metal/Hardcore` |

Note the name collision: `To-Do.md` currently has an `## Older` section holding
the *un-listened* backlog, and the source has an `OLDER` block for *listened*
material that becomes the new post. **They are different things that happen to
share a name.** The To-Do one is renamed `## Oldest` in the spec.

## 4. Duplicate register

Every entry listed more than once, on the site or in the source. An earlier
pass flagged three of these opportunistically; searching properly finds seven
on the site.

They are **not all the same kind of problem**, and treating them as one is how a
faithful duplicate gets deleted by mistake.

### Class 1 — the move has not been executed

| Entry | Where |
|---|---|
| Knife - Knife | `2026.md:37` October > Albums **and** `To-Do.md:72` 2023 > December |

This is the worked example from `CONTENT-STRUCTURE.md` §7: listened to, recorded
on a dated page, still listed on the To-Do page.
**Ruling: remove from the To Do page.** `2026.md:37` gains
`*To Do Old Dec 2023 - heard Oct 2026*`.

### Class 2 — genuine errors, no basis in the source

| Entry | Where | Problem |
|---|---|---|
| Unfound - Horizon \| Anomaly | `2023.md:43` October > Albums **and** `2023.md:83` May > Albums | The source has this **once**, under October 2023. The May copy has no source. |
| Kowloon Walled City | `2017.md:30` Albums **and** `2019.md:12` December > Albums | `MbD-Dated-corrections.md:118` files it under **2017**. The 2019 copy is spurious. |

**Ruling: remove the spurious copies** — `2023.md:83` and `2019.md:12`.

### Class 3 — a move recorded as a duplicate

| Entry | Where | Problem |
|---|---|---|
| Regarder les hommes tomber - ASCENSION | `To-Do.md:193` **and** `To-Do.md:224`, both `Catching Up > Albums` | Two identical lines in the same block. The source carries the entry twice: `MbD-Dated-corrections.md` puts it in **JAN 2024**, the originals in **September 2023**. |

**Ruling: the January 2024 entry is the correct one, and adding it there means
the To-Do copy goes.** One entry in total, at `2024.md ## January`. Both
`To-Do.md` lines are deleted.

This is not a special case — it is `CONTENT-STRUCTURE.md` §7: **an entry in To
Do and elsewhere comes off the To-Do page.** Placing it at January 2024 is what
makes the To-Do copy redundant. An earlier reading of this as a *split* into two
homes was wrong; there is one entry, not two.

### Class 4 — the owner listed it twice

**`Down I Go`** — `To-Do.md:33` (2023 > September) and `To-Do.md:253` (Older);
source at `MbD-to-do-corrections.md:67` and `:336`.
**Ruling: one copy, filed as an album under September 2023.** Remove the
`## Oldest` copy and place the survivor under `### Albums`.
*Note:* the URL is `https://downigo.bandcamp.com/`, an artist root rather than an
album page. The filing is as ruled; the link target does not match the section,
which `CONTENT-STRUCTURE.md` §6 otherwise warns against. Flagged, not objected
to.

**`UK Jazz Guide`** — `2017.md:54` (`## Lists`) and `To-Do.md:157`
(`## 2021 > ### Lists`). Same URL, and the URL is dated `2017/09/29`; neither
copy carries a month of its own, so they are the same date and it is a double
entry.
**Ruling: keep `2017.md:54`, remove `To-Do.md:157`.** The link is a 2017
article, `2017.md` is the backlog page for 2017 material, and the originals
file it there; the To-Do corrections doc is what put it under 2021.
**Reversible** if you would rather it stayed on the To-Do page.

**`Abstract Void`** — **three copies, not two.** An earlier pass reported two
because it grouped by URL and missed the album.

| Where | Label | URL |
|---|---|---|
| `2019.md:36` `## October > ### Albums` | Abstract Void | `abstractvoid.bandcamp.com/` |
| `2022.md:94` `## January > ### Albums` | Abstract Void - Wishdream | `…/album/wishdream` |
| `2022.md:107` `## January > ### Albums` | Abstract Void | `abstractvoid.bandcamp.com/` |

Answering the question directly: **neither is a To Do entry, and both are the
same type.** All three sit in `### Albums` on dated year pages — two in
`2022.md ## January`, one in `2019.md ## October`. The source carries the artist
root in a `[JAN]` block *and* in a `[Synth]` block, with the album *Wishdream*
sitting right beside the root entry inside that same `[JAN]` block.

**Ruling: 2019 keeps the artist, 2022 keeps the album, `2022.md:107` is
deleted.** So `2019.md:36` (artist root) and `2022.md:94` (*Wishdream*) both
stay, and the third copy goes.

This is not a one-off. It states a general principle now recorded in
`CONTENT-STRUCTURE.md` §6: **an artist can be listened to at one point and a
specific album of theirs recorded as a new entry at a later date — those are two
entries, not one.** The shape an audit has to distinguish is an artist page and
one of its albums at different dates, which is legitimate, from an artist page
sitting immediately after its own album in the same month, which is a
duplicate.

### One the site already collapsed

`altarage.bandcamp.com/album/succumb` appears twice in
`MbD-to-do-corrections.md` — once as `Altarage` at L152, once as a bare URL at
L212. The site has it once, at `To-Do.md:328`. The collapse looks right; it is
recorded only so a later check does not read it as a silent deletion.

## 5. Decisions needed before any of this moves

**None outstanding.** Every duplicate and every unresolved heading in this
document has been ruled on. What remains is execution:

1. The 48 moves in §3.
2. The duplicate rulings in §4 — Knife off the To-Do page, `2023.md:83`,
   `2019.md:12` and `2022.md:107` deleted, `Down I Go` collapsed to September
   2023, `UK Jazz Guide` collapsed to `2017.md:54`, Regarder moved to
   `2024.md ## January` with both To-Do lines deleted.
3. The five missing entries recorded in `CONTENT-STRUCTURE.md` §10.

The §7 principle — *an entry in To Do and elsewhere comes off the To-Do page* —
was checked against every entry on the To Do page and catches only the two
already ruled on, `Knife - Knife` and `A Guide to U.K. Jazz in 2017`. The
register is complete; nothing else on that page is duplicated elsewhere.

One observation is recorded but needs no action: `Unfound - Horizon | Anomaly`
is labelled as an album while pointing at the artist root, the same shape as
`Down I Go`. Whether those URLs should be the album pages is an enrichment
question, not a placement one.

## 6. Month-level pass

The §1 pass was page-level: "is it on the right file". This asks the harder
question — is it in the right *month* on that file.

| | DATED doc | To-Do doc |
|---|---|---|
| Distinct entries | 67 | 237 |
| Correct page **and** month **and** section | 28 | 88 |
| Wrong month or section | 1 | 4 |
| Wrong year | 0 | 131 |
| Wrong page | 38 | 3 |
| Absent | 0 | 11 |

**The headline is what is *not* on this list.** Once an entry is in the right
block, it is essentially always in the right month. Across 304 distinct entries
in both documents, the month itself is wrong five times. There is no long tail
of scattered month errors to chase — the damage is entirely in page placement
and in invented headings.

### The five month-level failures

| Entry | Source says | Currently | Cause |
|---|---|---|---|
| `Q1 2023 Grind` | Sept 2023 | `2023 › Lists` | invented `### Lists` |
| `Death to Real Grindcore` | Sept 2023 | `2023 › Lists` | invented `### Lists` |
| `Rare Shoegaze Guide` | Oct 2023 | `2023 › Lists` | invented `### Lists` |
| `Best Punk July 2022` | Aug 2022 | `2022 › Lists` | invented `### Lists` |
| `Slow Pulp - Falling Apart` | Jan 2024 Tracks | `2024 › March › Tracks` | **not an error** — see below |

Four of five are the same defect: the fabricated `### Lists` headings, which
absorb entries the source filed inline inside a month. They disappear when the
grouping is removed.

`Slow Pulp - Falling Apart` is a false positive. The source lists it under both
`MAR 2024 / Tracks` and `JAN 2024 / TRACKS`, and the site has it in March with
`*heard Mar 2024*`. The March placement is the correct one; the checker only
compared against the URL-bearing occurrence, which is the January one.

### What the 131 "wrong year" actually is

Not 131 mistakes. Almost all of it is `## Catching Up` and `## Older`, which
carry no date at all — 130 of the 131 sit under one of those two invented
headings. Restructure them into dated blocks and they resolve without
per-entry work. This is the strongest argument for doing the restructure as a
block move rather than entry by entry.

### What the 3 "wrong page" and 11 "absent" in the To-Do doc actually is

- **Mulatu Astatke ×2** — source says the To-Do page, they are on `2024.md` as
  `### To Do`. That is exactly what `MIGRATION-PLAN.md` moves. Already correct,
  just not migrated yet.
- **Pulses - It Wasn't Supposed to be Like This** — source says To-Do Jan 2024,
  it is on `2024.md › March` with `*heard Mar 2024*`. The move already happened
  and was annotated correctly. The checker does not read notations and reads it
  as an error. It is not one.
- **The 11 "absent"** are all lines in the source that are a bare URL with no
  label. They cannot be matched by label, so they report as missing. They are
  the URL substitutions you have already resolved.

## 7. Method, and what it does not prove

Entries were matched to the site by URL first, then by normalised label. Two
consequences worth stating plainly:

- **URL matching is the strong check.** Label matching is a fallback and it is
  what produced both false "missing" results in §1. A URL change would hide a
  real loss, which is why §4.1 of the migration plan verifies by URL
  *multiset*.
- **A bare URL with no label cannot be checked.** Eleven lines in the To-Do
  corrections doc are a URL and nothing else. They are invisible to any
  label-based check, including this one.
- **The checker does not read notations.** An entry that was correctly moved
  out of To Do looks like a misplaced entry, because the checker has no idea
  what `*heard Mar 2024*` means. Expect false positives of that shape.
- **Sections are compared by name.** An entry the source files under a heading
  the content does not have will read as a section mismatch rather than a
  missing one.

Nothing here has been changed. `npm run check:content` passes and the working
tree is as it was.