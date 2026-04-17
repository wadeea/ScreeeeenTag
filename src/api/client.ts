import { Tag, Product, AccessPoint, Task } from '../types';

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${path}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, data?.error || 'Unknown API Error', data);
  }

  return data as T;
}

export const api = {
  tags: {
    list: () => request<Tag[]>('/api/tags'),
    bind: (tag_id: string, sku: string) => 
      request<{ success: boolean; taskId: string }>('/api/tags/bind', {
        method: 'POST',
        body: JSON.stringify({ tagId: tag_id, sku }) // Backend uses camelCase tagId in server.ts
      }),
  },
  products: {
    list: () => request<Product[]>('/api/products'),
  },
  aps: {
    list: () => request<AccessPoint[]>('/api/aps'),
  },
  tasks: {
    list: () => request<Task[]>('/api/tasks'),
  },
};
