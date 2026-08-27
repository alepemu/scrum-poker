import { Navigate, Route, Routes } from 'react-router';
import { IdentityProvider } from './features/identity/IdentityProvider';
import { NameGate } from './features/identity/NameGate';
import { LobbyPage } from './features/lobby/LobbyPage';
import { RoomPage } from './features/room/RoomPage';
import { RoomPreview } from './features/room/preview/RoomPreview';
import { ConnectionToasts } from './features/toast/ConnectionToasts';
import { ToastProvider } from './features/toast/ToastProvider';

export function App() {
  return (
    // Outermost: renaming reports failures as toasts, so identity sits inside.
    <ToastProvider>
      <ConnectionToasts />

      <IdentityProvider>
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/preview" element={<RoomPreview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Nothing below this point ever sees an unnamed participant. */}
        <NameGate />
      </IdentityProvider>
    </ToastProvider>
  );
}
