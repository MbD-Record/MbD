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
  `[x](null)`, second H1s, headings that are not in the registry, stray `<br>`
  and tabs, an entry paragraph holding anything but entry links, an unranked
  non-year post, frontmatter `layout:` or unknown keys, a date-shaped
  `pubDate` that does not parse, and an unreadable artwork cache.
- `BlogPost.astro` declares a typed `Props` interface, so omitting `headings`
  is a compile error.
- CI (`.github/workflows/ci.yml`, at the repo root) runs
  `check:content` → `check` → `build`, then asserts:
  - every content slug has a built page with at least one release row;
  - no page falls below 5 rows and the total holds at 850 against a measured
    878 (see §2 — the old 700 floor came from a miscount);
  - `dist/` contains no dotfiles (see §11).

`npm run verify` runs the same first three locally, so it reproduces CI.

**A new defence is only trustworthy once you have seen it fail.** Every check
above was tested with a deliberate violation before being relied on.

## 2. Check thresholds must be measured, not guessed

The first CI row check used `class="mbd-row"`, which also matches
`class="mbd-rows"` (the container) and `class="mbd-row__thumb"`. It reported
**2532** rows for **796** actual rows, and the `400` threshold I wrote was
calibrated on the wrong number.

Match the exact class with quotes: `class="mbd-row"`.

More generally: a check that has never been seen to fail is not a check. Add
the deliberate violation, watch it fail, then revert.

All eight rules in `check-content.mjs` have now been verified that way
(`single-h1`, `month-heading`, `year-heading`, `section-heading`, `bare-url`,
`br-tag`, `tab-character`, `artwork-cache`), as has the CI dotfile check.

**That audit was worth more than it cost.** Claiming "all five rules verified"
when the file had eight was wrong, and chasing the discrepancy found a real
bug: `tab-character` sat *after* the heading branch, which `continue`s, so a
tab inside any heading was never caught. Only tabs in body lines were. Fixed
by moving the check above the heading match.

## 3. Slugs, and the case-sensitivity trap

- Astro lowercases slugs. `To-Do.md` builds to `/to-do/`. The repo is on Astro
  4.14.5, so a literal capitalised path needs the Astro 5 `slug` frontmatter
  field, which is not available here.
- **The filename is the slug**, and most code depends on that.
- Any script that maps `src/content/blog/*.md` to a built path must lowercase.
  `dist/To-Do/` does not exist on the Linux CI runner; it only *appears* to
  resolve on Windows. This is a bug that builds fine locally and fails in CI.

## 4. Content structure lives elsewhere

The structure of the content — page types, the heading registry, entry labels,
the To Do → dated-page notations — is specified in **`CONTENT-STRUCTURE.md` at
the repo root**. The procedures for the three recurring edits are in
**`CONTENT-UPDATES.md`**. Both are foundational; this file is only their list of
traps. Read those first.

The trap that most often bites is not in the registry but in how entries are
written, because `rehype-release` matches on *paragraph shape* and silently
demotes the whole paragraph when it does not match:

- **A bare-text entry between linked entries kills the whole paragraph.**
  `Encounters With a Yeti - Pilot` at `2018.md:26`, the `(free jazz)` after a
  link at `2020.md:76`, and `Basement 5 - 1965-80` at `To-Do.md:99` each cost
  their neighbours their release rows: 22 links rendered as prose instead of
  entries, with no error. A fourth instance, `(unlistenable)` at `2020.md:129`,
  was still there when these were found. An entry with no known URL goes on its
  own paragraph, separated by blank lines.
- **`(parenthetical)` after a link is the same failure.** Anything in the
  paragraph that is not a link or a tracking annotation defeats the match. A
  note on the entry's own line is written as trailing emphasis —
  `[Last Exit](url) *free jazz*` — which the row transform accepts.
- **Both are build failures**, as `paragraph-shape` in `check-content.mjs`.
- **An entry in To Do that is also on another page comes off the To-Do page**
  (`to-do-elsewhere` in the same script). A tracking annotation is the only
  thing that makes keeping it deliberate. This is `CONTENT-STRUCTURE.md` §7.
- CI's row floor is now **850** against a measured **878**, with the per-page
  numbers and the date recorded beside it. See §2 for why that matters more than
  the number itself.

`scripts/check-content.mjs` enforces the registry in `CONTENT-STRUCTURE.md` §4
and the rules above. It decides page type by **filename**, not by content —
the old version sniffed for a bare-year `H2`, so editing headings could
silently switch a file to a different ruleset. If you add a heading type,
extend that script rather than eyeballing it.

## 5. Frontmatter schema traps

The schema is in `src/content/config.ts`. Two things it does **not** do, which
is why `check-content.mjs` checks them instead:

- **`z.object()` strips unknown keys silently.** A stray `imgUrl:` or a typo
  builds clean and the field simply vanishes. Caught by `frontmatter-unknown-key`.
- **`pubDate` is free text and is coerced with `new Date(str)`**, so most values
  become Invalid Date on purpose — `"through 2024"`, `"Ongoing"`, `"In the past"`.
  That is fine. A value that *looks* like a date and is not is caught by
  `frontmatter-pubdate`. `feed.xml.js` already omits the key for the rest.

`title: 2018` must be quoted (`title: '2018'`) — unquoted, YAML parses it as a
number and `z.string()` fails the build. That one needs no extra check.

Never put `layout:` in frontmatter. Astro 4 then renders an unstyled page with
no error; `[slug].astro` applies the layout itself. Caught by
`frontmatter-layout`.

## 6. Ordering

Navigation is years newest-first, then `older`, then `to-do`. `Number(slug)` is
`NaN` for anything non-numeric, so a raw `Number(a.slug) - Number(b.slug)`
comparator breaks ordering silently. `byYearDesc` in `src/lib/entries.ts` owns
that order, and `check-content.mjs` has a `nav-order` rule that fails if a new
non-year post is added without a rank — it guards the input rather than
duplicating the comparator, so the two cannot drift.

## 7. Layout is applied explicitly

Astro 4 falls back to a bare `<Content />` when frontmatter `layout:` is
missing — unstyled page, no error. `src/pages/[slug].astro` renders
`<BlogPost>` itself and passes `render()`'s `headings`, because that is the
only way to get them into the sidebar. `BlogPost.astro` declares a typed
`Props`, so omitting `headings` is a compile error rather than an empty
sidebar. Do not reintroduce `layout:` — `frontmatter-layout` now fails the
build.

## 8. The release-row transform

`src/lib/rehype-release.mjs` turns `[Artist - Album](url)` paragraphs into
compact rows, sharing its markup with `src/components/blog/Release.astro` so
the live pages and the lab components cannot drift.

It matches on *paragraph shape*, so trailing `<br>`, tabs, or blank lines
between entries stop it matching — and the page still builds. That is exactly
why CI asserts row counts.

**A `[Label](null)` link costs its neighbours their rows too.** Markdown reads
`[x](null)` as a *valid* link whose target is the string `null` — no warning,
build stays green, and `dist/` ships a dead `href="null"`. Worse,
`rehype-release.mjs` rejects any href that is not `http(s)`, and it rejects the
**whole paragraph**, so one `null` demotes every healthy entry beside it to
plain prose. Fixing 12 such links took the build from 796 rows to 839 — the
paragraph effect, not the 12 entries. Write an entry with no known URL as bare
text instead. `check:content` now has a `null-link` rule for this.

**Editorial links belong in `### Lists`.** A guide, feature, interview,
discussion or Bandcamp tag page is not a release, but `rehype-release` renders
both identically — so a `daily.bandcamp.com` list filed under `### Albums`
looks completely normal while being misfiled. Keep them in `### Lists`, placed
after Albums/Tracks and before Listen Again / To Do. This one is editorial and
is *not* automated: a URL-shape heuristic would produce false positives on
every artist page and no false negatives at all.

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

Push auth does **not** go through `gh auth git-credential` on this machine.
That was the theory when this was written and it is wrong. Measured 2026-10-12:

```
git config --show-origin --get-all credential.helper
  file:C:/Program Files/Git/etc/gitconfig   manager
```

It is **Git Credential Manager**, configured globally, and GCM has a
`rock-solid-sites` token in the Windows credential store:

```
git push --dry-run origin main
  remote: Permission to MbD-Record/MbD.git denied to rock-solid-sites.
  fatal: ... 403
```

So the active identity for a push is whatever GCM has cached, and right now
that is the wrong account. **The mitigating fact is that it fails loudly** —
403, not a silent write to the wrong place. Nothing has been pushed to the
wrong account because nothing has been pushed at all.

## 9.1 Git attribution vs push authentication are different things

**Attribution — fixed, and it is the part that was done.** Commit *credit* is
repo-local:

```
git config --local user.name  "Claude Code"
git config --local user.email "stcawv@gmail.com"
```

History was rewritten and force-pushed with these in place, which is why GitHub
shows `MbD-Record` for every commit.

**Push authentication — fixed 2026-10-12, differently.** `origin` is now SSH:

```
git@github.com-mbd:MbD-Record/MbD.git
```

An SSH key is bound to an account, so it is unaffected by which account `gh`
considers active or by what Git Credential Manager has cached. The dry run that
preceded this measured, before and after:

| | before | after |
|---|---|---|
| `git push --dry-run` | `Permission to MbD-Record/MbD.git denied to rock-solid-sites` (403) | `8ec4f2a..98aaa91 main -> main` |

**Why not `gh ssh-key add`.** That needs the `admin:public_key` scope, which
neither account's token has, and `gh auth refresh -s admin:public_key` is an
interactive browser flow. A **repo deploy key** needs only `repo` scope plus
admin on that repo, so it went in through `gh api` with the token pinned:

```
$env:GH_TOKEN = (gh auth token --user MbD-Record)
gh api repos/MbD-Record/MbD/keys --method POST --input -
```

Key id `166198557`, `read_only=false`, `~/.ssh/mbd_github`, registered under
the alias `github.com-mbd` in `~/.ssh/config` rather than plain `github.com` so
it cannot become the default for other GitHub work from this machine.

**To undo:** delete the deploy key from the repo's Settings > Deploy keys, then
`git remote set-url origin https://github.com/MbD-Record/MbD.git`. Doing that
puts the 403 straight back, so also clear the wrong GCM credential first.

**Still true, and worth keeping in mind:** `gh` on this machine is logged in as
`rock-solid-sites`, which has only `READ` on this repo. SSH pushes are now
unaffected, but `gh` *API* calls still act as `rock-solid-sites` unless
`GH_TOKEN` is pinned. That is how the original misattribution happened, when
`gh repo create` ran under the wrong account. Check `gh auth status` before
anything that writes.

## 10. PowerShell traps in this repo

**Use the Node scripts, not PowerShell, for anything that reads or writes a
file.** Most of this section was about workarounds for a shell that is the wrong
tool here, and the workarounds are now gone:

| Instead of | Use |
|---|---|
| `ConvertTo-Json \| Set-Content` on `artwork.json` | `node scripts/og.mjs --write <url>` |
| `node -e "fetch(...)"` for og: tags | `node scripts/og.mjs <url>` |
| hand-checking content rules | `npm run check:content` |

`ConvertTo-Json | Set-Content -Encoding UTF8` **adds a BOM and reformats the
whole file**, writing `\u003e` for `>=` and `\u0026\u0026` for `&&`. It breaks
JSON parsing downstream and makes the diff unreviewable. That is what
`og.mjs --write` exists to prevent — it inserts text and never reformats.

Two shell facts still worth knowing:

- The working directory contains a space (`Dr. COMPUTER`) and the route file is
  `[slug].astro`, which PowerShell reads as a **wildcard**. Use `-LiteralPath`
  with `Get-Content`, `Copy-Item` and `Test-Path` on anything under
  `src\pages\`. Plain `Get-Content` fails with a misleading *parameter cannot be
  found that matches parameter name 'Raw'*.
- `git checkout -- <file>` restores from the **index**, not `HEAD`. If the index
  already holds a bad edit, use `git checkout HEAD -- <file>`.

## 11. Build environment

- `site` in `astro.config.ts` reads `CF_PAGES_URL` / `CF_PAGES_BRANCH_URL`,
  which Cloudflare sets at deploy. Local and CI builds emit
  `http://localhost:4321/` in `feed.xml` and the sitemap. **That is expected.**
  It also means CI cannot validate absolute URLs.
- **`public/` is served verbatim.** Astro copies it to `dist/` root, so every
  file there becomes a public URL. `.gitignore` does **not** protect you: it
  governs what is committed, not what Astro copies. This repo shipped a 6 KB
  `.DS_Store` (macOS Finder metadata, inherited from the brutal-ui template)
  on every build for months while being correctly gitignored. CI now fails on
  any dotfile in `dist/`. If you edit this repo from a Mac, check
  `public/.DS_Store` does not reappear.

The dev-only lab pages (`2026-test`, `artlab`, `rowlab`) have been deleted.
They were occupying routes and appearing in the sitemap while shipping a
redirect stub in production. The month-card styling they previewed now lives
only in `src/styles/global.css` and `src/lib/rehype-month-groups.mjs`, and the
real posts are the reference.

## 12. Reaching Bandcamp from this machine

**Bandcamp is not blocked; PowerShell is.** `.NET`'s stack gets a Fastly
challenge page that still returns **HTTP 200**, so the status code proves
nothing — body length and the `_fs-ch` marker are the test. Node's `fetch` and
`curl.exe` are served normally with no User-Agent at all.

That is now handled for you: `scripts/enrich.mjs` (`fromBandcamp`) and
`scripts/og.mjs` both read `og:title` / `og:image` off the page correctly. Use
those instead of reaching for a shell. `_5` is the 700px artwork rendition and is
always present; `_10` is 1200px and 404s on small uploads.
