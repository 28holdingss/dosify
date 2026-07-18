import { colors } from '@/constants/theme';

type NotificationStyle = {
  icon: 'warning' | 'water' | 'medical' | 'trophy' | 'notifications';
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
    default:
      return {
        icon: 'notifications',
        color: colors.primary,
        bg: 'rgba(99,102,241,0.12)',
      };
  }
}
