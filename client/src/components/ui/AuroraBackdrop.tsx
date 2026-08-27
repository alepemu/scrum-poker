import { cn } from '../../lib/cn';

/**
 * Ambient lighting behind a page: two soft gradients drifting on long, mismatched
 * cycles. Measured at 60fps with no dropped frames on a phone at 6x CPU throttle,
 * because nothing here paints per frame — the orbs are `transform`-animated and
 * their softness comes from the gradient rather than a `filter: blur()`, which
 * costs roughly half the frame rate.
 *
 * `overflow-hidden` is load-bearing: the orbs are wider than the viewport, and
 * the lobby is not otherwise clipped, so without it the page grows a scrollbar.
 *
 * Both the animation and the layer promotion sit behind `motion-safe`, so a
 * reduced-motion visitor keeps the lighting as a static wash and the browser is
 * never asked to promote a layer that will not move.
 */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <span className="absolute -top-[24vmax] -left-[18vmax] size-[68vmax] rounded-full aurora-a motion-safe:animate-drift-a motion-safe:will-change-transform" />
      <span className="absolute -right-[20vmax] -bottom-[26vmax] size-[68vmax] rounded-full aurora-b motion-safe:animate-drift-b motion-safe:will-change-transform" />
    </div>
  );
}
