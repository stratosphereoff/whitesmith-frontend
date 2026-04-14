import { io, Socket } from 'socket.io-client';
import type {
  CraftedItem, PlayerInventory, ItemBase, ServerToClientEvents, ClientToServerEvents,
  CraftResult
} from '../types/game';

// Note: Types are reversed for client vs server [[5]]
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3001');

// Helper wrappers with promises for async/await
export const socketApi = {
  connectPlayer: (playerId: string) => {
    socket.emit('player:connect', playerId);
  },

  craftItem: (baseId: string, craftType: 'roll_new' | 'add_mod' | 'reforge' | 'augment'): Promise<CraftResult> => {
    return new Promise((resolve) => {
      socket.emit('craft:request', { playerId: 'player1', baseId, craftType }, resolve);
    });
  },

  saveToInventory: (item: CraftedItem): Promise<boolean> => {
    return new Promise((resolve) => {
      socket.emit('inventory:save', item, resolve);
    });
  },

  getInventory: (): Promise<PlayerInventory> => {
    return new Promise((resolve) => {
      socket.emit('inventory:get', resolve);
    });
  }
};

// Event listeners setup
export function setupSocketListeners(
  onCraftResult: (result: CraftResult) => void,
  onInventoryUpdate: (inv: PlayerInventory) => void,
  onBasesAvailable: (bases: ItemBase[]) => void,
  onError: (msg: string) => void
) {
  socket.on('craft:result', onCraftResult);
  socket.on('inventory:updated', onInventoryUpdate);
  socket.on('bases:available', onBasesAvailable);
  socket.on('error', onError);
}