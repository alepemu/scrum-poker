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

The whole app is one container: the server serves the built client from the same origin, so
there is nothing to host separately.

```bash
fly deploy
```

`fly.toml` keeps **one** machine running and scale-to-zero switched off, on purpose. Rooms
live in memory in the server process, so a stopped or restarted machine loses every open
room — that includes every deploy. Estimate between deploys, not during one.

For the same reason the app cannot be scaled past one machine as it stands. Two instances
would mean two disconnected sets of rooms; running more than one needs the socket.io Redis
adapter and a shared room store first.

There is no authentication: anyone who reaches the app sees the full room list and can join
any room. Put the deployment behind Cloudflare Access (or an equivalent) rather than relying
on the URL being hard to guess. Note that the `*.fly.dev` hostname stays reachable even once
Access covers your custom domain — close it by running `cloudflared` inside the machine and
releasing the public IPs, so Cloudflare is the only route in.

The checks in `fly.toml` use `/healthz`, which reports the live room count.

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
