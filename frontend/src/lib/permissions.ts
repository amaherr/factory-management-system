import type { UserRole } from '../services/enums/user.enums';
import { ROLES } from '../services/enums/user.enums';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
  children?: NavItem[];
}

export const navigationItems: NavItem[] = [
  {
    label: 'Dashboards',
    path: '/dashboards',
    icon: 'BarChart3',
    roles: [ROLES.ADMIN],
    children: [
      {
        label: 'Executive Dashboard',
        path: '/dashboards/executive',
        icon: 'LayoutDashboard',
        roles: [ROLES.ADMIN],
      },
      {
        label: 'Sales Dashboard',
        path: '/dashboards/sales',
        icon: 'TrendingUp',
        roles: [ROLES.ADMIN],
      },
      {
        label: 'Production Dashboard',
        path: '/dashboards/production',
        icon: 'Factory',
        roles: [ROLES.ADMIN],
      },
      {
        label: 'Inventory Dashboard',
        path: '/dashboards/inventory',
        icon: 'Package',
        roles: [ROLES.ADMIN],
      },
      {
        label: 'Operations Dashboard',
        path: '/dashboards/operations',
        icon: 'ShieldAlert',
        roles: [ROLES.ADMIN],
      },
    ],
  },
  {
    label: 'Production',
    path: '/production',
    icon: 'Factory',
    roles: [ROLES.ADMIN, ROLES.PLANNING, ROLES.INVENTORY],
    children: [
      {
        label: 'Batches',
        path: '/production/batches',
        icon: 'Boxes',
        roles: [ROLES.ADMIN, ROLES.PLANNING, ROLES.INVENTORY],
      },
    ],
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: 'Package',
    roles: [ROLES.ADMIN, ROLES.INVENTORY, ROLES.PLANNING, ROLES.SALES],
    children: [
      {
        label: 'Products & Models',
        path: '/inventory/products',
        icon: 'Box',
        roles: [ROLES.ADMIN, ROLES.INVENTORY, ROLES.PLANNING, ROLES.SALES],
      },
      {
        label: 'Stock Overview',
        path: '/inventory/stock',
        icon: 'Boxes',
        roles: [ROLES.ADMIN, ROLES.INVENTORY, ROLES.PLANNING, ROLES.SALES],
      },
      {
        label: 'Stock Movements',
        path: '/inventory/movements',
        icon: 'History',
        roles: [ROLES.ADMIN, ROLES.INVENTORY, ROLES.ACCOUNTING],
      },
    ],
  },
  {
    label: 'POS',
    path: '/pos',
    icon: 'ShoppingCart',
    roles: [ROLES.ADMIN, ROLES.SALES],
    children: [
      {
        label: 'New Sale',
        path: '/pos/new',
        icon: 'Plus',
        roles: [ROLES.ADMIN, ROLES.SALES],
      },
      {
        label: 'Orders',
        path: '/pos/orders',
        icon: 'FileText',
        roles: [ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING],
      },
      {
        label: 'Returns',
        path: '/pos/returns',
        icon: 'Undo',
        roles: [ROLES.ADMIN, ROLES.SALES],
      },
    ],
  },
  {
    label: 'Customers',
    path: '/customers',
    icon: 'Users',
    roles: [ROLES.ADMIN, ROLES.SALES],
  },
  {
    label: 'Issues',
    path: '/issues',
    icon: 'AlertCircle',
    roles: [ROLES.ADMIN, ROLES.SALES, ROLES.INVENTORY, ROLES.ACCOUNTING, ROLES.PLANNING],
  },
  {
    label: 'User Management',
    path: '/users',
    icon: 'UserCog',
    roles: [ROLES.ADMIN],
  },
  {
    label: 'Export',
    path: '/export',
    icon: 'Download',
    roles: [ROLES.ADMIN],
  },
];

export function hasAccess(userRoles: UserRole[], allowedRoles: UserRole[]): boolean {
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function getFilteredNavigation(userRoles: UserRole[]): NavItem[] {
  return navigationItems
    .filter((item) => hasAccess(userRoles, item.roles))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => hasAccess(userRoles, child.roles)),
    }));
}
