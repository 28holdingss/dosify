import { colors } from '@/constants/theme';

type NotificationStyle = {
  icon:
    | 'warning'
    | 'water'
    | 'medical'
    | 'trophy'
    | 'notifications'
    | 'alarm'
    | 'cart'
    | ' Cub'
    | 'people';
  color: string;
  bg: string;
};

export function getNotificationStyle(type: string): NotificationStyle {
  switch (type) {
    case 'INTERACTION_ALERT':
      return {
        icon: 'warning',
        color: colors.warning,
        bg: 'rgba(245,158,11,0.12)',
      };
    case 'HYDRATION_REMINDER':
      return {
        icon: 'water',
        color: colors.blue,
        bg: 'rgba(59,130,246,0.12)',
      };
    case 'MEDICATION_REMINDER':
      return {
        icon: 'medical',
        color: colors.purple,
        bg: 'rgba(168,85,247,0.12)',
      };
    case 'GOAL_SUCCESS':
      return {
        icon: 'trophy',
        color: colors.success,
        bg: 'rgba(34,197,94,0.12)',
      };
    case 'DOSE_MISSED':
      return {
        icon: 'alarm',
        color: colors.danger,
        bg: 'rgba(239,68,68,0.12)',
      };
    case 'REFILL_DUE':
      return {
        icon: 'cart',
        color: colors.warning,
        bg: 'rgba(245,158,11,0.12)',
      };
    case 'LOW_STOCK':
      return {
        icon: 'cube',
        color: colors.blue,
        bg: 'rgba(59,130,246,0.12)',
      };
    case 'FAMILY':
      return {
        icon: 'people',
        color: colors.primary,
        bg: 'rgba(99,102,241,0.12)',
      };
    case 'DOSE_PATTERN':
      return {
        icon: 'warning',
        color: colors.warning,
        bg: 'rgba(245,158,11,0.12)',
      };
    default:
      return {
        icon: 'notifications',
        color: colors.primary,
        bg: 'rgba(99,102,241,0.12)',
      };
  }
}

/** Deep-link target for an inbox notification type. */
export function routeForNotificationType(type: string): string | null {
  switch (type) {
    case 'INTERACTION_ALERT':
      return '/interaction-alert';
    case 'DOSE_MISSED':
    case 'MEDICATION_REMINDER':
    case 'GOAL_SUCCESS':
      return '/todays-doses';
    case 'DOSE_PATTERN':
      return '/insights';
    case 'REFILL_DUE':
    case 'LOW_STOCK':
      return '/health-cabinet';
    case 'FAMILY':
      return '/family';
    default:
      return null;
  }
}
