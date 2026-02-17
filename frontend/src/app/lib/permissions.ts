import type { UserRole } from '../contexts/AuthContext';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
  children?: NavItem[];
}

export const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: 'LayoutDashboard',
    roles: ['Admin', 'Sales', 'Inventory', 'Accounting', 'Planning'],
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: 'Package',
    roles: ['Admin', 'Inventory', 'Planning', 'Sales'],
    children: [
      {
        label: 'Products & Models',
        path: '/inventory/products',
        icon: 'Box',
        roles: ['Admin', 'Inventory', 'Planning', 'Sales'],
      },
      {
        label: 'Stock Overview',
        path: '/inventory/stock',
        icon: 'Boxes',
        roles: ['Admin', 'Inventory', 'Planning', 'Sales'],
      },
      {
        label: 'Transactions Log',
        path: '/inventory/transactions',
        icon: 'History',
        roles: ['Admin', 'Inventory'],
      },
      {
        label: 'Batches & Production',
        path: '/inventory/batches',
        icon: 'Factory',
        roles: ['Admin', 'Inventory', 'Planning'],
      },
      {
        label: 'Export',
        path: '/inventory/export',
        icon: 'Download',
        roles: ['Admin', 'Inventory'],
      },
    ],
  },
  {
    label: 'POS',
    path: '/pos',
    icon: 'ShoppingCart',
    roles: ['Admin', 'Sales'],
    children: [
      {
        label: 'New Sale',
        path: '/pos/new',
        icon: 'Plus',
        roles: ['Admin', 'Sales'],
      },
      {
        label: 'Orders',
        path: '/pos/orders',
        icon: 'FileText',
        roles: ['Admin', 'Sales', 'Accounting'],
      },
      {
        label: 'Invoices',
        path: '/pos/invoices',
        icon: 'Receipt',
        roles: ['Admin', 'Sales', 'Accounting'],
      },
      {
        label: 'Returns / Adjustments',
        path: '/pos/returns',
        icon: 'Undo',
        roles: ['Admin', 'Sales', 'Inventory'],
      },
    ],
  },
  {
    label: 'Customers',
    path: '/customers',
    icon: 'Users',
    roles: ['Admin', 'Sales'],
  },
  {
    label: 'Issues',
    path: '/issues',
    icon: 'AlertCircle',
    roles: ['Admin', 'Sales', 'Inventory', 'Accounting', 'Planning'],
  },
  {
    label: 'Notifications',
    path: '/notifications',
    icon: 'Bell',
    roles: ['Admin', 'Sales', 'Inventory', 'Accounting', 'Planning'],
  },
  {
    label: 'Admin',
    path: '/admin',
    icon: 'Settings',
    roles: ['Admin'],
    children: [
      {
        label: 'Users & Roles',
        path: '/admin/users',
        icon: 'UserCog',
        roles: ['Admin'],
      },
      {
        label: 'System Settings',
        path: '/admin/settings',
        icon: 'Sliders',
        roles: ['Admin'],
      },
    ],
  },
];

export function hasAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function getFilteredNavigation(userRole: UserRole): NavItem[] {
  return navigationItems
    .filter(item => hasAccess(userRole, item.roles))
    .map(item => ({
      ...item,
      children: item.children?.filter(child => hasAccess(userRole, child.roles)),
    }));
}
