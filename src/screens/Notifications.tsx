import { 
  ArrowLeft, 
  Bell, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  ShoppingBag, 
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

interface NotificationsProps {
  onBack: () => void;
  onNavigateToInvoices: () => void;
}

export default function Notifications({ onBack, onNavigateToInvoices }: NotificationsProps) {
  const { t } = useLanguage();
  const notifications = [
    {
      id: '1',
      type: 'reminder',
      title: t('invoice_reminder'),
      message: t('invoice_reminder_msg'),
      time: t('two_h_ago'),
      icon: Calendar,
      color: 'bg-primary-container text-secondary-container',
      action: t('view_invoice'),
      onClick: onNavigateToInvoices
    },
    {
      id: '2',
      type: 'security',
      title: t('new_login_detected'),
      message: t('new_login_msg'),
      time: t('five_h_ago'),
      icon: ShieldCheck,
      color: 'bg-secondary-container text-on-secondary-fixed',
      action: t('review_security')
    },
    {
      id: '3',
      type: 'transaction',
      title: t('payment_successful'),
      message: t('payment_successful_msg'),
      time: t('yesterday'),
      icon: CheckCircle2,
      color: 'bg-surface-container-highest text-on-surface',
      action: t('view_receipt')
    },
    {
      id: '4',
      type: 'alert',
      title: t('low_balance_alert'),
      message: t('low_balance_msg'),
      time: t('two_days_ago'),
      icon: AlertCircle,
      color: 'bg-surface-container-low text-on-surface-variant',
      action: t('add_funds')
    }
  ];

  return (
    <div className="fixed inset-0 z-[110] bg-surface flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              {t('updates_alerts')}
            </span>
            <span className="font-headline font-bold text-lg">{t('notifications')}</span>
          </div>
        </div>
        <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-on-surface-variant" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-8 pb-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-headline font-extrabold text-2xl mb-1">{t('recent_activity_notif')}</h2>
            <p className="text-on-surface-variant text-sm">{t('stay_updated')}</p>
          </div>
          <button className="text-secondary font-bold text-sm">{t('clear_all')}</button>
        </div>

        <div className="space-y-4">
          {notifications.map((notif, i) => {
            const Icon = notif.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-5 bg-white rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${notif.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-on-surface truncate pr-2">{notif.title}</h3>
                      <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{notif.time}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                      {notif.message}
                    </p>
                    
                    {notif.action && (
                      <button 
                        onClick={notif.onClick}
                        className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest group-hover:gap-3 transition-all"
                      >
                        {notif.action}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State Hint */}
        <div className="mt-12 p-8 border-2 border-dashed border-outline-variant/20 rounded-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-on-surface-variant/40" />
          </div>
          <p className="text-sm font-medium text-on-surface-variant">
            {t('all_caught_up')}
          </p>
          <p className="text-xs text-on-surface-variant/60 mt-1">
            {t('notify_important')}
          </p>
        </div>
      </main>
    </div>
  );
}
