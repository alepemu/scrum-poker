export type SeatLayout<T> = {
  top: T[];
  left: T[];
  right: T[];
  bottom: T[];
};

/** The ring holds three across the top and bottom and one either side. */
const MAX_TOP = 3;
const MAX_SIDE = 1;
const MAX_BOTTOM_BESIDE_VIEWER = 2;

/**
 * Seats people around the table with the viewer at the near edge. Places fill
 * top, sides, then either side of the viewer; past eight the top and bottom
 * rows grow rather than the table.
 */
export function arrangeSeats<T extends { userId: string }>(
  participants: readonly T[],
  viewerId: string,
): SeatLayout<T> {
  const viewer = participants.find((participant) => participant.userId === viewerId);
  const queue = participants.filter((participant) => participant.userId !== viewerId);

  const top: T[] = [];
  const right: T[] = [];
  const left: T[] = [];
  const beside: T[] = [];

  const fill = (row: T[], max: number) => {
    while (row.length < max) {
      const participant = queue.shift();
      if (!participant) return;
      row.push(participant);
    }
  };

  fill(top, MAX_TOP);
  fill(right, MAX_SIDE);
  fill(left, MAX_SIDE);
  fill(beside, MAX_BOTTOM_BESIDE_VIEWER);

  while (queue.length > 0) {
    fill(top, top.length + 1);
    fill(beside, beside.length + 1);
  }

  return { top, left, right, bottom: viewer ? seatViewerInMiddle(beside, viewer) : beside };
}

function seatViewerInMiddle<T>(row: readonly T[], viewer: T): T[] {
  const middle = Math.ceil(row.length / 2);
  return [...row.slice(0, middle), viewer, ...row.slice(middle)];
}

/**
 * Reveal order: the wave starts at your seat and runs out around the table, so
 * the stagger reads as motion rather than noise.
 */
export function revealOrder<T>(layout: SeatLayout<T>): T[] {
  return [...layout.bottom, ...layout.right, ...layout.top, ...layout.left];
}
