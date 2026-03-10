import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProductsList } from './pages/inventory/ProductsList';
import { StockOverview } from './pages/inventory/StockOverview';
import { StockMovementPage } from './pages/inventory/StockMovement';
import { Export } from './pages/Export';
import { BatchesList } from './pages/production/BatchesList';
import { NewSale } from './pages/pos/NewSale';
import { OrdersList } from './pages/pos/OrdersList';
import { InvoicesList } from './pages/pos/InvoicesList';
import { Returns } from './pages/pos/Returns';
import { Customers } from './pages/Customers';
import { Issues } from './pages/Issues';
import { Notifications } from './pages/Notifications';
import { UsersManagement } from './pages/UsersManagement';

import { useAuth } from './contexts/AuthContext';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <>{children}</>;
}

// Not Found component
function NotFound() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold">404 - Page Not Found</h1>
      <p className="text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'inventory/products',
        element: <ProductsList />,
      },
      {
        path: 'inventory/stock',
        element: <StockOverview />,
      },
      {
        path: 'inventory/movements',
        element: <StockMovementPage />,
      },
      {
        path: 'export',
        element: <Export />,
      },
      {
        path: 'production/batches',
        element: <BatchesList />,
      },
      {
        path: 'pos/new',
        element: <NewSale />,
      },
      {
        path: 'pos/orders',
        element: <OrdersList />,
      },
      {
        path: 'pos/invoices',
        element: <InvoicesList />,
      },
      {
        path: 'pos/returns',
        element: <Returns />,
      },
      {
        path: 'customers',
        element: <Customers />,
      },
      {
        path: 'issues',
        element: <Issues />,
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
      {
        path: 'users',
        element: <UsersManagement />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
