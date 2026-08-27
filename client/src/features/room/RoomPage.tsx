import { useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useIdentity } from '../../hooks/useIdentity';
import { useRoom } from '../../hooks/useRoom';
import { RoomView } from './RoomView';
import { useRoundCelebration } from './useRoundCelebration';

export function RoomPage() {
  const { roomId = '' } = useParams();
  const navigate = useNavigate();
  const { identity } = useIdentity();
  const { state, closed, error, actions } = useRoom(roomId);
  const celebration = useRoundCelebration(state, roomId);

  // A room that has been collected takes the user back to the lobby.
  useEffect(() => {
    if (!closed) return;
    const timer = setTimeout(() => void navigate('/', { replace: true }), 2200);
    return () => clearTimeout(timer);
  }, [closed, navigate]);

  if (closed) {
    return (
      <Centered>
        <p className="text-title font-extrabold text-ink">{error ?? 'This room has closed.'}</p>
        <p className="mt-2 font-mono text-micro text-ink-muted uppercase">
          Taking you back to the lobby…
        </p>
      </Centered>
    );
  }

  if (!state) {
    return (
      <Centered>
        <p className="font-mono text-micro text-ink-muted uppercase">Taking a seat…</p>
      </Centered>
    );
  }

  return (
    <RoomView
      state={state}
      viewerId={identity.userId}
      celebration={celebration}
      onUpdateRoom={actions.updateRoom}
      onVote={actions.vote}
      onReveal={actions.reveal}
      onReset={actions.reset}
    />
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="grid min-h-dvh place-items-center px-6 text-center">{children}</div>;
}
