import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';
const webStorage: Storage | null = (typeof window !== 'undefined' && 'localStorage' in window)
  ? window.localStorage
  : null;

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    webStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return webStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    webStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const storage = {
  setItem,
  getItem,
  deleteItem,
};
