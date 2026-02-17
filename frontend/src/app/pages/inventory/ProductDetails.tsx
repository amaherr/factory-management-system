import { useParams, Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Pencil } from 'lucide-react';
import { mockProducts } from '../../lib/mockData';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

export function ProductDetails() {
  const { id } = useParams();
  const product = mockProducts.find(p => p.id === id);

  if (!product) {
    return <div className="p-6">Product not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/products">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">{product.name}</h1>
            <p className="text-gray-500">Code: {product.code}</p>
          </div>
        </div>
        <Button asChild>
          <Link to={`/inventory/products/${id}/edit`}>
            <Pencil className="size-4 mr-2" />
            Edit Product
          </Link>
        </Button>
      </div>

      {/* Product Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageWithFallback
              src={product.images[0]}
              alt={product.name}
              className="w-full rounded-lg"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Product Name</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Product Code</p>
                <p className="font-medium">{product.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{product.category || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                  {product.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cost</p>
                <p className="font-medium">EGP {product.cost}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sale Price</p>
                <p className="font-medium">EGP {product.salePrice}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Stock</p>
                <p className="font-medium">{product.totalStock} units</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Variants</p>
                <p className="font-medium">{product.variants.length} variants</p>
              </div>
            </div>
            {product.description && (
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="mt-1">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="variants">
        <TabsList>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="stock">Stock Locations</TabsTrigger>
          <TabsTrigger value="history">Movement History</TabsTrigger>
        </TabsList>

        <TabsContent value="variants">
          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Production Year</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-medium">{variant.sku}</TableCell>
                      <TableCell>{variant.color}</TableCell>
                      <TableCell>{variant.productionYear}</TableCell>
                      <TableCell>{variant.season}</TableCell>
                      <TableCell>
                        {variant.stock < 50 ? (
                          <Badge variant="destructive">{variant.stock}</Badge>
                        ) : (
                          <span>{variant.stock}</span>
                        )}
                      </TableCell>
                      <TableCell>{variant.location || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{variant.status || 'N/A'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Stock by Location & Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Main Warehouse</TableCell>
                    <TableCell><Badge>Available</Badge></TableCell>
                    <TableCell>{product.totalStock}</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell className="font-medium">{product.totalStock}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="size-2 rounded-full bg-green-500 mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">Production In</p>
                    <p className="text-sm text-gray-500">+195 units from BATCH-2026-001</p>
                    <p className="text-xs text-gray-400 mt-1">Feb 10, 2026 at 5:00 PM</p>
                  </div>
                  <Badge>+195</Badge>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="size-2 rounded-full bg-red-500 mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">Sale Out</p>
                    <p className="text-sm text-gray-500">-3 units via INV-2026-001</p>
                    <p className="text-xs text-gray-400 mt-1">Feb 14, 2026 at 10:30 AM</p>
                  </div>
                  <Badge variant="destructive">-3</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
