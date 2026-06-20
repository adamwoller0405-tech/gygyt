const BASE_URL = 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  users: {
    list: () => request<any[]>('/users'),
    get: (id: string) => request<any>(`/users/${id}`),
    update: (id: string, data: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    create: (data: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
  },
  posts: {
    list: () => request<any[]>('/posts'),
    create: (data: any) => request<any>('/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/posts/${id}`, { method: 'DELETE' }),
  },
  events: {
    list: () => request<any[]>('/events'),
    create: (data: any) => request<any>('/events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/events/${id}`, { method: 'DELETE' }),
  },
  chats: {
    list: (channelId?: string) => request<any[]>(`/chats${channelId ? `?channelId=${channelId}` : ''}`),
    send: (data: any) => request<any>('/chats', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/chats/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/chats/${id}`, { method: 'DELETE' }),
  },
  joinRequests: {
    list: () => request<any[]>('/join_requests'),
    create: (data: any) => request<any>('/join_requests', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/join_requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
};
