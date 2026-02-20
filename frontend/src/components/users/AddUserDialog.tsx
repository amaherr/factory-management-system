import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { userService, type User } from '../../services/users';
import { ROLE_VALUES } from '../../services/enums/user.enums';
import type { UserRole } from '../../services/enums/user.enums';
import { toast } from 'sonner';

interface AddUserDialogProps {
  onUserAdded: (user: User) => void;
}

export function AddUserDialog({ onUserAdded }: AddUserDialogProps) {
  const { t } = useTranslation('users');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    roles: [] as UserRole[],
  });

  const handleRoleToggle = (role: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error(t('name_required'));
      }
      if (!formData.phoneNumber.trim()) {
        throw new Error(t('phone_required'));
      }
      if (formData.phoneNumber.length < 5) {
        throw new Error(t('phone_min_length'));
      }
      if (!formData.password) {
        throw new Error(t('password_required'));
      }
      if (formData.password.length < 6) {
        throw new Error(t('password_min_length'));
      }
      if (formData.roles.length === 0) {
        throw new Error(t('roles_required'));
      }

      const newUser = await userService.createUser({
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        roles: formData.roles,
      });

      toast.success(t('user_created_successfully'));
      onUserAdded(newUser);
      setOpen(false);
      setFormData({
        name: '',
        phoneNumber: '',
        password: '',
        roles: [],
      });
      setShowPassword(false);
    } catch (error: any) {
      toast.error(error.message || t('failed_to_create_user'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          {t('add_user')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('add_user')}</DialogTitle>
          <DialogDescription>{t('enter_user_details')}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">{t('name_label')}</Label>
            <Input
              id="name"
              placeholder={t('name_placeholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={35}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">{t('phone_label')}</Label>
            <Input
              id="phoneNumber"
              placeholder={t('phone_placeholder')}
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password_label')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('password_placeholder')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="size-4 text-muted-foreground" />
                ) : (
                  <Eye className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('password_hint')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('roles_label')}</Label>
            <div className="space-y-2 border rounded-md p-3">
              {ROLE_VALUES.map((role) => (
                <div
                  key={role}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`role-${role}`}
                    checked={formData.roles.includes(role)}
                    onCheckedChange={() => handleRoleToggle(role)}
                  />
                  <label
                    htmlFor={`role-${role}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {t(`role_${role}`)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setShowPassword(false);
              }}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? t('creating') : t('create_user')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
