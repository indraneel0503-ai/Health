import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'error';
  trend?: string;
}

const colorClasses = {
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
  accent: 'bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-400',
  success: 'bg-success-50 text-success-600 dark:bg-success-700/20 dark:text-success-500',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-700/20 dark:text-warning-500',
  error: 'bg-error-50 text-error-600 dark:bg-error-700/20 dark:text-error-500',
};

export default function StatCard({ title, value, icon, color = 'primary', trend }: StatCardProps) {
  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}
