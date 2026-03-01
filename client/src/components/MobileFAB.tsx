import { Plus } from 'lucide-react';

interface MobileFABProps {
  onClick: () => void;
}

export default function MobileFAB({ onClick }: MobileFABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed z-40 lg:hidden w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center transition-all"
      style={{
        right: '16px',
        bottom: 'calc(64px + 72px + env(safe-area-inset-bottom, 0px))',
      }}
      title="Add Location"
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}
