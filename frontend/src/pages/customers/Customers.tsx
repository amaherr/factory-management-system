import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Search,
  Eye,
  Loader2,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { AddCustomerDialog } from '../../components/customers/AddCustomerDialog';
import { CustomerDetailsDialog } from '../../components/customers/CustomerDetailsDialog';
import { EditCustomerDialog } from '../../components/customers/EditCustomerDialog';
import { DeleteCustomerDialog } from '../../components/customers/DeleteCustomerDialog';
import { customerService, type Customer } from '../../services/customers';
import { toast } from 'sonner';

export function Customers() {
  const { t } = useTranslation('customers');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch customers
  const fetchCustomers = async (search: string = '', page: number = 1) => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers({
        search: search || undefined,
        page,
        limit,
      });

      setCustomers(data.customers);
      setTotal(data.total);
      setTotalPages(Math.max(1, data.pages));

      // If current page is no longer valid (e.g. after delete), automatically recover.
      if (data.pages > 0 && page > data.pages) {
        setCurrentPage(data.pages);
      }
    } catch (error: any) {
      toast.error(error.message || t('failed_to_load_customers'));
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data whenever search or page changes.
  useEffect(() => {
    fetchCustomers(debouncedSearch, currentPage);
  }, [debouncedSearch, currentPage]);

  const handleCustomerAdded = () => {
    setCurrentPage(1);
    fetchCustomers(debouncedSearch, 1);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setDeletingCustomer(customer);
    setDeleteOpen(true);
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c._id === updatedCustomer._id ? updatedCustomer : c)));
    fetchCustomers(debouncedSearch, currentPage);
  };

  const handleCustomerDeleted = () => {
    fetchCustomers(debouncedSearch, currentPage);
  };

  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('customers')}</h1>
          <p className="text-gray-500">{t('manage_customers')}</p>
        </div>
        <AddCustomerDialog onCustomerAdded={handleCustomerAdded} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t('search_placeholder')}
              className="h-9 rounded-md border-[--border-default] bg-[--bg-secondary] pl-9 pr-9 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[--primary-500]/30"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 text-muted-foreground hover:bg-black/5"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                aria-label={t('clear_search')}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('customer_name')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('company')}</TableHead>
                <TableHead>{t('city')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>{t('loading_customers')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t('no_customers_found')}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer._id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phoneNumber}</TableCell>
                    <TableCell>{customer.company || '-'}</TableCell>
                    <TableCell>{customer.address.city}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(customer)}
                          title={t('customer_details')}
                          className="text-black hover:bg-black/10"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                          title={t('edit_customer')}
                          className="text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer)}
                          title={t('delete_customer')}
                          className="text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            customer._id &&
                            navigate(`/customers/${customer._id}/history`, {
                              state: { customerName: customer.name },
                            })
                          }
                          title={t('show_history')}
                          className="gap-1"
                        >
                          <History className="size-4" />
                          {t('show_history')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && total > 0 && (
            <div className="border-t p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {t('pagination.showing', {
                  from,
                  to,
                  total,
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={loading || currentPage === 1}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  {t('pagination.previous')}
                </Button>
                <div className="flex items-center gap-2 px-3 py-1">
                  <span className="text-sm">
                    {t('pagination.page', {
                      current: currentPage,
                      total: totalPages,
                    })}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={loading || currentPage === totalPages}
                >
                  {t('pagination.next')}
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerDetailsDialog
        customer={selectedCustomer}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <EditCustomerDialog
        customer={editingCustomer}
        open={editOpen}
        onOpenChange={setEditOpen}
        onCustomerUpdated={handleCustomerUpdated}
      />

      <DeleteCustomerDialog
        customer={deletingCustomer}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onCustomerDeleted={handleCustomerDeleted}
      />
    </div>
  );
}
