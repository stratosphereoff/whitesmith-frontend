import type { ItemBase } from '../types/game';

interface Props {
  bases: ItemBase[];
  onSelect: (base: ItemBase) => void;
  selectedId?: string;
}

export function ItemBaseSelector({ bases, onSelect, selectedId }: Props) {
  const grouped = bases.reduce((acc, base) => {
    if (!acc[base.category]) acc[base.category] = [];
    acc[base.category].push(base);
    return acc;
  }, {} as Record<string, ItemBase[]>);

  return (
    <div className="panel-rpg p-4 max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg mb-3 text-rpg-accent">📦 Item Bases</h3>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-4 last:mb-0">
          <h4 className="text-xs font-semibold text-rpg-textMuted uppercase tracking-wider mb-2 pl-1">{category}</h4>
          <div className="space-y-2">
            {items.map((base) => (
              <button
                key={base.id}
                onClick={() => onSelect(base)}
                className={`w-full text-left p-3 rounded-md border transition-all duration-200 group ${
                  selectedId === base.id
                    ? 'border-rpg-accent bg-amber-900/10 shadow-inner'
                    : 'border-rpg-border hover:border-rpg-borderHover hover:bg-gray-800/50'
                }`}
              >
                <div className="font-medium group-hover:text-rpg-accent transition-colors">{base.name}</div>
                <div className="text-[11px] text-rpg-textMuted mt-1 flex justify-between">
                  <span>ilvl {base.ilvl}</span>
                  <span>{base.maxPrefixes}P / {base.maxSuffixes}S</span>
                </div>
                {base.implicitMods?.[0] && (
                  <div className="text-[11px] stat-implicit mt-1 truncate">{base.implicitMods[0].name}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}