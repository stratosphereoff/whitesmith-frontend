import type { ItemBase, CraftedItem } from '../types/game';

interface Props {
  selectedBase: ItemBase | null;
  onItemCrafted: (item: CraftedItem) => void;
  isCrafting: boolean;
  message: string;
  onClearMessage: () => void;
}

export function CraftingPanel({ selectedBase, onItemCrafted, isCrafting, message, onClearMessage }: Props) {
  const handleCraft = async (craftType: 'roll_new' | 'add_mod') => {
    if (!selectedBase) return;
    onClearMessage();
    
    // Optimistic UI update handled via socket, but we keep local loading state
    // Actual crafting happens via socketApi in real app
    // For this prototype, we'll simulate or you can wire socketApi here
    import('../socket/client').then(({ socketApi }) => {
      socketApi.craftItem(selectedBase!.id, craftType).then(res => {
        if (res.success && res.item) onItemCrafted(res.item);
      });
    });
  };

  if (!selectedBase) {
    return (
      <div className="panel-rpg p-6 flex flex-col items-center justify-center text-center h-48 border-dashed border-rpg-borderHover">
        <div className="text-3xl mb-2">📦</div>
        <p className="text-rpg-textMuted">Select an item base to begin crafting</p>
      </div>
    );
  }

  return (
    <div className="panel-rpg p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold">{selectedBase.name}</h2>
          <p className="text-xs text-rpg-textMuted mt-1">ilvl {selectedBase.ilvl} • Max: {selectedBase.maxPrefixes}P / {selectedBase.maxSuffixes}S</p>
        </div>
        <span className="text-xs px-2 py-1 bg-gray-800 rounded border border-rpg-border uppercase">{selectedBase.category}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={() => handleCraft('roll_new')} disabled={isCrafting} className="btn-primary">
          {isCrafting ? '⏳ Rolling...' : '🎲 Roll New'}
        </button>
        <button onClick={() => handleCraft('add_mod')} disabled={isCrafting} className="btn-secondary">
          ➕ Add Mod
        </button>
      </div>

      {message && (
        <div className={`p-2 rounded text-sm text-center border ${
          message.includes('failed') || message.includes('error') ? 'bg-red-900/20 border-red-700 text-red-300' : 
          message.includes('saved') ? 'bg-emerald-900/20 border-emerald-700 text-emerald-300' : 
          'bg-blue-900/20 border-blue-700 text-blue-300'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}