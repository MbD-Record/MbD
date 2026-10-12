# Content structure

The foundational spec for how MbD content is organised. Decided 2026-10-12.

**This is a specification, not a description.** When a content file disagrees
with it, the file is wrong. Nothing here has been applied to the content yet —
§8 lists what still has to change.

Traps live in `GOTCHAS.md`. This document is the structure they are traps
*within*: read this first, then `GOTCHAS.md`.

**How to make the recurring edits** — adding an entry to the current month,
moving one out of To Do, noting one in place — is in `CONTENT-UPDATES.md`.

---

## 1. Three page types

| Page | File | Top-level `H2` | What it holds |
|---|---|---|---|
| Year page | `2017.md` … `2026.md` | a month | what was heard in that month |
| Older | `older.md` | a month | heard before the years the archive starts at |
| To Do | `To-Do.md` | a dated block | what has not been heard yet |

**Navigation order is fixed: years newest-first (`2026` … `2017`), then `Older`,
then `To Do`.** `Older` is its own post, not a section of the To Do page, and
not part of 2017. It sits between them.

`Older` holds entries that predate the recorded years and that are known to have
been listened to. It is a record of the past, not a backlog — nothing in it is
still waiting to be heard.

## 2. Year pages

```
# <title>          H1, exactly one per file
## <Month>         H2 = month. Each is its own outlined, coloured card.
### <Section>      H3, inside that card
```

Months newest-first, except `2026.md` (the ongoing year) which is
chronological. `2026` is the reference shape, not a special case.

`### To Do` and `### Listen Again` are sections like any other: same card, same
level. `### Listen Again` is **italic**. On the current year a month may carry
both; past years still do, and that is expected until §8.

**`2017.md` is the one exception.** It has no month data, so its `H2`s are
sections (`Albums`, `Tracks`, `Lists`) and it has no `H3`s. Do not invent months
for it.

## 3. The To Do page

```
## <Month> <Year>   H2 = a dated block, its own outlined coloured card
### <Section>       H3, inside that card
```

Same two-level shape as a year page, with a different top level. `## APRIL 2023`
is a card, exactly like `## April` on a year page, and the `H3` level is left
free for sections.

**The dated blocks are month-level `H2`, not a year `H2` with month `H3`
inside.** Two levels are needed for month plus section; a year grouping would
spend one of them on a year and leave nowhere for the section.

Where only the year is known, the `H2` is the bare year — `## 2017`,
`## 2021`. These are cards that are not month cards, which is the one place the
two page shapes stop lining up.

The page runs newest to oldest, and ends on an undated backlog:

```
## FEBRUARY 2024
## JANUARY 2024            ### Listen Again
## AUGUST 2023
## SEPTEMBER 2023
## OCTOBER 2023
## DECEMBER 2023
## AUGUST 2022
## 2021                    ### Metal/Hardcore, ### Lists
## 2017                    Division Monarchy, Grandson
## JANUARY 2019            Front 242
## OCTOBER 2019            Kidnap - Grow, The Jungle - Sunrise Manor EP
## DECEMBER 2019           Universal Indicator Series
## Oldest                  *Shels through Will Haven
```

`## Oldest` is the undated backlog — the owner's "To Do OLD OLD OLD…" run, and
**only** that run, from `*Shels` to `Will Haven` inclusive. It is the last
section and it has no date.

**It has no date because none exists.** Nothing in that range is dated in the
owner's source, in any file. `Oldest` exists precisely to hold the entries that
are known only to be older than everything on the dated pages — it is a
statement about the absence of information, not a guess at one. Do not
manufacture months for it, and do not sort it by anything: **the entries stay in
the order they were written.**

`Division Monarchy` and `Grandson` are 2017. Every other entry above
`Oldest` carries a date in 2019 or 2024.

## 4. Heading registry

Everything permitted, in one place. `check-content.mjs` should enforce this
table and nothing else.

### H2

| Page | Permitted `H2` | Notes |
|---|---|---|
| `2018.md` … `2026.md` | the twelve month names | plus combined forms like `September / October` |
| `2017.md` | `Albums`, `Tracks`, `Lists` | backlog page, sections at top level |
| `To-Do.md` | `<Month> <Year>`, or a bare `<Year>` | plus the final `Oldest` |
| `older.md` | the twelve month names | same shape as a year page |

### H3

Sections appear in this order:

```
### Albums -> ### Artists -> ### Tracks -> ### Lists -> ### Labels
  -> ### Listen Again -> ### To Do
```

`Labels` is a section for record-label listings. It is conceptually a list, so
it takes the position immediately after `Lists` wherever it appears.

`Playlists` is likewise a list — the source uses both words — so it maps to
`### Lists`. There is no separate heading for it.

| `H3` | Legal on | Meaning |
|---|---|---|
| `Albums` | all pages | full-length releases |
| `Artists` | all pages | links to an artist page with no album link |
| `Tracks` | all pages | individual tracks |
| `Lists` | all pages | editorial: guides, features, interviews, label write-ups |
| `Labels` | To Do | record-label listings; comes straight after `Lists` |
| `Listen Again` | year pages, To Do | heard again; **italic** |
| `To Do` | year pages, To Do | not yet heard |
| `Metal/Hardcore` | To Do | the owner's own genre grouping |

**No `H4`, anywhere.** If something seems to need a fourth level, it is one of
the cases in §8, not a new heading level.

### Never sections

`Hip Hop`, `Noise`, `Similar Artists`, `New Albums To Listen`, `Explore`.
These were one-off notes written beside the entries they referred to — in the
original master file they were plain text lines, not headings. Promoting them to
headings made a passing remark look like a real category. `check-content.mjs`
rejects all five by name.

## 5. `Labels` sits after `Lists`

`Labels` introduces record-label listings. It is conceptually a list, so it
takes the position immediately after `### Lists` wherever it appears, and it
does not nest inside `Metal/Hardcore` or any other listing group.

In the source it was written inside the metal/hardcore run, which is why it
looked like part of that group. It is not.

## 6. Entry labels

`Artist - Album`, in that order. The row shows the artist in bold, then the
album. When the URL links to a specific release the album title belongs in the
label too — and the artwork cache's `og:title` is the reliable source for it,
**not** the URL slug. Slugs lose punctuation (`album/s-t` is "s/t",
`album/-` is "ЧОМУ НЕ ВИЙШЛО?") and the title sometimes already starts with the
artist name ("Orchid - Totality"), which naive prefixing duplicates. Where no
title is retrievable the entry stays artist-only rather than guessed.

`### Artists` is decided by the **link target**: `https://rlht.bandcamp.com/` is
an artist link, `.../album/ascension` is a release link. They go in different
sections even though Bandcamp's page may *display* an album for both.

### An artist, then one of their albums, is two entries

An artist can be listened to at one point and a specific album of theirs
recorded as a new entry at a later date. **Those are two entries, not one, and
they are not a duplicate.**

So `Abstract Void` (the artist, `2019.md ## October`) and `Abstract Void -
Wishdream` (the album, `2022.md ## January`) both stay. An artist-page entry
and an album entry for the same artist in different months is the intended
shape, not an error to be collapsed.

What *is* an error is the same entry twice in one block, or an artist page
sitting immediately after one of its own albums in the same month with no date
between them — that is a duplicate that should collapse.

Note the related trap: an entry labelled `Artist - Album` whose URL is the
artist root rather than the album page. The label says one record and the link
says another. Several entries have this shape.

**A section heading may never be created by classifying entries after the
fact.** An entry stays where it was written. `Catching Up > Artists` came to
exist that way, holding two entries chosen purely because their links were
artist pages, and `Catching Up` was a group name that appears nowhere in the
owner's source.

## 7. To Do → dated page

### If an entry is in To Do and somewhere else, remove it from To Do

**This is the general rule. The two mechanisms below are its special cases.**

An entry listed on the To Do page *and* anywhere else has been recorded
somewhere it is no longer pending. The most likely action is to delete the
To-Do copy. What is left in To Do is what appears nowhere else.

**The only thing that makes a duplicate legitimate is a notation.**
`*heard Mar 2024*` on a To-Do row says "heard, and deliberately still listed" —
that is the **mark** mechanism below, and it is an explicit statement that the
To-Do copy stays. With no notation, this rule applies and there is nothing else
to weigh.

**Place first, remove second.** Write the entry to its destination, confirm it
is there, then delete the To-Do copy. Never the reverse — a half-finished move
must leave the entry somewhere rather than nowhere.

Checked against the whole site, this currently catches exactly **two** To-Do
entries: `Knife - Knife` and `A Guide to U.K. Jazz in 2017`. Both already
ruled on. It is not a large sweep, and it does not need to be.

### The two mechanisms

They differ in what happens to the entry, and **either can happen to any
entry, of any type** — tracks are not special:

**Move.** Listened to and now recorded on a dated page. It comes off the To Do
page, and the dated-page listing carries a notation:

```
[Unbroken - Life. Love. Regret.](https://unbroken.bandcamp.com/album/life-love-regret) *To Do Old - heard Oct 2026*
```

**Mark.** Listened to, but stays in the To Do listing with a notation recording
the month. It is never removed.

The notation names the month the entry was **recorded under on the To Do page**,
where that is known:

```
*To Do Old Dec 2023 - heard Oct 2026*
```

`*To Do Old - heard Oct 2026*` is correct only when the entry carried no month.
A mark-only notation is just `*heard Mar 2024*`.

Both are maintained by hand. Nothing checks for them and nothing should.

Every departure from a To Do list is recorded in `TO-DO-REMOVALS.md` at the
repo root, which is deliberately outside `mbd.ast/` so it never reaches the
site. A move is a departure, so it gets a row.

## 8. Not done yet

- **Past-year `### To Do` sections** (2024 and 2025 have several) will
  eventually move to dated blocks on the To Do page. Until then they stay put;
  their presence on a past year page is not an error.
- **Two entries are missing from the To Do page entirely** — see §10. They have
  known homes and should be added with them.
- **`## Oldest`'s boundary is stated, its contents are not settled.** `*Shels`
  through `Will Haven` is the range; what each entry's month or year is, where
  known, is not recorded anywhere in the source.

## 9. Consequences for the code

Each of these is a place where the structure above changes existing behaviour,
so they are worth knowing before implementing.

- **`src/lib/entries.ts` `byYearDesc` does not describe the navigation yet.** It
  sorts numeric years descending and pins every non-numeric slug to the end, so
  with two non-numeric posts it cannot tell `older` from `to-do`. This is a
  two-item list to write down, not a date calculation — no ordering logic is
  needed beyond "years descending, then `older`, then `to-do`". The existing NaN
  trap in §6 of `GOTCHAS.md` is a separate and still-real problem.
- **`src/lib/rehype-month-groups.mjs` wraps every `H2`,** not just months. So on
  `2017.md` the cards are `Albums` / `Tracks` / `Lists`, and on `To-Do.md` they
  will be dated blocks. That is intended, not a bug.
- **`BlogSideBar.astro` indexes any `H2` whose words are all month names,** with
  a trailing year stripped. So `## APRIL 2023` will appear in the To Do page's
  sidebar and `older`/`## Older` will not. An `H2` that is neither contributes
  nothing, silently.
- **`src/lib/rehype-track.mjs` only styles annotations beginning `added`,
  `heard`, `todo` or `to do`.** Any new wording has to be added there or it
  renders as unstyled italics.
- **`src/pages/[slug].astro` turns every content file into a route.** A new
  `older.md` means a new `/older/` page, and it needs the same `BlogPost`
  treatment as the rest.

## 10. Where the content is today

Recorded so drift is visible rather than discovered.

### Headings

**`H2`, 23 distinct.** Months: `January` ×8, `November` ×7, `October` ×6,
`August` ×6, `June` ×6, `May` ×6, `December` ×5, `March` ×5, `February` ×5,
`September` ×5, `April` ×5, `July` ×3, `September / October` ×1.
Backlog: `Albums`, `Tracks`, `Lists`.
To Do page: `2023`, `2022`, `2021`, `2019`, `2018`, `Catching Up`, `Older` —
all seven replaced per §3.

**`H3`, 13 distinct.** `Albums` ×64, `Lists` ×22, `Tracks` ×15, `To Do` ×8,
`Listen Again` ×4, `Metal/Hardcore` ×1, `Labels` ×1, `Artists` ×1 — plus five
that are months being used at the wrong level, all in `To-Do.md`: `August` ×2,
`October` ×2, `December` ×2, `September` ×1, `February` ×1.

No `H4` exists anywhere.

### Entries missing from the content

These are in the owner's source and in none of the content files. Each has a
known home:

| Entry | Belongs in | Source |
|---|---|---|
| The Hated – No More We Cry | To Do, April 2023 | `MbD through 2023.txt:639` |
| Goldfrapp | To Do, May 2023 | `:644` |
| Any Information – E | To Do, October 2023 | `:528` |
| Karate – Some Boots | To Do, October 2023 | `:529` |
| Crypta – Shades of Sorrow | To Do, December 2023 | `:581` |

`## APRIL 2023` and `## MAY 2023` do not exist on the To Do page at all, and
neither does the small group of October 2023 entries at the end of that block.
`Septus – Phantom Indigo`, `Laang – Riluo` and `Cursebinder – Drifting` also
belong to December 2023 but survive only under the invented `Catching Up`.