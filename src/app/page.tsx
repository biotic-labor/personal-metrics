import { Header } from '@/components/dashboard/Header';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { HabitCalendar } from '@/components/dashboard/HabitCalendar';
import { HabitSummary } from '@/components/dashboard/HabitSummary';
import { BookLibrary } from '@/components/dashboard/BookLibrary';
import { HealthMetrics } from '@/components/dashboard/HealthMetrics';
import { db } from '@/lib/db';
import { habits } from '../../drizzle/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getHabits() {
  return db.query.habits.findMany({
    where: eq(habits.active, true),
    orderBy: [asc(habits.sortOrder)],
  });
}

export default async function Dashboard() {
  const allHabits = await getHabits();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Header />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Habits */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Habits</CardTitle>
              </CardHeader>
              <HabitCalendar habits={allHabits} />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <HabitSummary />
            </Card>
          </div>

          {/* Right column - Books & Health */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Currently Reading</CardTitle>
              </CardHeader>
              <BookLibrary />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health</CardTitle>
              </CardHeader>
              <HealthMetrics />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
