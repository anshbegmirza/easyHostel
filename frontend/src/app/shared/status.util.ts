/** Status → Material icon + tone */

export type StatusTone = 'ok' | 'warn' | 'danger' | 'info' | 'muted';

export function statusTone(status: string): StatusTone {
  switch (status) {
    case 'available':
    case 'paid':
    case 'resolved':
    case 'closed':
    case 'low':
    case 'active':
    case 'approved':
      return 'ok';
    case 'occupied':
    case 'in_progress':
    case 'medium':
    case 'due':
    case 'pending':
      return 'warn';
    case 'maintenance':
    case 'high':
    case 'open':
    case 'rejected':
      return 'danger';
    case 'waived':
      return 'info';
    default:
      return 'muted';
  }
}

export function statusIcon(status: string) {
  switch (status) {
    case 'due':
      return 'schedule';
    case 'paid':
      return 'check_circle';
    case 'waived':
      return 'block';
    case 'open':
      return 'radio_button_checked';
    case 'in_progress':
      return 'sync';
    case 'resolved':
      return 'task_alt';
    case 'closed':
      return 'cancel';
    case 'available':
      return 'meeting_room';
    case 'occupied':
      return 'person';
    case 'maintenance':
      return 'build';
    case 'low':
      return 'flag';
    case 'medium':
      return 'flag';
    case 'high':
      return 'priority_high';
    case 'pending':
      return 'hourglass_empty';
    case 'active':
    case 'approved':
      return 'verified';
    case 'rejected':
      return 'cancel';
    default:
      return 'circle';
  }
}

export function prettyStatus(status: string) {
  return status.replaceAll('_', ' ');
}
