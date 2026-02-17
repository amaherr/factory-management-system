import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Search, AlertTriangle, History } from 'lucide-react';
import { mockProducts } from '../../lib/mockData';

export function StockOverview() {
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const allVariants = mockProducts.flatMap(product =>
    product.variants.map(variant => ({
      ...variant,
      productName: product.name,
      productCode: product.code,
    }))
  );

  const filteredVariants = allVariants.filter(variant => {
    const matchesSearch = variant.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         variant.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         variant.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = !lowStockOnly || variant.stock < 50;
    return matchesSearch && matchesLowStock;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Stock Overview</h1>
        <p className="text-gray-500">Real-time inventory levels and locations</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search by product name, code, or SKU..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="low-stock"
                checked={lowStockOnly}
                onCheckedChange={setLowStockOnly}
              />
              <Label htmlFor="low-stock">Low stock only ({"<50"})</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product / Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVariants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{variant.productName}</p>
                      <p className="text-sm text-gray-500">
                        {variant.color}, {variant.productionYear}, {variant.season}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                  <TableCell>{variant.location || 'Main'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{variant.status || 'Available'}</Badge>
                  </TableCell>
                  <TableCell>
                    {variant.stock < 50 ? (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 text-orange-500" />
                        <Badge variant="destructive">{variant.stock}</Badge>
                      </div>
                    ) : (
                      <span>{variant.stock}</span>
                    )}
                  </TableCell>
                  <TableCell>0</TableCell>
                  <TableCell className="font-medium">{variant.stock}</TableCell>
                  <TableCell className="text-sm text-gray-500">Today</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Adjust
                      </Button>
                      <Button variant="ghost" size="sm">
                        <History className="size-4" />
                      </Button>
                    </div>
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
