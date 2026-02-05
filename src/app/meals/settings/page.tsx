'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Shield, Users, AlertTriangle } from 'lucide-react';

interface Household {
  id: string;
  name: string;
}

interface HouseholdMember {
  id: string;
  userId: string;
  role: string;
}

interface HouseholdAllergen {
  id: string;
  allergenKey: string;
  keywords: string;
  severity: 'exclude' | 'warn';
  isActive: boolean;
}

const COMMON_ALLERGENS = [
  { key: 'peanut', label: 'Peanut' },
  { key: 'treenut', label: 'Tree Nuts' },
  { key: 'dairy', label: 'Dairy' },
  { key: 'egg', label: 'Egg' },
  { key: 'wheat', label: 'Wheat' },
  { key: 'gluten', label: 'Gluten' },
  { key: 'soy', label: 'Soy' },
  { key: 'fish', label: 'Fish' },
  { key: 'shellfish', label: 'Shellfish' },
  { key: 'sesame', label: 'Sesame' },
];

export default function SettingsPage() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [allergens, setAllergens] = useState<HouseholdAllergen[]>([]);
  const [loading, setLoading] = useState(true);
  const [householdName, setHouseholdName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [showAllergenForm, setShowAllergenForm] = useState(false);
  const [selectedAllergen, setSelectedAllergen] = useState('');
  const [allergenSeverity, setAllergenSeverity] = useState<'exclude' | 'warn'>('exclude');
  const [confirmDisable, setConfirmDisable] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch('/api/meals/household');
      if (res.ok && !cancelled) {
        const data = await res.json();
        if (data.household) {
          setHousehold(data.household);
          setMembers(data.members || []);
          setAllergens(data.allergens || []);
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function fetchHousehold() {
    setLoading(true);
    const res = await fetch('/api/meals/household');
    if (res.ok) {
      const data = await res.json();
      if (data.household) {
        setHousehold(data.household);
        setMembers(data.members || []);
        setAllergens(data.allergens || []);
      }
    }
    setLoading(false);
  }

  async function createHousehold(e: React.FormEvent) {
    e.preventDefault();
    if (!householdName.trim()) return;

    const res = await fetch('/api/meals/household', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: householdName }),
    });

    if (res.ok) {
      await fetchHousehold();
      setHouseholdName('');
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    const res = await fetch('/api/meals/household/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newMemberEmail }),
    });

    if (res.ok) {
      await fetchHousehold();
      setNewMemberEmail('');
    }
  }

  async function removeMember(memberId: string) {
    const res = await fetch(`/api/meals/household/members?id=${memberId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.id !== memberId));
    }
  }

  async function addAllergen(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAllergen) return;

    const res = await fetch('/api/meals/household/allergens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        allergenKey: selectedAllergen,
        severity: allergenSeverity,
      }),
    });

    if (res.ok) {
      await fetchHousehold();
      setShowAllergenForm(false);
      setSelectedAllergen('');
    }
  }

  async function toggleAllergen(allergenId: string) {
    const allergen = allergens.find(a => a.id === allergenId);
    if (!allergen) return;

    // Require confirmation to disable an allergen
    if (allergen.isActive) {
      setConfirmDisable(allergenId);
      return;
    }

    await updateAllergenStatus(allergenId, true);
  }

  async function updateAllergenStatus(allergenId: string, isActive: boolean) {
    const res = await fetch('/api/meals/household/allergens', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: allergenId, isActive }),
    });
    if (res.ok) {
      setAllergens(prev =>
        prev.map(a => a.id === allergenId ? { ...a, isActive } : a)
      );
      setConfirmDisable(null);
    }
  }

  async function removeAllergen(allergenId: string) {
    const res = await fetch(`/api/meals/household/allergens?id=${allergenId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setAllergens(prev => prev.filter(a => a.id !== allergenId));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!household) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Settings
        </h1>
        <div className="mx-auto max-w-md rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Create your household
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            A household lets you share meal plans, pantry, and shopping lists with family members.
          </p>
          <form onSubmit={createHousehold} className="space-y-3">
            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="Household name (e.g. Nelson Family)"
              required
              className="w-full rounded border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Create Household
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeAllergenKeys = new Set(allergens.filter(a => a.isActive).map(a => a.allergenKey));
  const availableAllergens = COMMON_ALLERGENS.filter(a => !activeAllergenKeys.has(a.key));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        Settings
      </h1>

      {/* Household info */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Users className="h-4 w-4" />
          Household: {household.name}
        </h2>

        <div className="space-y-2">
          {members.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2 dark:border-zinc-700"
            >
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                {member.userId}
                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                  {member.role}
                </span>
              </div>
              {member.role !== 'admin' && (
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={addMember} className="mt-3 flex gap-2">
          <input
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder="Add member by email..."
            className="flex-1 rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={!newMemberEmail.trim()}
            className="flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </form>
      </div>

      {/* Allergen configuration */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Shield className="h-4 w-4" />
          Allergen Exclusions
        </h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Excluded allergens will be completely filtered from recipe search results.
          Warnings will show an alert badge but still display the recipe.
        </p>

        <div className="space-y-2">
          {allergens.map(allergen => {
            const label = COMMON_ALLERGENS.find(a => a.key === allergen.allergenKey)?.label || allergen.allergenKey;
            return (
              <div
                key={allergen.id}
                className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                  allergen.isActive
                    ? allergen.severity === 'exclude'
                      ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/10'
                      : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/10'
                    : 'border-zinc-100 bg-zinc-50 opacity-50 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {label}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    allergen.severity === 'exclude'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {allergen.severity}
                  </span>
                  {!allergen.isActive && (
                    <span className="text-xs text-zinc-400">(disabled)</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleAllergen(allergen.id)}
                    className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    {allergen.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => removeAllergen(allergen.id)}
                    className="rounded p-1 text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {showAllergenForm ? (
          <form onSubmit={addAllergen} className="mt-3 space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Allergen</label>
              <select
                value={selectedAllergen}
                onChange={(e) => setSelectedAllergen(e.target.value)}
                required
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                <option value="">Select allergen...</option>
                {availableAllergens.map(a => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Severity</label>
              <select
                value={allergenSeverity}
                onChange={(e) => setAllergenSeverity(e.target.value as 'exclude' | 'warn')}
                className="w-full rounded border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                <option value="exclude">Exclude (filter from results)</option>
                <option value="warn">Warn (show badge only)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAllergenForm(false)}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Add
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAllergenForm(true)}
            className="mt-3 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Add allergen exclusion
          </button>
        )}
      </div>

      {/* Confirmation dialog for disabling allergens */}
      {confirmDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-4 shadow-xl dark:bg-zinc-800">
            <div className="mb-3 flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">Confirm Disable</h3>
            </div>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Disabling this allergen exclusion means recipes containing this allergen
              may appear in search results. Are you sure?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDisable(null)}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-500"
              >
                Cancel
              </button>
              <button
                onClick={() => updateAllergenStatus(confirmDisable, false)}
                className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
              >
                Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
