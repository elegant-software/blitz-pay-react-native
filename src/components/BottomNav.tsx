import { Compass, Mic, Wallet, User } from 'lucide-react';
import { Screen } from '../types';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const { t } = useLanguage();
  const navItems = [
    { id: 'explore' as Screen, label: t('explore'), icon: Compass },
    { id: 'assistant' as Screen, label: t('assistant'), icon: Mic },
    { id: 'vault' as Screen, label: t('vault'), icon: Wallet },
    { id: 'account' as Screen, label: t('account'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-8 pb-8 pt-4 bg-surface/80 backdrop-blur-xl rounded-t-[2rem] z-50 border-t border-outline-variant shadow-[0_-8px_32px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center transition-all duration-300 ease-in-out ${
              isActive
                ? 'text-primary scale-110 font-bold'
                : 'text-on-surface-variant/40 hover:text-primary/60'
            }`}
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center"
            >
              <div className={`p-2 rounded-xl mb-1 transition-all duration-300 ${isActive ? 'bg-primary/10 shadow-sm' : 'bg-transparent'}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : ''}`} />
              </div>
              <span className="font-headline font-bold text-[10px] uppercase tracking-widest">
                {item.label}
              </span>
            </motion.div>
          </button>
        );
      })}
    </nav>
  );
}
