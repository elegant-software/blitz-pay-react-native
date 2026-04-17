import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PAYMENTS_CHANNEL_ID } from '../payments/constants';

let ensured = false;

export async function ensurePaymentsChannel(): Promise<void> {
  if (ensured) return;
  ensured = true;
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(PAYMENTS_CHANNEL_ID, {
      name: 'Payment results',
      importance: Notifications.AndroidImportance.HIGH,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    });
  } catch {
    // non-fatal; notifications will fall back to the default channel
  }
}
