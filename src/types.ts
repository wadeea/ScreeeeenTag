export type TaskStatus = 'PENDING' | 'SENT' | 'ACK' | 'DISPLAYED' | 'FAILED' | 'TIMEOUT';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category: string;
  barcode: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  type: string;
  current_ap_id: string | null;
  status: 'READY' | 'UPDATING' | 'ERROR' | 'OFFLINE';
  battery_level: number;
  rssi: number;
  last_seen: string;
  created_at: string;
  // Joined fields from Bindings/Products
  product_name?: string;
  product_price?: number;
  product_sku?: string;
}

export interface AccessPoint {
  id: string;
  alias?: string;
  ip_address: string;
  firmware_version: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  site_location?: string;
  last_heartbeat: string;
  created_at: string;
}

export interface Task {
  id: string;
  type: string;
  target_tag_id: string;
  ap_id: string;
  status: TaskStatus;
  retry_count: number;
  max_retries: number;
  payload_size?: number;
  error_message?: string;
  scheduled_at: string;
  completed_at?: string;
  created_at: string;
}
