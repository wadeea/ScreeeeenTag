export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  price: number;
  currency: string;
  category: string;
}

export interface Tag {
  id: string;
  status: 'READY' | 'UPDATING' | 'ERROR' | 'OFFLINE';
  battery: number;
  lastSeen: string;
  apId: string;
  sku: string | null;
  productName?: string;
  productPrice?: number;
}

export interface AccessPoint {
  id: string;
  apId: string;
  ip: string;
  mac: string;
  status: string;
  lastSeen: string;
}

export type TaskStatus = 'PENDING' | 'SENT' | 'ACK' | 'DISPLAYED' | 'FAILED' | 'TIMEOUT';

export interface Task {
  id: string;
  type: string;
  targetId: string;
  payload: string;
  status: TaskStatus;
  logs: string;
  createdAt: string;
  updatedAt: string;
}
