import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Search, Eye, Loader2, Pencil, Ban, Shield, Trash2 } from 'lucide-react';
import { AddUserDialog } from '../../components/users/AddUserDialog';
import { UserDetailsDialog } from '../../components/users/UserDetailsDialog';
import { EditUserDialog } from '../../components/users/EditUserDialog';
import { ToggleUserStatusDialog } from '../../components/users/ToggleUserStatusDialog';
import { DeleteUserDialog } from '../../components/users/DeleteUserDialog';
import { userService, type User } from '../../services/users';
import { ROLES } from '../../services/enums/user.enums';
import { toast } from 'sonner';

export function UsersManagement() {
  const { t } = useTranslation('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toggleStatusUser, setToggleStatusUser] = useState<User | null>(null);
  const [toggleStatusOpen, setToggleStatusOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || t('failed_to_load_users'));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter as any);
    return matchesSearch && matchesRole;
  });

  const handleUserAdded = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    setToggleStatusUser(user);
    setToggleStatusOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setDeleteOpen(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
  };

  const handleStatusChanged = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
  };

  const handleUserDeleted = (deletedId: string) => {
    setUsers((prev) => prev.filter((u) => u._id !== deletedId));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('users_management')}</h1>
          <p className="text-gray-500">{t('manage_users')}</p>
        </div>
        <AddUserDialog onUserAdded={handleUserAdded} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('filter_by_role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_roles')}</SelectItem>
                <SelectItem value={ROLES.ADMIN}>{t('role_admin')}</SelectItem>
                <SelectItem value={ROLES.SALES}>{t('role_sales')}</SelectItem>
                <SelectItem value={ROLES.INVENTORY}>{t('role_inventory')}</SelectItem>
                <SelectItem value={ROLES.PLANNING}>{t('role_planning')}</SelectItem>
                <SelectItem value={ROLES.ACCOUNTING}>{t('role_accounting')}</SelectItem>
                <SelectItem value={ROLES.PRODUCTION}>{t('role_production')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('phone_number')}</TableHead>
                <TableHead>{t('roles')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('last_login')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>{t('loading_users')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t('no_users_found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.slice(0, 2).map((role) => (
                          <Badge
                            key={role}
                            variant="secondary"
                            className="text-xs"
                          >
                            {t(`role_${role}`)}
                          </Badge>
                        ))}
                        {user.roles.length > 2 && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            +{user.roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? t('active') : t('inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : t('never')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(user)}
                          title={t('user_details')}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          title={t('edit_user')}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                          title={user.isActive ? t('deactivate') : t('activate')}
                        >
                          {user.isActive ? (
                            <Ban className="size-4" />
                          ) : (
                            <Shield className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          title={t('delete_user')}
                        >
                          <Trash2 className="size-4" />
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

      <UserDetailsDialog
        user={selectedUser}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
      <EditUserDialog
        user={editingUser}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUserUpdated={handleUserUpdated}
      />
      <ToggleUserStatusDialog
        user={toggleStatusUser}
        open={toggleStatusOpen}
        onOpenChange={setToggleStatusOpen}
        onStatusChanged={handleStatusChanged}
      />
      <DeleteUserDialog
        user={deletingUser}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
}
