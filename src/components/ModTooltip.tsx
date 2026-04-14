import  { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import type { ItemMod, ItemBase, StatType } from '../types/game';

// Simple mod database for descriptions (expand with real data)
const MOD_DESCRIPTIONS: Partial<Record<string, { desc: string; weight?: number; tags?: string[] }>> = {
  'of the Whale': { 
    desc: 'Grants additional maximum Life. Higher tiers provide more Life.',
    weight: 100,
    tags: ['life', 'defensive']
  },
  'of Sharpness': {
    desc: 'Adds physical damage to attacks. Scales with weapon base damage.',
    weight: 85,
    tags: ['damage', 'physical', 'weapon']
  },
  // ... expand as needed
};

interface Props {
  mod: ItemMod;
  base: ItemBase;
  children: ReactNode;
}

export function ModTooltip({ mod, base, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const modInfo = MOD_DESCRIPTIONS[mod.name];

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}
      
      <AnimatePresence>
        {isOpen && modInfo && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-gray-900 border border-rpg-border shadow-xl pointer-events-none"
            role="tooltip"
          >
            <p className="text-sm font-medium mb-1">{mod.name}</p>
            <p className="text-xs text-rpg-textMuted mb-2">{modInfo.desc}</p>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {modInfo.tags?.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="text-[10px] text-rpg-textMuted flex justify-between">
              <span>Spawn weight: {modInfo.weight}</span>
              <span>Tier: {mod.tier || 'N/A'}</span>
            </div>
            
            {/* Tooltip arrow */}
            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-rpg-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}