'use client';

import { useState, useEffect } from 'react';
import { ShoppingList } from '@/components/meals/ShoppingList';
import { Loader2, ShoppingCart, ListPlus } from 'lucide-react';

interface ShoppingListData {
  id: string;
  name: string;
  storeMode: 'standard' | 'costco';
  status: string;
  mealPlanStartDate: string | null;
  mealPlanEndDate: string | null;
  createdAt: string;
}

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

export default function ShoppingPage() {
  const [lists, setLists] = useState<ShoppingListData[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    storeMode: 'standard' as 'standard' | 'costco',
    subtractPantry: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch('/api/meals/shopping');
      if (res.ok && !cancelled) {
        const data = await res.json();
        setLists(data);
        const activeList = data.find((l: ShoppingListData) => l.status === 'active');
        if (activeList) setActiveListId(activeList.id);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeListId) return;
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/meals/shopping/${activeListId}/items`);
      if (res.ok && !cancelled) {
        setItems(await res.json());
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeListId]);

  async function generateFromPlan(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/meals/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: generateForm.name || 'Shopping List',
        startDate: generateForm.startDate,
        endDate: generateForm.endDate,
        storeMode: generateForm.storeMode,
        subtractPantry: generateForm.subtractPantry,
      }),
    });

    if (res.ok) {
      const newList = await res.json();
      setLists(prev => [newList, ...prev]);
      setActiveListId(newList.id);
      setShowGenerateForm(false);
      setError(null);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to generate shopping list');
    }
  }

  async function toggleItem(itemId: string) {
    if (!activeListId) return;
    const res = await fetch(`/api/meals/shopping/${activeListId}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, action: 'toggle' }),
    });
    if (res.ok) {
      setItems(prev =>
        prev.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i)
      );
    }
  }

  async function deleteItem(itemId: string) {
    if (!activeListId) return;
    const res = await fetch(`/api/meals/shopping/${activeListId}/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== itemId));
    }
  }

  async function addManualItem(ingredientName: string) {
    if (!activeListId) return;
    const res = await fetch(`/api/meals/shopping/${activeListId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientName }),
    });
    if (res.ok) {
      const newItem = await res.json();
      setItems(prev => [...prev, newItem]);
    }
  }

  const activeList = lists.find(l => l.id === activeListId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Shopping Lists
        </h1>
        <button
          onClick={() => setShowGenerateForm(true)}
          className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <ListPlus className="h-4 w-4" />
          Generate from plan
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
          {error.includes('household') && (
            <a href="/meals/settings" className="ml-2 underline">Go to settings</a>
          )}
        </div>
      )}

      {showGenerateForm && (
        <form
          onSubmit={generateFromPlan}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-500">List name</label>
              <input
                type="text"
                value={generateForm.name}
                onChange={(e) => setGenerateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Weekly Shopping"
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Start date</label>
              <input
                type="date"
                required
                value={generateForm.startDate}
                onChange={(e) => setGenerateForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">End date</label>
              <input
                type="date"
                required
                value={generateForm.endDate}
                onChange={(e) => setGenerateForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Store mode</label>
              <select
                value={generateForm.storeMode}
                onChange={(e) => setGenerateForm(f => ({ ...f, storeMode: e.target.value as 'standard' | 'costco' }))}
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                <option value="standard">Standard</option>
                <option value="costco">Costco</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={generateForm.subtractPantry}
                  onChange={(e) => setGenerateForm(f => ({ ...f, subtractPantry: e.target.checked }))}
                  className="rounded border-zinc-300"
                />
                Subtract pantry items
              </label>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowGenerateForm(false)}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Generate
            </button>
          </div>
        </form>
      )}

      {/* List selector */}
      {lists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {lists.map(list => (
            <button
              key={list.id}
              onClick={() => setActiveListId(list.id)}
              className={`shrink-0 rounded-md border px-3 py-1.5 text-sm ${
                activeListId === list.id
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400'
              }`}
            >
              {list.name}
              <span className="ml-1 text-xs opacity-60">
                ({list.storeMode})
              </span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : !activeList ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
          <ShoppingCart className="mb-2 h-8 w-8" />
          <p className="text-sm">No shopping lists yet</p>
          <p className="text-xs">Generate one from your meal plan</p>
        </div>
      ) : (
        <ShoppingList
          items={items}
          onToggleItem={toggleItem}
          onDeleteItem={deleteItem}
          onAddManualItem={addManualItem}
        />
      )}
    </div>
  );
}
