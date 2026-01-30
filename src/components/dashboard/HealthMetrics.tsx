'use client';

import { useState, useEffect } from 'react';
import type { HealthMetrics as HealthMetricsType } from '@/types';

export function HealthMetrics() {
  const [metrics, setMetrics] = useState<HealthMetricsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch('/api/health');
      if (res.ok && !cancelled) {
        const data = await res.json();
        setMetrics(data);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function saveMetrics(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await fetch('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        steps: formData.get('steps') ? Number(formData.get('steps')) : null,
        calories: formData.get('calories') ? Number(formData.get('calories')) : null,
        restingHr: formData.get('restingHr') ? Number(formData.get('restingHr')) : null,
        workoutMinutes: formData.get('workoutMinutes') ? Number(formData.get('workoutMinutes')) : null,
      }),
    });

    if (res.ok) {
      setMetrics(await res.json());
      setEditing(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-zinc-500">Loading...</div>;
  }

  if (editing) {
    return (
      <form onSubmit={saveMetrics} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400">Steps</label>
            <input
              name="steps"
              type="number"
              defaultValue={metrics?.steps ?? ''}
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400">Calories</label>
            <input
              name="calories"
              type="number"
              defaultValue={metrics?.calories ?? ''}
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400">Resting HR</label>
            <input
              name="restingHr"
              type="number"
              defaultValue={metrics?.restingHr ?? ''}
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400">Workout (min)</label>
            <input
              name="workoutMinutes"
              type="number"
              defaultValue={metrics?.workoutMinutes ?? ''}
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded px-3 py-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  const hasData = metrics && (
    metrics.steps !== null ||
    metrics.calories !== null ||
    metrics.restingHr !== null ||
    metrics.workoutMinutes !== null
  );

  return (
    <div>
      {hasData ? (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Steps" value={metrics.steps} format={(v) => v.toLocaleString()} />
          <MetricCard label="Calories" value={metrics.calories} format={(v) => `${v} kcal`} />
          <MetricCard label="Resting HR" value={metrics.restingHr} format={(v) => `${v} bpm`} />
          <MetricCard label="Workout" value={metrics.workoutMinutes} format={(v) => `${v} min`} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No data for today
        </p>
      )}
      <button
        onClick={() => setEditing(true)}
        className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        {hasData ? 'Edit' : '+ Add data'}
      </button>
    </div>
  );
}

function MetricCard({
  label,
  value,
  format,
}: {
  label: string;
  value: number | null;
  format: (v: number) => string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {value !== null ? format(value) : '-'}
      </div>
    </div>
  );
}
