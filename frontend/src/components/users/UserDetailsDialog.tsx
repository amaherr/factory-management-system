import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { User } from '../../services/users';

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  const { t } = useTranslation('users');

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('user_details')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('name')}</p>
              <p className="font-semibold">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('phone_number')}</p>
              <p className="font-semibold">{user.phoneNumber}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">{t('roles')}</p>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                >
                  {t(`role_${role}`)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('status')}</p>
              <Badge variant={user.isActive ? 'default' : 'destructive'}>
                {user.isActive ? t('active') : t('inactive')}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('last_login')}</p>
              <p className="font-semibold">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : t('never')}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3">{t('account_information')}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t('created_at')}</p>
                <p className="font-semibold">
                  {user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('updated_at')}</p>
                <p className="font-semibold">
                  {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
