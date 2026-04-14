import type { CraftedItem } from '../types/game';

interface Props {
  item: CraftedItem;
  onClose: () => void;
}

export function ItemInspector({ item, onClose }: Props) {
  const rarityColors: Record<CraftedItem['rarity'], string> = {
    normal: 'border-gray-600 bg-gray-900/95',
    magic: 'border-blue-500 bg-blue-900/90',
    rare: 'border-yellow-500 bg-yellow-900/90',
    unique: 'border-orange-500 bg-orange-900/90'
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div 
        className={`max-w-sm w-full p-5 rounded-lg border-2 shadow-2xl animate-slide-up ${rarityColors[item.rarity]}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-heading">{item.base.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block font-semibold rarity-text rarity-${item.rarity} bg-black/20`}>
              {item.rarity} {item.base.category}
            </span>
          </div>
          <button onClick={onClose} className="text-rpg-textMuted hover:text-white text-2xl leading-none">×</button>
        </div>
        
        <div className="space-y-1 mb-4">
          {item.base.implicitMods?.map(mod => (
            <div key={mod.id} className="stat-implicit text-sm">
              {mod.name} <span className="stat-value">+{mod.value}</span> {mod.stat}
            </div>
          ))}
          <div className="h-px bg-white/10 my-2" />
          {item.mods.map(mod => (
            <div key={mod.id} className={`text-sm ${mod.isPrefix ? 'stat-prefix' : 'stat-suffix'}`}>
              {mod.name} <span className="stat-value">+{mod.value}</span> {mod.stat} {mod.tier && <span className="text-xs opacity-60">(T{mod.tier})</span>}
            </div>
          ))}
        </div>
        
        <div className="text-xs text-rpg-textMuted pt-3 border-t border-white/10 flex justify-between">
          <span>Ilvl: {item.base.ilvl}</span>
          <span>Crafted: {new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}