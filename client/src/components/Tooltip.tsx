import { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  delay?: number;
}

export default function Tooltip({ content, children, delay = 500 }: TooltipProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-dark-900 rounded-lg shadow-lg border border-dark-700/50 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50"
        style={{ transitionDelay: `${delay}ms` }}
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-dark-900" />
      </div>
    </div>
  );
}
