import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@contexts/ThemeContext';
import { AuthProvider } from '@features/auth';
import { SocketProvider } from '@services/socket';
import { env } from '@config/env';
import { router } from '@router/index';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider url={env.SOCKET_URL} debug={env.ENABLE_DEBUG}>
          <RouterProvider router={router} />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
