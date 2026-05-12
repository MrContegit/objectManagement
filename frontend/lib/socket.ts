import { io } from 'socket.io-client';
import { getSocketUrl } from './utils';

export const socket = io(getSocketUrl(), {
  autoConnect: true,
});
