'use client';

import { Trash2, Edit2, AlertTriangle } from 'lucide-react';

interface PantryItemProps {
  item: {
    id: string;
    ingredientName: string;
    quantity: number | null;
    unit: string | null;
    expiryDate: string | null;
    category: string | null;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate + 'T00:00:00');
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 3 && diffDays >= 0;
}

function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate + 'T00:00:00');
  return expiry < new Date();
}

export function PantryItem({ item, onEdit, onDelete }: PantryItemProps) {
  const expired = isExpired(item.expiryDate);
  const expiringSoon = isExpiringSoon(item.expiryDate);

  return (
    <div
      className={`flex items-center justify-between rounded-md border p-3 ${
        expired
          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/10'
          : expiringSoon
            ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/10'
            : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {item.ingredientName}
          </span>
          {item.category && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
              {item.category}
            </span>
          )}
          {(expired || expiringSoon) && (
            <span
              className={`flex items-center gap-1 text-xs ${
                expired ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              {expired ? 'Expired' : 'Expiring soon'}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          {item.quantity !== null && (
            <span>
              {item.quantity}
              {item.unit ? ` ${item.unit}` : ''}
            </span>
          )}
          {item.expiryDate && (
            <span>Expires: {item.expiryDate}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(item.id)}
          className="rounded p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="rounded p-1.5 text-zinc-400 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
