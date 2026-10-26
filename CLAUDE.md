# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Scrum Poker — planning poker for one team. Rooms live in memory and are disposable: no
database, no accounts, no persistence across a restart.

## Commands

```bash
pnpm dev                   # server (:3001) + client (:5173) together, via concurrently
pnpm test                  # vitest run
pnpm test:watch
pnpm e2e                   # playwright, browser-level (see Tests below)
pnpm e2e:ui
pnpm typecheck             # tsc --noEmit in every workspace, plus e2e/
pnpm lint                  # eslint .
pnpm format                # prettier --write .
pnpm build && pnpm start   # one process serves API + built client on :3001
```

Run a single test file or case with vitest directly:

```bash
pnpm exec vitest run server/src/domain/room.test.ts
pnpm exec vitest run -t 'treats a repeat join as a reconnect'
```

Vite proxies `/socket.io` and `/healthz` to the API in dev, so the client always talks to a
relative URL and the same build runs on localhost, a LAN IP or behind a tunnel.

## Layout

pnpm workspaces, Node >= 22, ESM throughout.

```
shared/   @poker/shared — wire protocol, card catalogue, vote summary. Imported by both sides.
server/   domain/ pure room rules · store/ in-memory rooms · socket/ event handlers
client/   features/lobby · features/room · features/identity · features/toast · components/ui
e2e/      Playwright specs for what needs two browsers (see Tests below)
```

Deployed as a single container to Render's free tier — `Dockerfile` and `render.yaml`;
Render rebuilds on every push to `main` and health-checks `/healthz`, which reports the live
room count. One instance, and it sleeps after 15 idle minutes: rooms are in memory, so a
restart empties every table and a second instance would be a second disconnected set of
rooms. Scaling out needs the socket.io Redis adapter and a shared room store first. There is
no authentication in front of it, and the URL is public in the README.

The server reads `PORT` (default 3001), `NODE_ENV=production` to serve the built client, and
`CORS_ORIGIN`, needed only when the client is served from another origin.

## Architecture rules

These are what hold the design together. Each is invisible from any single file, and each
can be broken by an edit that both eslint and tsc accept.

**`server/src/domain/` is pure.** Nothing there imports express, socket.io or a timer.
Every function takes state plus arguments and returns the next state, which is what makes
the rules directly testable. It also returns the _same_ room object when nothing changed —
`updateRoom` and `pruneDisconnected` rely on this so a no-op save does not broadcast to
everyone.

**`server/src/domain/projection.ts` is the reveal gate.** It is the only code that reads
`participant.vote` for output; everything sent to a browser passes through it, so hiding
votes before a reveal is enforced in exactly one place. `projectRoomFor` layers a viewer's
own vote on top of the public projection rather than duplicating the gate. Do not read a
vote for output anywhere else.

**The socket layer is a thin translation.** `registerHandlers.ts` does validate → pure
domain call → `store.update` → broadcast, and holds no rules. Shape checks live in
`socket/validate.ts`; questions that need the room in hand (does this room offer that card?)
are answered in the handler by calling a domain predicate.

**`store/roomStore.ts` is the only module that knows rooms live in a Map.** Swapping in
Redis to run more than one instance should touch that file and nothing else.

**Adding a wire event touches six files, in order:**
`shared/src/protocol.ts` → `server/src/socket/validate.ts` →
`server/src/socket/registerHandlers.ts` → `server/src/socket/broadcast.ts` →
`client/src/lib/api.ts` → a hook in `client/src/hooks/`. Components never call
`socket.emit` directly — `lib/api.ts` is the single point of contact between the wire and
the UI, one function per call, each returning the acknowledgement as a promise.

## Style

Several of these are lint-enforced; the rest are conventions the codebase holds to
consistently.

- **Named exports only.** A default export is an eslint error outside `*.config.*` files.
- **`import type` for types** — `consistent-type-imports` plus `verbatimModuleSyntax`.
- **`noUncheckedIndexedAccess` is on.** Indexed access yields `T | undefined`, and the code
  is written expecting that; do not paper over it with `!`.
- **Comments explain why, in full sentences.** Module headers state the rule the module
  exists to enforce; inline comments justify a non-obvious branch. See `projection.ts`,
  `validate.ts` and `roomStore.ts` for the register to match. Do not add comments that
  restate the code.
- Prettier: single quotes, semicolons, trailing commas, 100 columns, tailwind class sorting.

### Client

- **Design values come from `@theme` tokens** in `client/src/styles/theme.css`
  (`bg-surface-raised`, `text-title`, `rounded-panel`, `shadow-card`, `--ease-flip`). That
  file is the one place to reskin the app; a raw hex in a component forks the design system.
  Layout maths that Tailwind cannot express — the seat-ring clamps, the card flip's 3D
  context — is there too, as named `@utility` blocks so the JSX still reads as Tailwind.
- **Variants go through `cva`** in a `*Classes.ts` file next to the component, exported
  apart from it so a link can wear the same clothes as a button
  (`components/ui/buttonClasses.ts`). `cn()` from `lib/cn.ts` merges and lets a caller
  override a utility cleanly.
- **Every card label goes through `formatVote` / `formatNumber` / `describeVote`** in
  `shared/src/constants.ts`. The team writes `0,25`, not `0.25`, and `describeVote` gives
  screen readers a word instead of a glyph.
- Feature-first under `features/`; only genuinely shared primitives go in `components/ui/`.
- `client/src/assets/celebrations/` is picked up by `import.meta.glob` — dropping files in
  needs no code change. See the README in that folder.
- `/preview` renders a room from static data with no socket, which is the fast way to look
  at table layout.

### Tests

Vitest with `environment: 'node'`, tests colocated as `*.test.ts`. There is no jsdom and no
testing-library: client tests cover pure logic that has been extracted out of the component
first (`useVoteShortcuts.test.ts`, `toastState.test.ts` — the tested export is the pure
function, not the hook). New client behaviour worth testing gets pulled out the same way.

Test style is `describe`/`it` with sentence-shaped names that read as the rule being
asserted, plus small local builders (`roomWith`, `press`) instead of shared fixtures.

What needs two browsers, a live socket or a page reload lives in `e2e/` instead, as
Playwright `*.spec.ts` (vitest only matches `*.test.ts` under the three `src` trees, so the
runners never collide). That suite exists for the guarantees a single process cannot check:
the reveal gate, reconnect keeping a seat and its vote, and the deck freezing after the
first vote. `e2e/reveal-gate.spec.ts` asserts at the websocket frame rather than the DOM —
the playing card only gets its `aria-label` once the round is revealed, so a DOM-only check
stays green while the value leaks. Helpers live in `e2e/fixtures.ts`; `seatAs` seeds the
identity in localStorage, which is what makes a browser context a person.
