import { Map, Compass, Heart, User } from 'lucide-react';
import { Bike } from 'lucide-react';
import { hapticLight } from '../utils/haptics';

export type MobileTab = 'map' | 'explore' | 'trips' | 'saved' | 'profile';

interface MobileBottomTabsProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string; icon: typeof Map }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'explore', label: 'Explore', icon: Bike },
  { id: 'trips', label: 'Trips', icon: Compass },
  { id: 'saved', label: 'Saved', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function MobileBottomTabs({ activeTab, onTabChange }: MobileBottomTabsProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden mobile-bottom-tabs bg-dark-950/95 backdrop-blur-lg border-t border-dark-700/50">
      <div className="flex items-center justify-around h-14">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { hapticLight(); onTabChange(id); }}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                isActive
                  ? 'text-orange-400'
                  : 'text-gray-500 active:text-gray-300'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
