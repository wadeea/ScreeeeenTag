import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';

let socket: Socket | null = null;

export const useSocket = () => {
  const { updateTag, updateTask, updateAp, setError } = useStore();

  useEffect(() => {
    if (!socket) {
      socket = io(window.location.origin, {
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });
    }

    socket.on('connect', () => {
      console.log('✅ Connected to OmniESL Real-time Pipeline');
    });

    socket.on('tag:status', (data) => {
      updateTag({ id: data.tagId, ...data });
    });

    socket.on('task:update', (data) => {
      updateTask({ id: data.taskId, ...data });
    });

    socket.on('ap:status', (data) => {
      updateAp({ id: data.apId, ...data });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Real-time connection lost. Attempting to reconnect...');
    });

    return () => {
      // We keep the socket persistent for the app lifetime
    };
  }, [updateTag, updateTask, updateAp, setError]);

  return socket;
};
