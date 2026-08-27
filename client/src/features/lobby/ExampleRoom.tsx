import { Link } from 'react-router';
import { cn } from '../../lib/cn';

/**
 * A permanent, self-contained table anyone can poke at — nobody else is in it,
 * so it is somewhere to see how a round works without disturbing a real room.
 */
export function ExampleRoom({ className }: { className?: string }) {
  return (
    <Link
      to="/preview"
      className={cn(
        'group flex items-center justify-between gap-4 rounded-panel border border-dashed border-line-dashed px-5 py-4.5 hover:border-accent-450 hover:bg-accent-tint motion-safe:transition-colors motion-safe:duration-200',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">Example room</p>
        <p className="mt-0.5 font-mono text-nano text-ink-muted uppercase">
          Try it out — just for you
        </p>
      </div>

      <span className="shrink-0 font-mono text-nano text-accent-400 uppercase opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
        Open →
      </span>
    </Link>
  );
}
