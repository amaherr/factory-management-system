// Mock data for the factory system

export interface Product {
  id: string;
  name: string;
  code: string;
  category?: string;
  description?: string;
  cost: number;
  salePrice: number;
  status: 'active' | 'archived';
  images: string[];
  totalStock: number;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  color: string;
  productionYear: number;
  season: string;
  sku: string;
  stock: number;
  location?: string;
  status?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalSpend: number;
  ordersCount: number;
  lastPurchase: string;
  tags?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  type: 'on-shelf' | 'on-demand';
  status: 'draft' | 'finalized' | 'cancelled' | 'returned';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  createdDate: string;
  finalizedDate?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantDetails: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  customerName: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'issued' | 'edited' | 'voided';
}

export interface Batch {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  variantId: string;
  variantDetails: string;
  plannedQty: number;
  producedQty: number;
  lossQty: number;
  status: 'planning' | 'in-progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface InventoryTransaction {
  id: string;
  timestamp: string;
  type: 'production-in' | 'sale-out' | 'return-in' | 'adjustment' | 'transfer' | 'loss' | 'invoice-edit' | 'batch-finalization';
  productId: string;
  productName: string;
  variantId: string;
  variantDetails: string;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  fromStatus?: string;
  toStatus?: string;
  reference?: string;
  referenceType?: string;
  performedBy: string;
  notes?: string;
}

export interface Issue {
  id: string;
  issueNumber: string;
  title: string;
  type: 'inventory' | 'damaged-goods' | 'system-bug' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  description: string;
  linkedEntity?: {
    type: 'product' | 'batch' | 'order' | 'invoice';
    id: string;
    name: string;
  };
  createdBy: string;
  assignedTo?: string;
  createdDate: string;
  updatedDate: string;
  resolution?: string;
}

export interface Notification {
  id: string;
  type: 'issue' | 'batch' | 'inventory' | 'invoice';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

// Mock Products
export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Classic T-Shirt',
    code: 'TSH-001',
    category: 'Apparel',
    description: 'Comfortable cotton t-shirt',
    cost: 50,
    salePrice: 120,
    status: 'active',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'],
    totalStock: 245,
    variants: [
      { id: 'v1', productId: 'p1', color: 'White', productionYear: 2024, season: 'Summer', sku: 'TSH-001-WHT-24-SUM', stock: 120, location: 'Main', status: 'Available' },
      { id: 'v2', productId: 'p1', color: 'Black', productionYear: 2024, season: 'Summer', sku: 'TSH-001-BLK-24-SUM', stock: 85, location: 'Main', status: 'Available' },
      { id: 'v3', productId: 'p1', color: 'Navy', productionYear: 2024, season: 'Summer', sku: 'TSH-001-NVY-24-SUM', stock: 40, location: 'Main', status: 'Available' },
    ],
  },
  {
    id: 'p2',
    name: 'Winter Jacket',
    code: 'JKT-002',
    category: 'Outerwear',
    description: 'Warm winter jacket',
    cost: 200,
    salePrice: 450,
    status: 'active',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5'],
    totalStock: 78,
    variants: [
      { id: 'v4', productId: 'p2', color: 'Black', productionYear: 2024, season: 'Winter', sku: 'JKT-002-BLK-24-WIN', stock: 45, location: 'Main', status: 'Available' },
      { id: 'v5', productId: 'p2', color: 'Gray', productionYear: 2024, season: 'Winter', sku: 'JKT-002-GRY-24-WIN', stock: 33, location: 'Main', status: 'Available' },
    ],
  },
  {
    id: 'p3',
    name: 'Denim Jeans',
    code: 'JNS-003',
    category: 'Bottoms',
    description: 'Classic fit denim jeans',
    cost: 120,
    salePrice: 280,
    status: 'active',
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d'],
    totalStock: 15,
    variants: [
      { id: 'v6', productId: 'p3', color: 'Blue', productionYear: 2024, season: 'All Season', sku: 'JNS-003-BLU-24-ALL', stock: 8, location: 'Main', status: 'Available' },
      { id: 'v7', productId: 'p3', color: 'Black', productionYear: 2024, season: 'All Season', sku: 'JNS-003-BLK-24-ALL', stock: 7, location: 'Main', status: 'Available' },
    ],
  },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Ahmed Hassan',
    phone: '+20 123 456 7890',
    email: 'ahmed@example.com',
    totalSpend: 15420,
    ordersCount: 12,
    lastPurchase: '2026-02-14T10:30:00Z',
    tags: ['VIP', 'Frequent'],
  },
  {
    id: 'c2',
    name: 'Fatma Ali',
    phone: '+20 100 222 3333',
    email: 'fatma@example.com',
    totalSpend: 8900,
    ordersCount: 7,
    lastPurchase: '2026-02-10T15:20:00Z',
  },
  {
    id: 'c3',
    name: 'Mohamed Salem',
    phone: '+20 111 444 5555',
    email: 'mohamed@example.com',
    totalSpend: 22340,
    ordersCount: 18,
    lastPurchase: '2026-02-15T09:15:00Z',
    tags: ['VIP'],
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'o1',
    orderNumber: 'ORD-2026-001',
    customerId: 'c1',
    customerName: 'Ahmed Hassan',
    type: 'on-shelf',
    status: 'finalized',
    items: [
      { id: 'oi1', productId: 'p1', productName: 'Classic T-Shirt', variantId: 'v1', variantDetails: 'White, 2024, Summer', quantity: 3, unitPrice: 120, total: 360 },
    ],
    subtotal: 360,
    discount: 0,
    tax: 18,
    total: 378,
    createdDate: '2026-02-14T10:00:00Z',
    finalizedDate: '2026-02-14T10:30:00Z',
  },
  {
    id: 'o2',
    orderNumber: 'ORD-2026-002',
    customerId: 'c3',
    customerName: 'Mohamed Salem',
    type: 'on-demand',
    status: 'draft',
    items: [
      { id: 'oi2', productId: 'p2', productName: 'Winter Jacket', variantId: 'v4', variantDetails: 'Black, 2024, Winter', quantity: 5, unitPrice: 450, total: 2250 },
    ],
    subtotal: 2250,
    discount: 100,
    tax: 107.5,
    total: 2257.5,
    notes: 'Customer requested bulk order',
    createdDate: '2026-02-15T09:00:00Z',
  },
];

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-2026-001',
    orderId: 'o1',
    customerId: 'c1',
    customerName: 'Ahmed Hassan',
    date: '2026-02-14T10:30:00Z',
    items: [
      { id: 'oi1', productId: 'p1', productName: 'Classic T-Shirt', variantId: 'v1', variantDetails: 'White, 2024, Summer', quantity: 3, unitPrice: 120, total: 360 },
    ],
    subtotal: 360,
    discount: 0,
    tax: 18,
    total: 378,
    status: 'issued',
  },
];

// Mock Batches
export const mockBatches: Batch[] = [
  {
    id: 'b1',
    batchNumber: 'BATCH-2026-001',
    productId: 'p1',
    productName: 'Classic T-Shirt',
    variantId: 'v1',
    variantDetails: 'White, 2024, Summer',
    plannedQty: 200,
    producedQty: 195,
    lossQty: 5,
    status: 'completed',
    startDate: '2026-02-01T08:00:00Z',
    endDate: '2026-02-10T17:00:00Z',
  },
  {
    id: 'b2',
    batchNumber: 'BATCH-2026-002',
    productId: 'p2',
    productName: 'Winter Jacket',
    variantId: 'v4',
    variantDetails: 'Black, 2024, Winter',
    plannedQty: 100,
    producedQty: 45,
    lossQty: 2,
    status: 'in-progress',
    startDate: '2026-02-12T08:00:00Z',
  },
  {
    id: 'b3',
    batchNumber: 'BATCH-2026-003',
    productId: 'p3',
    productName: 'Denim Jeans',
    variantId: 'v6',
    variantDetails: 'Blue, 2024, All Season',
    plannedQty: 150,
    producedQty: 0,
    lossQty: 0,
    status: 'planning',
    startDate: '2026-02-20T08:00:00Z',
  },
];

// Mock Transactions
export const mockTransactions: InventoryTransaction[] = [
  {
    id: 't1',
    timestamp: '2026-02-14T10:30:00Z',
    type: 'sale-out',
    productId: 'p1',
    productName: 'Classic T-Shirt',
    variantId: 'v1',
    variantDetails: 'White, 2024, Summer',
    quantity: -3,
    fromLocation: 'Main',
    toLocation: 'Sold',
    fromStatus: 'Available',
    toStatus: 'Sold',
    reference: 'INV-2026-001',
    referenceType: 'invoice',
    performedBy: 'Sales User',
    notes: 'Regular sale',
  },
  {
    id: 't2',
    timestamp: '2026-02-10T17:00:00Z',
    type: 'batch-finalization',
    productId: 'p1',
    productName: 'Classic T-Shirt',
    variantId: 'v1',
    variantDetails: 'White, 2024, Summer',
    quantity: 195,
    toLocation: 'Main',
    toStatus: 'Available',
    reference: 'BATCH-2026-001',
    referenceType: 'batch',
    performedBy: 'Production Manager',
    notes: 'Batch completed with 5 units loss',
  },
];

// Mock Issues
export const mockIssues: Issue[] = [
  {
    id: 'iss1',
    issueNumber: 'ISS-001',
    title: 'Damaged units in warehouse',
    type: 'damaged-goods',
    priority: 'high',
    status: 'open',
    description: 'Found 5 damaged t-shirts during inventory check',
    linkedEntity: { type: 'product', id: 'p1', name: 'Classic T-Shirt' },
    createdBy: 'Inventory Manager',
    assignedTo: 'Admin User',
    createdDate: '2026-02-15T14:00:00Z',
    updatedDate: '2026-02-15T14:00:00Z',
  },
  {
    id: 'iss2',
    issueNumber: 'ISS-002',
    title: 'Low stock alert - Denim Jeans',
    type: 'inventory',
    priority: 'medium',
    status: 'in-progress',
    description: 'Stock below minimum threshold',
    linkedEntity: { type: 'product', id: 'p3', name: 'Denim Jeans' },
    createdBy: 'System',
    assignedTo: 'Inventory Manager',
    createdDate: '2026-02-13T09:00:00Z',
    updatedDate: '2026-02-14T10:00:00Z',
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'issue',
    title: 'New Issue Assigned',
    message: 'You have been assigned to ISS-001: Damaged units in warehouse',
    timestamp: '2026-02-15T14:00:00Z',
    read: false,
    link: '/issues/iss1',
  },
  {
    id: 'n2',
    type: 'batch',
    title: 'Batch Completed',
    message: 'BATCH-2026-001 has been completed with 195 units produced',
    timestamp: '2026-02-10T17:00:00Z',
    read: false,
    link: '/batches/b1',
  },
  {
    id: 'n3',
    type: 'inventory',
    title: 'Low Stock Alert',
    message: 'Denim Jeans stock is below minimum threshold (15 units)',
    timestamp: '2026-02-13T09:00:00Z',
    read: true,
    link: '/inventory/stock',
  },
];
