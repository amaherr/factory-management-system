import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProductsList } from './pages/inventory/ProductsList';
import { ProductDetails } from './pages/inventory/ProductDetails';
import { StockOverview } from './pages/inventory/StockOverview';
import { TransactionsLog } from './pages/inventory/TransactionsLog';
import { BatchesList } from './pages/inventory/BatchesList';
import { InventoryExport } from './pages/inventory/InventoryExport';
import { NewSale } from './pages/pos/NewSale';
import { OrdersList } from './pages/pos/OrdersList';
import { InvoicesList } from './pages/pos/InvoicesList';
import { ReturnsAdjustments } from './pages/pos/ReturnsAdjustments';
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
        path: 'inventory/products/:id',
        element: <ProductDetails />,
      },
      {
        path: 'inventory/stock',
        element: <StockOverview />,
      },
      {
        path: 'inventory/transactions',
        element: <TransactionsLog />,
      },
      {
        path: 'inventory/batches',
        element: <BatchesList />,
      },
      {
        path: 'inventory/export',
        element: <InventoryExport />,
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
        element: <ReturnsAdjustments />,
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
