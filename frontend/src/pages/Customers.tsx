import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Search, Eye, Loader2, Pencil, Trash2 } from 'lucide-react';
import { AddCustomerDialog } from '../components/customers/AddCustomerDialog';
import { CustomerDetailsDialog } from '../components/customers/CustomerDetailsDialog';
import { EditCustomerDialog } from '../components/customers/EditCustomerDialog';
import { DeleteCustomerDialog } from '../components/customers/DeleteCustomerDialog';
import { customerService, type Customer } from '../services/customers';
import { toast } from 'sonner';

export function Customers() {
  const { t } = useTranslation('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Fetch customers
  const fetchCustomers = async (search: string = '') => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers(search || undefined);
      setCustomers(data);
    } catch (error: any) {
      toast.error(error.message || t('failed_to_load_customers'));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(searchQuery);
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
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
  };

  const handleCustomerDeleted = (deletedId: string) => {
    setCustomers((prev) => prev.filter((c) => c._id !== deletedId));
  };

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder={t('search_placeholder')}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
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
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
