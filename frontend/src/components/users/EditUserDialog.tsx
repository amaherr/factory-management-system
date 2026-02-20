import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Eye, EyeOff } from 'lucide-react';
import { userService, type User } from '../../services/users';
import { ROLE_VALUES } from '../../services/enums/user.enums';
import type { UserRole } from '../../services/enums/user.enums';
import { toast } from 'sonner';

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (user: User) => void;
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const { t } = useTranslation('users');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    roles: [] as UserRole[],
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phoneNumber: user.phoneNumber,
        password: '',
        roles: user.roles,
      });
    }
  }, [user]);

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
    if (!user?._id) return;

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
      if (formData.password && formData.password.length < 6) {
        throw new Error(t('password_min_length'));
      }
      if (formData.roles.length === 0) {
        throw new Error(t('roles_required'));
      }

      // Update basic info if changed
      const basicUpdates: { name?: string; phoneNumber?: string; password?: string } = {};
      if (formData.name.trim() !== user.name) {
        basicUpdates.name = formData.name.trim();
      }
      if (formData.phoneNumber.trim() !== user.phoneNumber) {
        basicUpdates.phoneNumber = formData.phoneNumber.trim();
      }
      if (formData.password) {
        basicUpdates.password = formData.password;
      }

      let updatedUser = user;

      if (Object.keys(basicUpdates).length > 0) {
        updatedUser = await userService.editUser(user._id, basicUpdates);
      }

      // Update roles if changed
      const rolesChanged =
        formData.roles.length !== user.roles.length ||
        formData.roles.some((role) => !user.roles.includes(role));

      if (rolesChanged) {
        updatedUser = await userService.changeUserRoles(user._id, formData.roles);
      }

      if (Object.keys(basicUpdates).length === 0 && !rolesChanged) {
        throw new Error(t('no_changes_made'));
      }

      toast.success(t('user_updated_successfully'));
      onUserUpdated(updatedUser);
      onOpenChange(false);
      setShowPassword(false);
    } catch (error: any) {
      toast.error(error.message || t('failed_to_update_user'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setShowPassword(false);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('edit_user')}</DialogTitle>
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
            <Label htmlFor="password">{t('password_label_optional')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('password_placeholder_optional')}
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
            <p className="text-xs text-muted-foreground">{t('password_hint_optional')}</p>
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
                onOpenChange(false);
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
              {loading ? t('updating') : t('update_user')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
