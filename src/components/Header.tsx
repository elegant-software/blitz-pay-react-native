import { Bell, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface HeaderProps {
  onClose?: () => void;
  showClose?: boolean;
  onNavigateToNotifications?: () => void;
}

export default function Header({ onClose, showClose = false, onNavigateToNotifications }: HeaderProps) {
  const { t } = useLanguage();
  return (
    <header className="w-full top-0 sticky z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-outline-variant shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-sm">
          <img
            alt={t('profile')}
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="text-on-surface font-black italic font-headline text-2xl tracking-tighter">
          Blitz<span className="text-primary">Pay</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        {showClose ? (
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          >
            <X className="w-6 h-6 text-on-surface" />
          </button>
        ) : (
          <button 
            onClick={onNavigateToNotifications}
            className="text-on-surface hover:text-primary transition-colors active:scale-95 duration-200 relative"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-surface shadow-sm" />
          </button>
        )}
      </div>
    </header>
  );
}
