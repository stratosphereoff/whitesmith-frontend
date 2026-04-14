import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ItemBase, CraftedItem } from '../types/game';
import { useCrafting } from '../hooks/useCrafting';
import { ModTooltip } from './ModTooltip';

interface Props {
  selectedBase: ItemBase | null;
  onItemCrafted: (item: CraftedItem) => void;
  playerId: string;
  className?: string;
}

// Button component with loading state & accessibility
const CraftButton = memo(({ 
  onClick, 
  disabled, 
  loading, 
  children, 
  variant = 'primary',
  ariaLabel 
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success';
  ariaLabel?: string;
}) => {
  const baseClasses = "btn-rpg flex items-center justify-center gap-2 min-h-[44px]"; // 44px min for touch
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary", 
    success: "btn-success"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={twMerge(clsx(baseClasses, variantClasses[variant]))}
    >
      {loading && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      <span className={loading ? 'sr-only' : ''}>{children}</span>
      {loading && <span aria-hidden="true">Crafting...</span>}
    </motion.button>
  );
});
CraftButton.displayName = 'CraftButton';

export const CraftingPanel = memo(function CraftingPanel({ 
  selectedBase, 
  onItemCrafted, 
  playerId,
  className 
}: Props) {
  const {
    isCrafting,
    isSaving,
    lastResult,
    error,
    craft,
    clearError,
    clearResult,
    saveItem,
    canCraft
  } = useCrafting({
    playerId,
    onCraftSuccess: onItemCrafted,
    onCraftError: (msg) => console.warn('Craft error:', msg),
    soundEnabled: true // Could be user preference
  });

  // Keyboard shortcuts: R = roll, A = add mod, Esc = clear
  useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return; // Ignore if typing
    
    if (e.key.toLowerCase() === 'r' && canCraft(selectedBase!, 'roll_new')) {
      e.preventDefault();
      craft(selectedBase!, 'roll_new');
    }
    if (e.key.toLowerCase() === 'a' && canCraft(selectedBase!, 'add_mod')) {
      e.preventDefault();
      craft(selectedBase!, 'add_mod');
    }
    if (e.key === 'Escape') {
      clearError();
      clearResult();
    }
  }, [selectedBase, canCraft, craft, clearError, clearResult]);

  if (!selectedBase) {
    return (
      <div className={twMerge("panel-rpg p-6 flex flex-col items-center justify-center text-center min-h-[200px]", className)}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl mb-3"
          aria-hidden="true"
        >
          📦
        </motion.div>
        <p className="text-rpg-textMuted">Select an item base to begin crafting</p>
        <p className="text-xs text-rpg-textMuted mt-2">
          Tip: Use <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-rpg-border">R</kbd> to roll, <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-rpg-border">A</kbd> to add mod
        </p>
      </div>
    );
  }

  // Calculate mod availability
  const currentPrefixes = (lastResult?.item?.mods.filter(m => m.isPrefix).length || 0) + 
                         (selectedBase.implicitMods?.filter(m => m.isPrefix).length || 0);
  const currentSuffixes = (lastResult?.item?.mods.filter(m => !m.isPrefix).length || 0) +
                         (selectedBase.implicitMods?.filter(m => !m.isPrefix).length || 0);
  const canAddPrefix = currentPrefixes < selectedBase.maxPrefixes;
  const canAddSuffix = currentSuffixes < selectedBase.maxSuffixes;
  const isModLimitReached = !canAddPrefix && !canAddSuffix;

  return (
    <motion.div 
      layout
      className={twMerge("panel-rpg p-5", className)}
      role="region"
      aria-label="Crafting panel"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-3 border-b border-rpg-border">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {selectedBase.name}
          </h2>
          <p className="text-xs text-rpg-textMuted mt-1">
            ilvl {selectedBase.ilvl} • Max: {selectedBase.maxPrefixes} prefix / {selectedBase.maxSuffixes} suffix
          </p>
        </div>
        <span className="text-xs px-2 py-1 bg-gray-800 rounded border border-rpg-border uppercase tracking-wide">
          {selectedBase.category}
        </span>
      </div>

      {/* Mod Limit Indicators */}
      <div className="flex gap-4 mb-4 text-xs">
        <div className={clsx("flex items-center gap-1", canAddPrefix ? 'text-blue-400' : 'text-gray-500 line-through')}>
          <span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true" />
          Prefix: {currentPrefixes}/{selectedBase.maxPrefixes}
        </div>
        <div className={clsx("flex items-center gap-1", canAddSuffix ? 'text-yellow-400' : 'text-gray-500 line-through')}>
          <span className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden="true" />
          Suffix: {currentSuffixes}/{selectedBase.maxSuffixes}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <CraftButton
          onClick={() => craft(selectedBase, 'roll_new', { confirm: true })}
          disabled={!canCraft(selectedBase, 'roll_new') || isModLimitReached}
          loading={isCrafting}
          variant="primary"
          ariaLabel="Roll new random mods on this item"
        >
          🎲 Roll New Mods
        </CraftButton>
        <CraftButton
          onClick={() => craft(selectedBase, 'add_mod')}
          disabled={!canCraft(selectedBase, 'add_mod') || isModLimitReached}
          loading={isCrafting}
          variant="secondary"
          ariaLabel="Add a single random mod"
        >
          ➕ Add Single Mod
        </CraftButton>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-md bg-red-900/20 border border-red-700 text-red-300 text-sm mb-3 flex items-start gap-2"
            role="alert"
          >
            <span aria-hidden="true">⚠️</span>
            <span>{error}</span>
            <button 
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-300"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Craft Result Preview */}
      <AnimatePresence mode="wait">
        {lastResult?.success && lastResult.item && (
          <motion.div
            key={lastResult.item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={clsx(
              "p-4 rounded-lg border animate-craft-roll",
              lastResult.item.rarity === 'rare' ? 'border-rarity-rare bg-yellow-900/10' :
              lastResult.item.rarity === 'magic' ? 'border-rarity-magic bg-blue-900/10' :
              'border-rpg-border bg-gray-900/30'
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`rarity-text rarity-${lastResult.item.rarity}`}>
                {lastResult.item.rarity} item crafted!
              </span>
              <button 
                onClick={clearResult}
                className="text-rpg-textMuted hover:text-rpg-text text-sm"
                aria-label="Clear result"
              >
                Clear
              </button>
            </div>

            {/* Implicit Mods */}
            {lastResult.item.base.implicitMods?.map(mod => (
              <div key={mod.id} className="stat-implicit text-sm mb-1 flex items-center gap-2">
                <ModTooltip mod={mod} base={selectedBase}>
                  <span className="cursor-help border-b border-dashed border-purple-500/50">
                    {mod.name}
                  </span>
                </ModTooltip>
                <span className="stat-value">+{mod.value}</span> 
                <span className="text-rpg-textMuted">{mod.stat}</span>
              </div>
            ))}

            {/* Explicit Mods with Tooltips */}
            {lastResult.item.mods.map(mod => (
              <div key={mod.id} className={`text-sm mb-1 flex items-center gap-2 ${mod.isPrefix ? 'stat-prefix' : 'stat-suffix'}`}>
                <ModTooltip mod={mod} base={selectedBase}>
                  <span className="cursor-help border-b border-dashed border-current/50">
                    {mod.name}
                  </span>
                </ModTooltip>
                <span className="stat-value">+{mod.value}</span>
                <span className="text-rpg-textMuted">{mod.stat}</span>
                {mod.tier && <span className="text-xs opacity-60">(T{mod.tier})</span>}
              </div>
            ))}

            {/* Save Actions */}
            <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
              <button
                onClick={() => lastResult?.item && saveItem(lastResult.item)}
                disabled={!lastResult?.item || isSaving || isCrafting}
                className="btn-success flex-1 text-sm py-2 relative"
              >
                {isSaving ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full inline-block mr-2"
                    />
                    Saving...
                  </>
                ) : '💾 Save to Inventory'}
              </button>
              <button
                onClick={clearResult}
                disabled={isSaving || isCrafting}
                className="btn-secondary flex-1 text-sm py-2"
              >
                🗑️ Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      <div className="mt-4 pt-3 border-t border-rpg-border text-xs text-rpg-textMuted">
        <p>• Roll New: Generates 1-3 random mods (respects prefix/suffix limits)</p>
        <p>• Add Mod: Adds exactly 1 random mod of available type</p>
        <p>• Hover mod names for detailed descriptions and spawn weights</p>
      </div>
    </motion.div>
  );
});