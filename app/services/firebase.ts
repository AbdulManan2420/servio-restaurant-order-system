'use client';

import { initializeApp, getApps } from 'firebase/app';
import { addDoc, collection, doc, getFirestore, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import type { MenuItem, Order, OrderStatus } from '../types';
import { DEFAULT_MENU, SAMPLE_ORDERS } from '../types';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);
const database = isFirebaseConfigured ? getFirestore(getApps()[0] ?? initializeApp(config)) : null;

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}
function writeLocal(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new CustomEvent(`servio:${key}`)); }

export function subscribeOrders(callback: (orders: Order[]) => void) {
  if (database) return onSnapshot(query(collection(database, 'orders'), orderBy('createdAt', 'desc')), snapshot => callback(snapshot.docs.map(entry => ({ ...entry.data(), id: entry.id }) as Order)));
  const update = () => callback(readLocal('orders', SAMPLE_ORDERS)); update(); window.addEventListener('servio:orders', update); return () => window.removeEventListener('servio:orders', update);
}
export function subscribeMenu(callback: (menu: MenuItem[]) => void) {
  if (database) return onSnapshot(collection(database, 'menu'), snapshot => callback(snapshot.empty ? DEFAULT_MENU : snapshot.docs.map(entry => ({ ...entry.data(), id: entry.id }) as MenuItem)));
  const update = () => callback(readLocal('menu', DEFAULT_MENU)); update(); window.addEventListener('servio:menu', update); return () => window.removeEventListener('servio:menu', update);
}
export async function createOrder(order: Order) { if (database) await addDoc(collection(database, 'orders'), { ...order, id: undefined }); else writeLocal('orders', [order, ...readLocal('orders', SAMPLE_ORDERS)]); }
export async function updateOrderStatus(id: string, status: OrderStatus) { if (database) await updateDoc(doc(database, 'orders', id), { status }); else writeLocal('orders', readLocal<Order[]>('orders', SAMPLE_ORDERS).map(order => order.id === id ? { ...order, status } : order)); }
export async function updateMenuItem(id: string, values: Partial<MenuItem>) { if (database) await updateDoc(doc(database, 'menu', id), values); else writeLocal('menu', readLocal<MenuItem[]>('menu', DEFAULT_MENU).map(item => item.id === id ? { ...item, ...values } : item)); }
export async function saveMenuItem(item: MenuItem) { if (database) await setDoc(doc(database, 'menu', item.id), item); else writeLocal('menu', [...readLocal<MenuItem[]>('menu', DEFAULT_MENU), item]); }
