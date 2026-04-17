import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ProductsList } from './pages/inventory/ProductsList';
import { StockOverview } from './pages/inventory/StockOverview';
import { StockMovementPage } from './pages/inventory/StockMovement';
import { WarehouseManagementPage } from './pages/inventory/WarehouseManagement';
import { Export } from './pages/Export';
import { ExecutiveDashboard } from './pages/dashboards/ExecutiveDashboard';
import { SalesDashboard } from './pages/dashboards/SalesDashboard';
import { ProductionDashboard } from './pages/dashboards/ProductionDashboard';
import { InventoryDashboard } from './pages/dashboards/InventoryDashboard';
import { OperationsDashboard } from './pages/dashboards/OperationsDashboard';
import { BatchesList } from './pages/production/BatchesList';
import { NewSale } from './pages/pos/NewSale';
import { OrdersList } from './pages/pos/OrdersList';
import { Returns } from './pages/pos/Returns';
import { Customers } from './pages/customers/Customers';
import { CustomerHistory } from './pages/customers/CustomerHistory';
import { Issues } from './pages/Issues';
import { Notifications } from './pages/Notifications';
import { UsersManagement } from './pages/UsersManagement';

import { useAuth } from './contexts/AuthContext';
import { getFilteredNavigation } from './lib/permissions';

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

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const navigation = getFilteredNavigation(user.roles);

  const firstAccessiblePath = navigation.reduce<string | null>((foundPath, item) => {
    if (foundPath) return foundPath;
    if (item.children?.length) return item.children[0].path;
    return item.path;
  }, null);

  return (
    <Navigate
      to={firstAccessiblePath || '/notifications'}
      replace
    />
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
        element: <HomeRedirect />,
      },
      {
        path: 'dashboards/executive',
        element: <ExecutiveDashboard />,
      },
      {
        path: 'dashboards/sales',
        element: <SalesDashboard />,
      },
      {
        path: 'dashboards/production',
        element: <ProductionDashboard />,
      },
      {
        path: 'dashboards/inventory',
        element: <InventoryDashboard />,
      },
      {
        path: 'dashboards/operations',
        element: <OperationsDashboard />,
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
        path: 'inventory/warehouse',
        element: <WarehouseManagementPage />,
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
        path: 'pos/returns',
        element: <Returns />,
      },
      {
        path: 'customers',
        element: <Customers />,
      },
      {
        path: 'customers/:customerId/history',
        element: <CustomerHistory />,
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
