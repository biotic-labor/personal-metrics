'use client';

import { useState, useEffect } from 'react';
import { PantryItem } from '@/components/meals/PantryItem';
import { Plus, Loader2, Refrigerator } from 'lucide-react';

interface PantryItemData {
  id: string;
  ingredientName: string;
  quantity: number | null;
  unit: string | null;
  expiryDate: string | null;
  category: string | null;
}

export default function PantryPage() {
  const [items, setItems] = useState<PantryItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ingredientName: '',
    quantity: '',
    unit: '',
    expiryDate: '',
    category: '',
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch('/api/meals/pantry');
      if (res.ok && !cancelled) {
        setItems(await res.json());
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function fetchItems() {
    setLoading(true);
    const res = await fetch('/api/meals/pantry');
    if (res.ok) {
      setItems(await res.json());
    }
    setLoading(false);
  }

  function resetForm() {
    setFormData({ ingredientName: '', quantity: '', unit: '', expiryDate: '', category: '' });
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      ingredientName: formData.ingredientName,
      quantity: formData.quantity ? parseFloat(formData.quantity) : null,
      unit: formData.unit || null,
      expiryDate: formData.expiryDate || null,
      category: formData.category || null,
    };

    if (editingId) {
      const res = await fetch(`/api/meals/pantry?id=${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchItems();
        resetForm();
      }
    } else {
      const res = await fetch('/api/meals/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchItems();
        resetForm();
      }
    }
  }

  function handleEdit(id: string) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setFormData({
      ingredientName: item.ingredientName,
      quantity: item.quantity?.toString() || '',
      unit: item.unit || '',
      expiryDate: item.expiryDate || '',
      category: item.category || '',
    });
    setEditingId(id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/meals/pantry?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  }

  // Group by category
  const grouped = items.reduce<Record<string, PantryItemData[]>>((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Pantry
        </h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-500">Ingredient name</label>
              <input
                type="text"
                required
                value={formData.ingredientName}
                onChange={(e) => setFormData(f => ({ ...f, ingredientName: e.target.value }))}
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Quantity</label>
              <input
                type="number"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData(f => ({ ...f, quantity: e.target.value }))}
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(f => ({ ...f, unit: e.target.value }))}
                placeholder="e.g. cups, lbs, oz"
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Expiry date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(f => ({ ...f, expiryDate: e.target.value }))}
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                <option value="">Select category</option>
                <option value="Produce">Produce</option>
                <option value="Meat/Seafood">Meat/Seafood</option>
                <option value="Dairy">Dairy</option>
                <option value="Bakery">Bakery</option>
                <option value="Frozen">Frozen</option>
                <option value="Pantry/Dry Goods">Pantry/Dry Goods</option>
                <option value="Spices">Spices</option>
                <option value="Condiments">Condiments</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
          <Refrigerator className="mb-2 h-8 w-8" />
          <p className="text-sm">Your pantry is empty</p>
          <p className="text-xs">Add items to track what you have on hand</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, categoryItems]) => (
            <div key={category}>
              <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {category}
              </h2>
              <div className="space-y-1">
                {categoryItems.map(item => (
                  <PantryItem
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
