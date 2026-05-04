import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiFetch<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T> {
  const token = await AsyncStorage.getItem('token');
  const res = await axios({
    url: `${API_URL}${path}`,
    method: options?.method ?? 'GET',
    data: options?.body,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data as T;
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem('token', token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem('token');
}
