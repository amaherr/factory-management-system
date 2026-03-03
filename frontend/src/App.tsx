import { RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
        <Toaster />
      </NotificationProvider>
    </AuthProvider>
  );
}
