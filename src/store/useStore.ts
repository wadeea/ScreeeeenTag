import { create } from 'zustand';
import { Tag, AccessPoint, Task, Product } from '../types';
import { api } from '../api/client';

interface OmniState {
  user: any | null;
  tags: Tag[];
  aps: AccessPoint[];
  tasks: Task[];
  products: Product[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: any | null) => void;
  logout: () => void;
  fetchData: () => Promise<void>;
  updateTag: (tag: Partial<Tag> & { id: string }) => void;
  updateTask: (task: Partial<Task> & { id: string }) => void;
  updateAp: (ap: Partial<AccessPoint> & { id: string }) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<OmniState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('omni_user') || 'null'),
  tags: [],
  aps: [],
  tasks: [],
  products: [],
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('omni_user');
    set({ user: null });
  },

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [tags, aps, tasks, products] = await Promise.all([
        api.tags.list(),
        api.aps.list(),
        api.tasks.list(),
        api.products.list(),
      ]);
      set({ tags, aps, tasks, products, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateTag: (updatedTag) => {
    set((state) => ({
      tags: state.tags.map((t) => 
        t.id === updatedTag.id ? { ...t, ...updatedTag } : t
      ),
    }));
  },

  updateTask: (updatedTask) => {
    set((state) => {
      const exists = state.tasks.find(t => t.id === updatedTask.id);
      if (exists) {
        return {
          tasks: state.tasks.map((t) => 
            t.id === updatedTask.id ? { ...t, ...updatedTask } : t
          ),
        };
      } else {
        // Add new task if it doesn't exist (e.g. from socket)
        return {
          tasks: [updatedTask as Task, ...state.tasks].slice(0, 50),
        };
      }
    });
  },

  updateAp: (updatedAp) => {
    set((state) => ({
      aps: state.aps.map((a) => 
        a.id === updatedAp.id ? { ...a, ...updatedAp } : a
      ),
    }));
  },

  setError: (error) => set({ error }),
}));
