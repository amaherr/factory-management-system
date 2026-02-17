import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export function InventoryExport() {
  const [exportType, setExportType] = useState('inventory');
  const [format, setFormat] = useState('csv');

  const handleGenerateExport = () => {
    toast.success('Export generated successfully!');
  };

  const exportHistory = [
    { id: 1, name: 'inventory-snapshot-2026-02-16.csv', date: '2026-02-16 10:30 AM', filters: 'All products', size: '245 KB' },
    { id: 2, name: 'movement-log-jan-2026.xlsx', date: '2026-02-01 09:15 AM', filters: 'January 2026', size: '1.2 MB' },
    { id: 3, name: 'products-list-2026-01-28.csv', date: '2026-01-28 03:20 PM', filters: 'Active products only', size: '156 KB' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Inventory Export</h1>
        <p className="text-gray-500">Export inventory data to Excel or CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Export Type</Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventory Snapshot</SelectItem>
                  <SelectItem value="movements">Movement Log</SelectItem>
                  <SelectItem value="products">Products List</SelectItem>
                  <SelectItem value="batches">Batches Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleGenerateExport}>
              <Download className="size-4 mr-2" />
              Generate Export
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg space-y-2">
              <p className="font-medium">Export includes:</p>
              {exportType === 'inventory' && (
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Product name and code</li>
                  <li>All variants with SKU</li>
                  <li>Current stock levels</li>
                  <li>Location and status</li>
                  <li>Cost and sale price</li>
                </ul>
              )}
              {exportType === 'movements' && (
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Transaction timestamp</li>
                  <li>Transaction type</li>
                  <li>Product and variant details</li>
                  <li>Quantity changes</li>
                  <li>Reference and user</li>
                </ul>
              )}
              {exportType === 'products' && (
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Complete product catalog</li>
                  <li>Variant information</li>
                  <li>Pricing details</li>
                  <li>Stock summary</li>
                </ul>
              )}
              {exportType === 'batches' && (
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Batch number and status</li>
                  <li>Product details</li>
                  <li>Planned vs produced quantities</li>
                  <li>Loss tracking</li>
                  <li>Date information</li>
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Date Generated</TableHead>
                <TableHead>Filters Applied</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-green-600" />
                    {item.name}
                  </TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.filters}</Badge>
                  </TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      <Download className="size-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
