import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Plus, Search, Eye, Pencil, Trash2, X } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { getProductImageSrc } from '../../utils/imageUpload';
import { AddProductDialog } from '../../components/products/AddProductDialog';
import { EditProductDialog } from '../../components/products/EditProductDialog';
import { DeleteProductDialog } from '../../components/products/DeleteProductDialog';
import { ProductDetailsDialog } from '../../components/products/ProductDetailsDialog';
import { productService } from '../../services/products';
import type { Product } from '../../services/products';
import { COLORS_VALUES, SEASONS_VALUES, PRODUCT_STATUS } from '../../services/enums/product.enums';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../services/enums/user.enums';

export function ProductsList() {
  const { t } = useTranslation(['products', 'common']);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [colorFilter, setColorFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Check if user has admin/planner role to fetch all or just active
      const isAdmin = user?.roles?.includes(ROLES.ADMIN) || user?.roles?.includes(ROLES.PLANNING);
      const data = isAdmin
        ? await productService.getAllProducts()
        : await productService.getAllActiveProducts();
      setProducts(data);
    } catch (error) {
      toast.error(t('fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesColor = colorFilter === 'all' || product.color === colorFilter;
    const matchesSeason = seasonFilter === 'all' || product.season === seasonFilter;

    return matchesSearch && matchesStatus && matchesColor && matchesSeason;
  });

  const canEdit = user?.roles?.includes(ROLES.ADMIN) || user?.roles?.includes(ROLES.PLANNING);

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailsDialogOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleProductAdded = (product: Product) => {
    setProducts([...products, product]);
  };

  const handleProductUpdated = (product: Product) => {
    setProducts(products.map((p) => (p._id === product._id ? product : p)));
  };

  const handleProductDeleted = () => {
    if (selectedProduct) {
      setProducts(products.filter((p) => p._id !== selectedProduct._id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('products_models')}</h1>
          <p className="text-gray-500">{t('manage_products')}</p>
        </div>
        {canEdit && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            {t('add_product')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.6fr)_180px_180px_180px] md:items-center">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('search_products')}
                className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] pl-9 pr-9 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 text-muted-foreground hover:bg-black/5"
                  onClick={() => setSearchQuery('')}
                  title={t('clear_search')}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            <Select
              value={colorFilter}
              onValueChange={setColorFilter}
            >
              <SelectTrigger className="h-9 rounded-md">
                <SelectValue placeholder={t('color')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_colors')}</SelectItem>
                {COLORS_VALUES.map((color) => (
                  <SelectItem
                    key={color}
                    value={color}
                  >
                    {t(`color_${color}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={seasonFilter}
              onValueChange={setSeasonFilter}
            >
              <SelectTrigger className="h-9 rounded-md">
                <SelectValue placeholder={t('season')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_seasons')}</SelectItem>
                {SEASONS_VALUES.map((season) => (
                  <SelectItem
                    key={season}
                    value={season}
                  >
                    {t(`season_${season}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="h-9 rounded-md">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_status')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="deactive">{t('inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('image')}</TableHead>
                <TableHead>{t('product_name')}</TableHead>
                <TableHead>{t('product_code')}</TableHead>
                <TableHead>{t('color')}</TableHead>
                <TableHead>{t('cost_price')}</TableHead>
                <TableHead>{t('sale_price')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12"
                  >
                    <div className="text-gray-500">
                      <p className="font-medium">{t('loading')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12"
                  >
                    <div className="text-gray-500">
                      <p className="font-medium">{t('no_products_found')}</p>
                      <p className="text-sm mt-1">{t('no_matching_filters')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <ImageWithFallback
                        src={getProductImageSrc(product.defaultImage)}
                        alt={product.name}
                        className="size-12 rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{t(`color_${product.color}`)}</TableCell>
                    <TableCell>
                      {product.costPrice
                        ? new Intl.NumberFormat('en-EG', {
                            style: 'currency',
                            currency: 'EGP',
                          }).format(product.costPrice)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('en-EG', {
                        style: 'currency',
                        currency: 'EGP',
                      }).format(product.salePrice)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.status === PRODUCT_STATUS.ACTIVE ? 'default' : 'secondary'}
                      >
                        {t(
                          product.status === PRODUCT_STATUS.ACTIVE
                            ? 'active'
                            : product.status === PRODUCT_STATUS.PENDING
                              ? 'pending'
                              : 'inactive',
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(product)}
                          className="text-black hover:bg-black/10"
                          title={t('view_details')}
                        >
                          <Eye className="size-4" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(product)}
                              className="text-blue-700 hover:bg-blue-50"
                              title={t('edit_product')}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(product)}
                              className="text-red-700 hover:bg-red-50"
                              title={t('delete_product')}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleProductAdded}
      />
      <EditProductDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        product={selectedProduct}
        onSuccess={handleProductUpdated}
      />
      <DeleteProductDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={selectedProduct}
        onSuccess={handleProductDeleted}
      />
      <ProductDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        product={selectedProduct}
      />
    </div>
  );
}
