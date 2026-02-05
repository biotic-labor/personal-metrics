'use client';

import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';

interface ShoppingItem {
  id: string;
  ingredientName: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  checked: boolean;
  fromRecipeId: number | null;
  addedManually: boolean;
}

interface ShoppingListProps {
  items: ShoppingItem[];
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onAddManualItem: (ingredientName: string) => void;
}

export function ShoppingList({
  items,
  onToggleItem,
  onDeleteItem,
  onAddManualItem,
}: ShoppingListProps) {
  const [manualInput, setManualInput] = useState('');

  // Group items by category
  const grouped = items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    if (manualInput.trim()) {
      onAddManualItem(manualInput.trim());
      setManualInput('');
    }
  }

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <div className="space-y-4">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        {checkedCount} of {items.length} items checked
      </div>

      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {category}
            </h3>
            <div className="space-y-0.5">
              {categoryItems.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                    item.checked
                      ? 'bg-zinc-50 dark:bg-zinc-800/50'
                      : 'bg-white dark:bg-zinc-800'
                  }`}
                >
                  <button
                    onClick={() => onToggleItem(item.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      item.checked
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {item.checked && <Check className="h-3 w-3" />}
                  </button>

                  <div className={`flex-1 text-sm ${
                    item.checked
                      ? 'text-zinc-400 line-through dark:text-zinc-500'
                      : 'text-zinc-900 dark:text-zinc-100'
                  }`}>
                    {item.ingredientName}
                    {item.quantity !== null && (
                      <span className="ml-1 text-zinc-500">
                        ({item.quantity}{item.unit ? ` ${item.unit}` : ''})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="shrink-0 rounded p-1 text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

      <form onSubmit={handleAddManual} className="flex gap-2">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Add item manually..."
          className="flex-1 rounded-md border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={!manualInput.trim()}
          className="flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </form>
    </div>
  );
}
