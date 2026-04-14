import { useState, useCallback, useRef } from 'react';
import { socketApi } from '../socket/client';
import type { ItemBase, CraftedItem, CraftResult, CraftRequest } from '../types/game';

export interface UseCraftingOptions {
  playerId: string;
  onCraftSuccess?: (item: CraftedItem) => void;
  onCraftError?: (error: string) => void;
  soundEnabled?: boolean;
}

export function useCrafting({ 
  playerId, 
  onCraftSuccess, 
  onCraftError, 
  soundEnabled = true 
}: UseCraftingOptions) {
  const [isCrafting, setIsCrafting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastResult, setLastResult] = useState<CraftResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const playSound = useCallback((src: string, volume: number = 0.5) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(() => {}); // Silently ignore autoplay blocks or missing files
    } catch (err) {
      console.warn('🔇 Audio playback failed:', err);
    }
  }, [soundEnabled]);

  const craft = useCallback(async (
    base: ItemBase, 
    craftType: CraftRequest['craftType'],
    options?: { currency?: string; confirm?: boolean }
  ): Promise<CraftResult | null> => {
    // Prevent duplicate requests
    if (isCrafting) return null;
    
    // Validate prerequisites
    if (!base) {
      const err = 'No item base selected';
      setError(err);
      onCraftError?.(err);
      return null;
    }

    // Optional confirmation for expensive crafts
    if (options?.confirm && options.currency) {
      const confirmed = window.confirm(
        `Spend 1x ${options.currency} to ${craftType.replace('_', ' ')}?`
      );
      if (!confirmed) return null;
    }

    setIsCrafting(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      playSound('/sounds/craft-roll.mp3', 0.3);

      const result = await socketApi.craftItem({
        baseId: base.id, 
        craftType: craftType,
        currentItem: craftType === 'add_mod' ? lastResult?.item : undefined
      });
      setLastResult(result);

      if (result.success && result.item) {
        // Play success sound for rare+ items
        if (['rare', 'unique'].includes(result.item.rarity)) {
          playSound('/sounds/craft-success.mp3', 0.5);
        }
        onCraftSuccess?.(result.item);
      } else {
        setError(result.message);
        onCraftError?.(result.message);
      }

      return result;
    } catch (err: any) {
      const message = err.message || 'Network error during crafting';
      setError(message);
      onCraftError?.(message);
      return { success: false, message };
    } finally {
      setIsCrafting(false);
      abortControllerRef.current = null;
    }
  }, [isCrafting, onCraftSuccess, onCraftError]);

  const cancelCraft = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsCrafting(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearResult = useCallback(() => setLastResult(null), []);

  const saveItem = useCallback(async (item: CraftedItem): Promise<boolean> => {
    if (!item || isSaving) return false;
    
    setIsSaving(true);
    try {
      playSound('/sounds/craft-store.mp3', 0.4);
      const success = await socketApi.saveToInventory(item);
      if (success) {
        clearResult(); // Auto-clear preview on successful save
        return true;
      } else {
        setError('Failed to save: Inventory may be full');
        onCraftError?.('Inventory full');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error during save';
      setError(message);
      onCraftError?.(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, clearResult, onCraftError]);

  return {
    isCrafting,
    isSaving,
    lastResult,
    error,
    craft,
    cancelCraft,
    clearError,
    clearResult,
    saveItem,
    // Derived helpers
    canCraft: (base: ItemBase, craftType: string) => {
      // TODO: Add business logic: currency check, mod limits, etc.
      return !isCrafting && base !== null;
    }
  };
}