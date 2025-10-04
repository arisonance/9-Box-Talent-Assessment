import { ComponentType } from 'react';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  trend?: number;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = 'bg-blue-600',
  trend,
  onClick,
  active = false,
  className = '',
}: StatCardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`
        bg-white rounded-xl border-2 p-6 transition-all
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
        ${active ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center space-x-1 text-xs font-semibold ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </Component>
  );
}
