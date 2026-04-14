import { useEffect, useState } from 'react';
import { CraftingPanel } from './components/CraftingPanel';
import { InventoryGrid } from './components/InventoryGrid';
import { ItemBaseSelector } from './components/ItemBaseSelector';
import { ItemInspector } from './components/ItemInspector';
import { socket, socketApi, setupSocketListeners } from './socket/client';
import type { ItemBase, CraftedItem, PlayerInventory, CraftResult } from './types/game';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [availableBases, setAvailableBases] = useState<ItemBase[]>([]);
  const [selectedBase, setSelectedBase] = useState<ItemBase | null>(null);
  const [inventory, setInventory] = useState<PlayerInventory>({ playerId: 'player1', items: [], maxSlots: 20 });
  const [currentCraft, setCurrentCraft] = useState<CraftedItem | null>(null);
  const [inspectedItem, setInspectedItem] = useState<CraftedItem | null>(null);
  const [isCrafting, setIsCrafting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    setupSocketListeners(
      (result: CraftResult) => {
        if (result.success && result.item) setCurrentCraft(result.item);
        else setMessage(result.message);
      },
      (inv: PlayerInventory) => setInventory(inv),
      (bases: ItemBase[]) => setAvailableBases(bases),
      (msg: string) => console.error('Socket error:', msg)
    );
    socketApi.connectPlayer('player1');
    socketApi.getInventory().then(setInventory);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off();
    };
  }, []);

  const handleSaveToInventory = async () => {
    if (!currentCraft) return;
    setIsCrafting(true);
    setMessage('Saving to inventory...');
    const success = await socketApi.saveToInventory(currentCraft);
    if (success) {
      setCurrentCraft(null);
      setMessage('✨ Item saved successfully!');
    } else {
      setMessage('❌ Inventory full or save failed');
    }
    setIsCrafting(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-rpg-border bg-rpg-panel/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl text-rpg-accent drop-shadow-sm">Whitesmith.io</h1>
          <div className="flex items-center gap-3 text-sm">
          <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${
            isConnected ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
            }`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-3 space-y-4">
          <ItemBaseSelector bases={availableBases} onSelect={setSelectedBase} selectedId={selectedBase?.id} />
        </section>

        <section className="lg:col-span-4">
          <CraftingPanel 
            selectedBase={selectedBase} 
            onItemCrafted={setCurrentCraft} 
            playerId="player1"
          />
        </section>

        <section className="lg:col-span-5">
          <InventoryGrid items={inventory.items} maxSlots={inventory.maxSlots} onItemClick={setInspectedItem} />
        </section>
      </main>

      {inspectedItem && <ItemInspector item={inspectedItem} onClose={() => setInspectedItem(null)} />}
    </div>
  );
}

export default App;