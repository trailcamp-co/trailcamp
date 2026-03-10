import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-gray-200 font-medium text-sm mb-1">{title}</h3>
      {description && <p className="text-gray-400 text-xs mb-4 max-w-[240px]">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
