# Round celebrations

Drop image files into these folders. Nothing else is needed — they are picked up
by `import.meta.glob` in `features/room/celebrations.ts`, so there is no import
list to maintain and no code to change.

| Folder       | Plays when                                      |
| ------------ | ----------------------------------------------- |
| `consensus/` | Everyone who voted picked the same value.       |
| `scattered/` | No two votes agree, with at least three voters. |

One file is picked at random each time, never the same one twice in a row.

## What to put here

Recognised extensions: `.gif`, `.webp`, `.png`, `.apng`.

**Prefer animated WebP over GIF** — same picture, 5–10x smaller, and every
browser we care about supports it. Most converters will do it in one step
(`ffmpeg -i in.gif -c:v libwebp -loop 0 out.webp`).

Aim for roughly 240x240 and under ~500 KB each. They are bundled into the
build, so anything larger is paid for on every first page load.

## While the folders are empty

The feature still runs: with no files to choose from, the overlay falls back to
a small burst of dots so the moment is not silent. That fallback is a stand-in,
not the intended effect — add real files.
