'use client';

import { useState, useEffect } from 'react';
import type { Habit, HabitEntry } from '@/types';

interface HabitCalendarProps {
  habits: Habit[];
}

export function HabitCalendar({ habits }: HabitCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/habits/entries?month=${currentMonth}`);
      if (res.ok && !cancelled) {
        setEntries(await res.json());
      }
    }
    load();
    return () => { cancelled = true; };
  }, [currentMonth]);

  async function toggleHabit(date: string) {
    if (!selectedHabit) return;

    const res = await fetch(
      `/api/habits/${selectedHabit}/toggle?date=${date}`,
      { method: 'POST' }
    );

    if (res.ok) {
      const entriesRes = await fetch(`/api/habits/entries?month=${currentMonth}`);
      if (entriesRes.ok) {
        setEntries(await entriesRes.json());
      }
    }
  }

  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  function getEntriesForDay(day: number) {
    const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
    return entries.filter((e) => e.date === dateStr);
  }

  function prevMonth() {
    const [y, m] = currentMonth.split('-').map(Number);
    const newDate = new Date(y, m - 2, 1);
    setCurrentMonth(
      `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
    );
  }

  function nextMonth() {
    const [y, m] = currentMonth.split('-').map(Number);
    const newDate = new Date(y, m, 1);
    setCurrentMonth(
      `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
    );
  }

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded p-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {monthName}
        </span>
        <button
          onClick={nextMonth}
          className="rounded p-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() =>
              setSelectedHabit(selectedHabit === habit.id ? null : habit.id)
            }
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              selectedHabit === habit.id
                ? 'ring-2 ring-offset-2 dark:ring-offset-zinc-900'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: habit.color + '20',
              color: habit.color,
              ...(selectedHabit === habit.id && { ringColor: habit.color }),
            }}
          >
            {habit.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanks.map((i) => (
          <div key={`blank-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const dayEntries = getEntriesForDay(day);
          const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
          const isToday =
            dateStr === new Date().toISOString().split('T')[0];

          return (
            <button
              key={day}
              onClick={() => toggleHabit(dateStr)}
              disabled={!selectedHabit}
              className={`aspect-square rounded-md p-1 text-xs transition-colors ${
                isToday
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              } ${!selectedHabit ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="text-zinc-700 dark:text-zinc-300">{day}</div>
              <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                {dayEntries.slice(0, 4).map((entry) => {
                  const habit = habits.find((h) => h.id === entry.habitId);
                  return (
                    <div
                      key={entry.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: habit?.color }}
                    />
                  );
                })}
                {dayEntries.length > 4 && (
                  <div className="text-[8px] text-zinc-400">
                    +{dayEntries.length - 4}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
