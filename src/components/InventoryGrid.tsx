import type { CraftedItem } from '../types/game';

interface Props {
  items: CraftedItem[];
  maxSlots: number;
  onItemClick?: (item: CraftedItem) => void;
}

export function InventoryGrid({ items, maxSlots, onItemClick }: Props) {
  const slots = Array.from({ length: maxSlots }, (_, i) => items[i] || null);

  return (
    <div className="panel-rpg p-4">
      <h3 className="text-lg mb-3 text-rpg-accent flex justify-between items-center">
        <span>🎒 Inventory</span>
        <span className="text-sm text-rpg-textMuted font-normal">{items.length}/{maxSlots}</span>
      </h3>
      
      <div className="grid grid-cols-5 gap-2">
        {slots.map((item, index) => (
          <button
            key={index}
            onClick={() => item && onItemClick?.(item)}
            disabled={!item}
            className={`aspect-square rounded border-2 flex flex-col items-center justify-center p-1 transition-all duration-200 disabled:cursor-default ${
              item 
                ? `rarity-${item.rarity} hover:scale-105 hover:shadow-lg` 
                : 'border-rpg-border bg-gray-900/30 border-dashed'
            }`}
          >
            {item ? (
              <>
                <div className="text-[9px] font-bold truncate w-full text-center rarity-text">{item.base.name}</div>
                <div className="text-[8px] uppercase mt-0.5 opacity-70">{item.rarity}</div>
                {item.mods.length > 0 && (
                  <div className="text-[8px] text-rpg-textMuted mt-1">+{item.mods.length} mods</div>
                )}
              </>
            ) : (
              <span className="text-rpg-border text-lg">·</span>
            )}
          </button>
        ))}
      </div>
      
      <p className="text-xs text-rpg-textMuted mt-3 text-center">Click items to inspect stats</p>
    </div>
  );
}