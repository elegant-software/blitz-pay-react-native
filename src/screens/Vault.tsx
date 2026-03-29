import { Ticket, ShoppingBag, ChevronRight, Calendar, MapPin, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

export default function Vault() {
  const { t } = useLanguage();
  const assets = [
    {
      id: '1',
      type: 'ticket',
      title: 'After Hours: Modern Art',
      location: 'Tate Modern, London',
      date: 'Sat, 12 Apr • 20:00',
      price: '$45.00',
      status: 'upcoming',
      color: 'bg-primary-container text-secondary-container',
    },
    {
      id: '2',
      type: 'purchase',
      title: 'Studio Alchemists Kit',
      location: 'Digital Asset',
      date: 'Today, 14:22',
      price: '$1,240.00',
      status: 'confirmed',
      color: 'bg-secondary-container text-on-secondary-fixed',
    },
    {
      id: '3',
      type: 'ticket',
      title: 'Gourmet Tasting Menu',
      location: 'Main Street Market',
      date: 'Sun, 30 Mar • 19:30',
      price: '$120.00',
      status: 'upcoming',
      color: 'bg-surface-container-highest text-on-surface',
    },
    {
      id: '4',
      type: 'purchase',
      title: 'Vintage Leather Jacket',
      location: 'The Archive Store',
      date: '24 Mar, 11:05',
      price: '$350.00',
      status: 'delivered',
      color: 'bg-surface-container-low text-on-surface-variant',
    },
  ];

  return (
    <main className="px-6 pt-8 pb-32 max-w-lg mx-auto">
      {/* Header Section */}
      <section className="mb-10 flex justify-between items-start">
        <div>
          <span className="font-headline font-bold text-[11px] uppercase tracking-[0.2em] text-secondary mb-3 block">
            {t('your_collection')}
          </span>
          <h1 className="font-headline font-extrabold text-4xl leading-tight tracking-tight text-on-surface">
            {t('vault')}
          </h1>
        </div>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-primary/10 text-primary px-4 py-2 rounded-2xl flex flex-col items-end shadow-sm border border-primary/20"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t('blitz_points')}</span>
          <span className="font-headline font-extrabold text-xl">2,450</span>
        </motion.div>
      </section>
      <p className="text-on-surface-variant mb-8 -mt-6">
        {t('manage_assets')}
      </p>

      {/* Search/Filter Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
        <input
          type="text"
          placeholder={t('search_assets')}
          className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/50 transition-all outline-none shadow-sm"
        />
      </div>

      {/* Asset List */}
      <div className="space-y-4">
        {assets.map((asset, i) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.98 }}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-outline-variant cursor-pointer"
          >
            <div className="p-5 flex gap-4">
              {/* Icon Box */}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/20 shadow-sm`}>
                {asset.type === 'ticket' ? <Ticket className="w-7 h-7" /> : <ShoppingBag className="w-7 h-7" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-on-surface truncate pr-2">{asset.title}</h3>
                  <span className="font-headline font-bold text-primary">{asset.price}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{asset.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <Calendar className="w-3 h-3" />
                    <span>{asset.date}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-3 flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    asset.status === 'upcoming' ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    {t(asset.status as any)}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <ChevronRight className="w-5 h-5 text-on-surface-variant/20 group-hover:text-primary transition-colors" />
              </div>
            </div>

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Empty State Hint */}
      <div className="mt-12 p-8 border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center text-center bg-surface-container/50">
        <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center mb-4 border border-outline-variant">
          <ShoppingBag className="w-6 h-6 text-on-surface-variant/20" />
        </div>
        <p className="text-sm font-medium text-on-surface-variant">
          {t('purchased_new')}
        </p>
        <p className="text-xs text-on-surface-variant/60 mt-1">
          {t('auto_appear')}
        </p>
      </div>
    </main>
  );
}
