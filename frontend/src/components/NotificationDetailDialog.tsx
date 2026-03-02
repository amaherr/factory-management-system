import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Bell } from 'lucide-react';
import type { Notification } from '../services/notifications';

interface NotificationDetailDialogProps {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
}: NotificationDetailDialogProps) {
  const { t } = useTranslation('notifications');
  const { t: tCommon } = useTranslation('common');

  if (!notification) return null;

  const isUnread = notification.status === 'unread';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('detailsTitle')}</DialogTitle>
          <DialogDescription>{new Date(notification.createdAt).toLocaleString()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${isUnread ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Bell className={`size-6 ${isUnread ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-gray-700 leading-relaxed">{notification.content}</p>
                <Badge variant={isUnread ? 'default' : 'secondary'}>
                  {isUnread ? tCommon('new') : t('read')}
                </Badge>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('status')}:</span>
                  <span className="font-medium text-gray-900">
                    {isUnread ? t('statusUnread') : t('statusRead')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('timestamp')}:</span>
                  <span className="text-gray-900">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
