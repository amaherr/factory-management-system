export const IssueType = Object.freeze({
  INVENTORY_DISCREPANCY: 'inventory discrepancy',
  DAMAGED_GOODS: 'damaged goods',
  SYSTEM_BUG: 'system bug',
} as const);

export type IssueType = (typeof IssueType)[keyof typeof IssueType];

export const IssueStatus = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in progress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const);

export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];
