import { Badge } from './badge';
import { cn } from './utils';

type StatusType = 
  | 'completed' | 'finalized' | 'active' | 'success'
  | 'in-progress' | 'pending' | 'warning'
  | 'error' | 'failed' | 'rejected' | 'cancelled'
  | 'draft' | 'inactive' | 'info'
  | 'low-stock' | 'out-of-stock';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  children?: React.ReactNode;
}

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'destructive' | 'info' | 'secondary', label?: string }> = {
  // Success statuses (green)
  'completed': { variant: 'success', label: 'Completed' },
  'finalized': { variant: 'success', label: 'Finalized' },
  'active': { variant: 'success', label: 'Active' },
  'success': { variant: 'success', label: 'Success' },
  
  // Warning statuses (orange)
  'in-progress': { variant: 'warning', label: 'In Progress' },
  'pending': { variant: 'warning', label: 'Pending' },
  'warning': { variant: 'warning', label: 'Warning' },
  'low-stock': { variant: 'warning', label: 'Low Stock' },
  
  // Error/Destructive statuses (red)
  'error': { variant: 'destructive', label: 'Error' },
  'failed': { variant: 'destructive', label: 'Failed' },
  'rejected': { variant: 'destructive', label: 'Rejected' },
  'cancelled': { variant: 'destructive', label: 'Cancelled' },
  'out-of-stock': { variant: 'destructive', label: 'Out of Stock' },
  
  // Info/Draft statuses (blue/secondary)
  'draft': { variant: 'secondary', label: 'Draft' },
  'inactive': { variant: 'secondary', label: 'Inactive' },
  'info': { variant: 'info', label: 'Info' },
};

export function StatusBadge({ status, className, children }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/ /g, '-');
  const config = statusConfig[normalizedStatus] || { variant: 'info' as const };
  
  return (
    <Badge 
      variant={config.variant}
      className={cn('capitalize', className)}
    >
      {children || config.label || status}
    </Badge>
  );
}
