import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { userService, type User } from '../../services/users';
import { toast } from 'sonner';

interface ToggleUserStatusDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChanged: (user: User) => void;
}

export function ToggleUserStatusDialog({
  user,
  open,
  onOpenChange,
  onStatusChanged,
}: ToggleUserStatusDialogProps) {
  const { t } = useTranslation('users');
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!user?._id) return;

    setLoading(true);

    try {
      const updatedUser = await userService.changeUserActivation(user._id, !user.isActive);

      toast.success(
        user.isActive ? t('user_deactivated_successfully') : t('user_activated_successfully'),
      );
      onStatusChanged(updatedUser);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || t('failed_to_change_status'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {user.isActive ? t('deactivate_user_title') : t('activate_user_title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {user.isActive ? t('deactivate_user_message') : t('activate_user_message')}
            <br />
            <br />
            <span className="font-semibold">
              {user.isActive
                ? t('deactivate_user_warning', { name: user.name })
                : t('activate_user_warning', { name: user.name })}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            variant={user.isActive ? 'destructive' : 'default'}
            onClick={handleToggle}
            disabled={loading}
          >
            {loading
              ? t('processing')
              : user.isActive
                ? t('deactivate')
                : t('activate')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
