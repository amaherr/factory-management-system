import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CheckCheck, Check, Bell, Loader2 } from 'lucide-react';
import { notificationService, type Notification } from '../services/notifications';
import { NotificationDetailDialog } from '../components/NotificationDetailDialog';
import { toast } from 'sonner';

export function Notifications() {
  const { t } = useTranslation('notifications');
  const { t: tCommon } = useTranslation('common');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toasts.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      setProcessingIds((prev) => new Set([...prev, notificationId]));
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, status: 'read' } : n)),
      );
      toast.success(tCommon('markAsRead'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toasts.error'));
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => n.status === 'unread').map((n) => n._id);
      await notificationService.markAllAsRead(unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
      toast.success(t('toasts.markedAllAsRead'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toasts.error'));
    }
  };

  const handleViewDetails = async (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailsOpen(true);

    // Mark as read when opened
    if (notification.status === 'unread') {
      await markAsRead(notification._id);
    }
  };

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('title')}</h1>
          <p className="text-gray-500">
            {unreadCount > 0
              ? tCommon('unreadNotifications', { count: unreadCount })
              : tCommon('allCaughtUp')}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
          >
            <CheckCheck className="size-4 mr-2" />
            {tCommon('markAllAsRead')}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('noNotifications')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const isProcessing = processingIds.has(notification._id);
            const isUnread = notification.status === 'unread';

            return (
              <Card
                key={notification._id}
                className={`transition-opacity ${isUnread ? '' : 'opacity-60'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${isUnread ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Bell className={`size-5 ${isUnread ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{notification.content}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isUnread && <Badge>{tCommon('new')}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(notification)}
                        >
                          {tCommon('viewDetails')}
                        </Button>
                        {isUnread && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification._id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="size-4 mr-1" />
                                {tCommon('markAsRead')}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NotificationDetailDialog
        notification={selectedNotification}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
