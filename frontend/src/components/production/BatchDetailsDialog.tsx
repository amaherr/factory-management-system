import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Check, Clock } from 'lucide-react';
import type { BatchWithEvents } from '../../services/batches';

interface BatchDetailsDialogProps {
  batchData: BatchWithEvents | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchDetailsDialog({ batchData, open, onOpenChange }: BatchDetailsDialogProps) {
  const { t } = useTranslation('batches');

  if (!batchData) return null;

  const { batch, events } = batchData;

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'default' | 'secondary' | 'outline'> = {
      planning: 'secondary',
      production: 'default',
      done: 'outline',
    };
    return colorMap[status] || 'outline';
  };

  const getProgressPercentage = () => {
    if (batch.status === 'planning') return 0;
    if (batch.status === 'production') return 50;
    if (batch.status === 'done') return 100;
    return 0;
  };

  const loss = batch.producedQuantity ? batch.plannedQuantity - batch.producedQuantity : 0;

  const stages = [
    { key: 'planning', label: t('stages.planning'), completed: batch.status !== 'planning' },
    { key: 'production', label: t('stages.production'), completed: batch.status === 'done' },
    { key: 'done', label: t('stages.done'), completed: batch.status === 'done' },
  ];

  const currentStageIndex = stages.findIndex((stage) => stage.key === batch.status);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('details.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Batch Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 text-sm text-gray-700">{t('details.batchInfo')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('details.batchNumber')}</p>
                  <p className="font-mono text-lg font-bold">#{batch.batchNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('details.status')}</p>
                  <Badge variant={getStatusColor(batch.status)}>
                    {t(`stages.${batch.status}`)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('details.product')}</p>
                  <p className="font-medium">{batch.productId?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{batch.productId?.code || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('details.relatedOrder')}</p>
                  <p className="font-mono text-sm">
                    {batch.orderId ? `#${batch.orderId.orderNumber}` : t('details.noOrder')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('details.plannedQuantity')}</p>
                  <p className="text-lg font-semibold">{batch.plannedQuantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('details.producedQuantity')}</p>
                  <p className="text-lg font-semibold">
                    {batch.producedQuantity !== undefined ? batch.producedQuantity : '-'}
                  </p>
                </div>
                {loss > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('details.loss')}</p>
                    <Badge variant="destructive">{loss}</Badge>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">{t('details.startDate')}</p>
                  <p className="text-sm">{new Date(batch.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('details.endDate')}</p>
                  <p className="text-sm">
                    {batch.endDate
                      ? new Date(batch.endDate).toLocaleDateString()
                      : t('details.notCompleted')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Progress */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 text-sm text-gray-700">{t('details.progress')}</h3>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">{getProgressPercentage()}%</p>
              </div>

              {/* Stages Timeline */}
              <div className="flex justify-between items-start relative">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
                <div
                  className="absolute top-5 left-0 h-0.5 bg-blue-600 z-0 transition-all duration-500"
                  style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
                />

                {stages.map((stage, index) => (
                  <div
                    key={stage.key}
                    className="flex flex-col items-center z-10 flex-1"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        stage.completed || index === currentStageIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {stage.completed ? (
                        <Check className="size-5" />
                      ) : (
                        <Clock className="size-5" />
                      )}
                    </div>
                    <p
                      className={`text-xs font-medium text-center ${
                        stage.completed || index === currentStageIndex
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* BatchEvents */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 text-sm text-gray-700">{t('details.events')}</h3>

              {events.length === 0 ? (
                <p className="text-sm text-gray-500">{t('details.noEvents')}</p>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event._id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">{t('details.eventStage')}</p>
                          <Badge variant="outline">{t(`stages.${event.stage}`)}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('details.eventLoss')}</p>
                          <p className="text-sm font-medium">{event.loss}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('details.eventStartDate')}
                          </p>
                          <p className="text-sm">
                            {new Date(event.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('details.eventEndDate')}
                          </p>
                          <p className="text-sm">
                            {event.endDate ? new Date(event.endDate).toLocaleDateString() : '-'}
                          </p>
                        </div>
                        {event.finalizedByUserId && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">
                              {t('details.eventFinalizedBy')}
                            </p>
                            <p className="text-sm">{event.finalizedByUserId.name}</p>
                          </div>
                        )}
                        {event.notes && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">
                              {t('details.eventNotes')}
                            </p>
                            <p className="text-sm">{event.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>{t('details.close')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
