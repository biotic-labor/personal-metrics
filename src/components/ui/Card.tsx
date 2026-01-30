interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`mb-3 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`text-lg font-semibold text-zinc-900 dark:text-zinc-100 ${className}`}
    >
      {children}
    </h2>
  );
}
