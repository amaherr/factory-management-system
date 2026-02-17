import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ShoppingCart, Package, DollarSign, AlertTriangle, Factory } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router';

const salesData = [
  { date: 'Feb 10', sales: 4200, orders: 12 },
  { date: 'Feb 11', sales: 3800, orders: 10 },
  { date: 'Feb 12', sales: 5100, orders: 15 },
  { date: 'Feb 13', sales: 6200, orders: 18 },
  { date: 'Feb 14', sales: 5500, orders: 16 },
  { date: 'Feb 15', sales: 7100, orders: 21 },
  { date: 'Feb 16', sales: 4900, orders: 14 },
];

const topProducts = [
  { name: 'Classic T-Shirt', revenue: 12400, units: 103 },
  { name: 'Winter Jacket', revenue: 18900, units: 42 },
  { name: 'Denim Jeans', revenue: 8400, units: 30 },
  { name: 'Summer Dress', revenue: 6200, units: 25 },
];

const topCustomers = [
  { name: 'Mohamed Salem', spend: 22340, orders: 18 },
  { name: 'Ahmed Hassan', spend: 15420, orders: 12 },
  { name: 'Fatma Ali', spend: 8900, orders: 7 },
];

const recentActivity = [
  { type: 'sale', message: 'New sale to Ahmed Hassan', time: '2 hours ago', amount: 'EGP 378' },
  { type: 'batch', message: 'Batch BATCH-2026-002 in progress', time: '4 hours ago', amount: '45/100' },
  { type: 'return', message: 'Return processed for INV-2026-034', time: '5 hours ago', amount: '-3 units' },
  { type: 'issue', message: 'New issue: Damaged units in warehouse', time: '1 day ago', amount: 'High priority' },
];

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Overview of factory operations and analytics</p>
      </div>

      {/* Time Period Tabs */}
      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                <DollarSign className="size-4" style={{ color: 'var(--primary-500)' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">EGP 4,900</div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--success-main)' }}>+12.5%</span> from yesterday
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Orders Count</CardTitle>
                <ShoppingCart className="size-4" style={{ color: 'var(--primary-500)' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">14</div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>8 finalized, 6 draft</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
                <Package className="size-4" style={{ color: 'var(--primary-500)' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">42</div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Across all products</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                <TrendingUp className="size-4" style={{ color: 'var(--success-main)' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">EGP 2,340</div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>47.8% margin</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Low Stock SKUs</CardTitle>
                <AlertTriangle className="size-4" style={{ color: 'var(--warning-main)' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">3</div>
                <Button variant="link" className="p-0 h-auto text-xs mt-1" asChild>
                  <Link to="/inventory/stock?lowStock=true">View items</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                <AlertTriangle className="size-4" style={{ color: 'var(--error-main)' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">2</div>
                <Button variant="link" className="p-0 h-auto text-xs mt-1" asChild>
                  <Link to="/issues?status=open">View issues</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Batches in Progress</CardTitle>
                <Factory className="size-4" style={{ color: 'var(--accent-500)' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">1</div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>2 completed this week</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="week" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Week's Sales</CardTitle>
                <DollarSign className="size-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">EGP 36,800</div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-green-600">+8.2%</span> from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Orders Count</CardTitle>
                <ShoppingCart className="size-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">102</div>
                <p className="text-xs text-gray-500 mt-1">87 finalized, 15 draft</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
                <Package className="size-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">324</div>
                <p className="text-xs text-gray-500 mt-1">Across all products</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                <TrendingUp className="size-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">EGP 17,640</div>
                <p className="text-xs text-gray-500 mt-1">47.9% margin</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="month" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Month's Sales</CardTitle>
                <DollarSign className="size-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">EGP 156,200</div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-green-600">+15.3%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Orders Count</CardTitle>
                <ShoppingCart className="size-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">428</div>
                <p className="text-xs text-gray-500 mt-1">389 finalized, 39 draft</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
                <Package className="size-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">1,342</div>
                <p className="text-xs text-gray-500 mt-1">Across all products</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                <TrendingUp className="size-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">EGP 74,816</div>
                <p className="text-xs text-gray-500 mt-1">47.9% margin</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Last 7 days revenue and order count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" />
                <YAxis yAxisId="left" stroke="var(--text-muted)" />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="sales" stroke="var(--chart-blue)" strokeWidth={2} name="Sales (EGP)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="var(--chart-green)" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
            <CardDescription>This month's best sellers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="var(--chart-orange)" name="Revenue (EGP)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.map((customer, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">EGP {customer.spend.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" className="w-full mt-4" asChild>
              <Link to="/customers">View all customers</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="size-2 rounded-full mt-2" style={{ backgroundColor: 'var(--info-main)' }} />
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{activity.time}</span>
                      <Badge variant="info" className="text-xs">{activity.amount}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
          <CardDescription>Items requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--warning-bg)' }}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5" style={{ color: 'var(--warning-main)' }} />
                <div>
                  <p className="font-medium">Denim Jeans - Blue</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Only 8 units remaining</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/inventory/products/p3">View</Link>
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--warning-bg)' }}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5" style={{ color: 'var(--warning-main)' }} />
                <div>
                  <p className="font-medium">Classic T-Shirt - Navy</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Only 40 units remaining</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/inventory/products/p1">View</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}