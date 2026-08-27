# Scrum Poker

Lightweight planning poker for a team. Create a room, share the link, everyone picks a card,
reveal together.

- Cards: each room picks its own deck from `0 · 0,25 · 0,5 · 0,75 · 1 · 1,5 · 2 · 3 · 4 · 5 · 8 · 13 · ? · ☕`,
  defaulting to `0,25` through `5`. The deck is frozen once anyone has voted.
- No database, no accounts. Rooms live in memory and are disposable.
- Votes stay on the server until someone reveals — they are never sent to other browsers early.

## Running it

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173. The API runs on :3001 and Vite proxies to it.

To let the team join from their own machines, share your LAN address (`http://<your-ip>:5173`)
or put a tunnel in front of it.

## Production

```bash
pnpm build
pnpm start          # serves API + client on http://localhost:3001
```

One process serves everything, so the browser talks to a single origin.

| Variable      | Default     | Notes                                                        |
| ------------- | ----------- | ------------------------------------------------------------ |
| `PORT`        | `3001`      |                                                              |
| `NODE_ENV`    | –           | Set to `production` to serve the built client.               |
| `CORS_ORIGIN` | same-origin | Only needed if the client is served from a different origin. |

Behind a reverse proxy, pass the WebSocket upgrade headers through to the app.

## Deploying

Hosted on Render's free tier as a single container — the server serves the built client from
the same origin, so there is nothing to deploy separately. `render.yaml` describes the
service; Render builds the `Dockerfile` and redeploys on every push to `main`.

**The service sleeps after 15 minutes without traffic.** The next visitor wakes it, which
takes about a minute, and every open room is gone by then. That is survivable here because
rooms are disposable anyway — start a round by creating a room, not by expecting yesterday's
to still be there.

The free plan allows 750 instance-hours a month per workspace, which is roughly one service
running continuously. An external uptime pinger every ten minutes would therefore keep it
awake and still fit inside the allowance, at the cost of spending all of it on this one
service. Not set up, but it is the lever if the cold starts get annoying.

**There is no authentication.** Anyone who opens the URL sees every room and can join any of
them. The only thing protecting it is that the address is not published. Keep the GitHub
repo private, and do not put anything in a room name you would not want read aloud.

Two limits worth knowing before changing any of this:

- Rooms live in memory in the server process, so a restart — including every deploy — empties
  every table.
- For the same reason the app cannot run on more than one instance. Two would mean two
  disconnected sets of rooms; scaling out needs the socket.io Redis adapter and a shared room
  store first.

The health check uses `/healthz`, which reports the live room count.

## Checks

```bash
pnpm test          # domain rules, including the reveal gate
pnpm e2e           # the same rules through two real browsers
pnpm typecheck
pnpm lint
```

`pnpm test` is vitest over pure logic and is the fast loop. `pnpm e2e` is Playwright, and it
starts the dev server itself — it covers what one process cannot: that a vote never reaches
another browser before the reveal, that a refresh keeps your seat and your card, and that the
deck freezes once anyone has voted.

## Layout

```
shared/   wire protocol, the vote scale, vote summary  (imported by both sides)
server/   domain/ pure room rules · store/ in-memory rooms · socket/ event handlers
client/   features/lobby · features/room · features/identity · features/toast · components/ui
e2e/      Playwright specs for what needs two browsers
design/   the screens, as a Claude Design canvas
```

Two rules hold the design together: `server/src/domain/` never touches I/O, and
`server/src/domain/projection.ts` is the only place a vote value can reach a browser.
