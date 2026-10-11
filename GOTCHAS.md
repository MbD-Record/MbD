# Gotchas

Traps in this repo that cost real time. Each one is here because it bit, or
would have bitten silently.

For the current state of the project, see `SESSION-HANDOFF.md` (local only).

---

## 1. The one that matters: almost everything fails silently

There is no step in this project that fails loudly and points at the cause.
Every trap below is a variant of this.

| What breaks | What you see |
|---|---|
| Frontmatter `layout:` | Renders an unstyled page, no error |
| `Number(slug)` comparator | Ordering quietly wrong, no error |
| `rehype-release` stops matching | Whole site degrades to plain prose, no error |
| Missing `headings` prop | Sidebar renders empty, no error |
| `class="mbd-row"` prefix match | Counts look plausible, are 3× wrong |
| `sh foo.sh` in `filter-branch` | "Ref unchanged", no error |

**If a page looks wrong, assume the build succeeded anyway.** Diff the built
HTML in `dist/`, not the source.

Defences now in place — do not bypass them:
- `npm run check:content` (`scripts/check-content.mjs`) fails on bare URLs,
  second H1s, month headings that are not months, stray `<br>` and tabs, and
  an unreadable artwork cache.
- `BlogPost.astro` declares a typed `Props` interface, so omitting `headings`
  is a compile error.
- CI asserts every content slug rendered at least one release row, and that
  the total stays above a floor.

## 2. Check thresholds must be measured, not guessed

The first CI row check used `class="mbd-row"`, which also matches
`class="mbd-rows"` (the container) and `class="mbd-row__thumb"`. It reported
**2532** rows for **796** actual rows, and the `400` threshold I wrote was
calibrated on the wrong number.

Match the exact class with quotes: `class="mbd-row"`.

More generally: a check that has never been seen to fail is not a check. Add
the deliberate violation, watch it fail, then revert. The content checker has
been through this for all five of its rules.

## 3. Slugs, and the case-sensitivity trap

- Astro lowercases slugs. `To-Do.md` builds to `/to-do/`. The repo is on Astro
  4.14.5, so a literal capitalised path needs the Astro 5 `slug` frontmatter
  field, which is not available here.
- **The filename is the slug**, and most code depends on that.
- Any script that maps `src/content/blog/*.md` to a built path must lowercase.
  `dist/To-Do/` does not exist on the Linux CI runner; it only *appears* to
  resolve on Windows. This is a bug that builds fine locally and fails in CI.

## 4. Content heading contract

Two shapes, and they are not interchangeable:

- **Year posts** (`2017.md`…`2026.md`): `H1` = title, `H2` = month,
  `H3` = section (`Albums`, `Tracks`, `Lists`, `To Do`, …).
  `2017.md` is a backlog page with no months, so its `H2`s are sections.
- **`To-Do.md`**: `H1` = title, `H2` = year or named group
  (`Catching Up`, `To Do OLD`), `H3` = month *or* section.

The sidebar month index is built **only** from `H2`s on year posts. An `H2` that
is neither a month nor a section silently drops content out of navigation.

`scripts/check-content.mjs` enforces all of this. If you add a heading type,
extend that script rather than eyeballing it.

## 5. Frontmatter schema traps

- **`title: 2018` must be quoted** (`title: '2018'`). Unquoted, YAML parses it
  as a number and it fails the `z.string()` schema.
- **`pubDate` is free text**, not a date. Values like `"through 2018"`,
  `"Ongoing"`, `"In the past"`. The schema coerces to `Date`, so bad ones
  become Invalid Date.
- `feed.xml.js` must **omit the `pubDate` key entirely** for those entries,
  not set it `undefined`. `@astrojs/rss` is pinned to `4.0.19`; the schema
  rejects the `undefined` form.
- `imgUrl` was removed from the schema along with `src/assets/`. Do not
  reintroduce it.
- `buttonLabel` and `tags` are optional. Only `To-Do.md` uses `buttonLabel`.

## 6. Ordering

`Number(slug)` yields `NaN` for `to-do`, so a raw
`Number(a.slug) - Number(b.slug)` comparator silently breaks ordering. Use
`byYearDesc` from `src/lib/entries.ts`, which sorts numeric years newest-first
and pins non-numeric entries to the end.

## 7. Layout is applied explicitly

Astro 4 falls back to a bare `<Content />` when frontmatter `layout:` is
missing — unstyled page, no error. `src/pages/[slug].astro` renders
`<BlogPost>` itself and passes `render()`'s `headings`, because that is the
only way to get them into the sidebar.

Do not reintroduce `layout:`.

## 8. The release-row transform

`src/lib/rehype-release.mjs` turns `[Artist - Album](url)` paragraphs into
compact rows, sharing its markup with `src/components/blog/Release.astro` so
the live pages and the lab components cannot drift.

It matches on *paragraph shape*, so trailing `<br>`, tabs, or blank lines
between entries stop it matching — and the page still builds. That is exactly
why CI asserts row counts.

`rehype-track.mjs` styles `*added*`, `*to do*`, `*heard*` annotations without
catching ordinary italics.

## 9. Git identity and push authentication are separate problems

The repo-local identity is now fixed:

```
git config --local user.name  "Claude Code"
git config --local user.email "stcawv@gmail.com"
```

That controls **who commits are attributed to**. It does **not** control
**which account pushes**.

Push auth goes through the credential helper `gh auth git-credential`, which
serves the token for whichever account is *currently active*. That ambient
state is the original root cause of the misattribution.

Always pin before touching `gh` or this remote:

```
. .\gh-profile.ps1      # sets $env:GH_TOKEN for MbD-Record
```

**Not yet done:** a repository-scoped SSH deploy key, and one VPS Unix user
per GitHub account. Both are still open — see the handoff.

## 10. PowerShell traps in this repo

The working directory contains a space (`Dr. COMPUTER`) and the route file is
`[slug].astro`, which PowerShell reads as a **wildcard**:

- Use `-LiteralPath` with `Get-Content`, `Copy-Item`, `Test-Path` on anything
  under `src\pages\`. Plain `Get-Content` fails with a misleading
  *parameter cannot be found that matches parameter name 'Raw'*.
- `git mv`/`git mv`-style moves of that file need quoting.
- `ConvertTo-Json | Set-Content -Encoding UTF8` **adds a BOM and reformats the
  whole file**, writing `\u003e` for `>=` and `\u0026\u0026` for `&&`.
  That breaks JSON parsing downstream (PostCSS config loading failed) and makes
  the diff unreviewable. Edit JSON files by hand.
- `git checkout -- <file>` restores from the **index**, not `HEAD`. If the index
  already holds a bad edit, use `git checkout HEAD -- <file>`.

## 11. Build environment

- `site` in `astro.config.ts` reads `CF_PAGES_URL` / `CF_PAGES_BRANCH_URL`,
  which Cloudflare sets at deploy. Local and CI builds emit
  `http://localhost:4321/` in `feed.xml` and the sitemap. **That is expected.**
  It also means CI cannot validate absolute URLs.
- `mbd.ast/public/.DS_Store` is gitignored but present on disk, and `public/`
  is copied verbatim into `dist/` on every build. Harmless, but it does mean a
  stray file ships.
- `2026-test.astro`, `artlab.astro`, `rowlab.astro` are dev-only and
  `Astro.redirect('/')` in PROD. Verified: PROD build emits a 355-byte redirect
  stub with no entry data. They still occupy routes and appear in the sitemap.
