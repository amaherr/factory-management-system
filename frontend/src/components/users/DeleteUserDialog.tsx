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

interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserDeleted: (userId: string) => void;
}

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onUserDeleted,
}: DeleteUserDialogProps) {
  const { t } = useTranslation('users');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user?._id) return;

    setLoading(true);

    try {
      await userService.deleteUser(user._id);

      toast.success(t('user_deleted_successfully'));
      onUserDeleted(user._id);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || t('failed_to_delete_user'));
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
          <AlertDialogTitle>{t('delete_user_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_user_message')}
            <br />
            <br />
            <span className="font-semibold">
              {t('delete_user_warning', { name: user.name })}
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
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? t('deleting') : t('delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
