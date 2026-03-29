import { MapPin, Search, Wallet, QrCode, Star, ChevronRight, Bolt, ReceiptText, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

interface ExploreProps {
  onNavigateToMerchant: () => void;
  onNavigateToMyQR: () => void;
  onNavigateToScanQR: () => void;
  onNavigateToSendInvoice: () => void;
}

export default function Explore({ onNavigateToMerchant, onNavigateToMyQR, onNavigateToScanQR, onNavigateToSendInvoice }: ExploreProps) {
  const { t } = useLanguage();
  return (
    <main className="px-6 space-y-8 mt-4 pb-32">
      {/* Location Aware Header & Search */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-secondary fill-secondary" />
          <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">
            Downtown, NY
          </h1>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-on-surface-variant/60" />
          </div>
          <input
            className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest rounded-full border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-secondary transition-all placeholder:text-on-surface-variant/60 text-on-surface"
            placeholder={t('search_placeholder')}
            type="text"
          />
        </div>
      </section>

      {/* Quick Action Tiles */}
      <section className="grid grid-cols-2 gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onNavigateToMyQR}
          className="bg-primary text-white p-6 rounded-2xl flex flex-col justify-between h-40 shadow-lg text-left border border-primary/10"
        >
          <QrCode className="w-10 h-10" />
          <div className="space-y-1">
            <p className="font-headline font-extrabold text-lg">{t('my_qr')}</p>
            <p className="text-[10px] opacity-70 font-sans tracking-widest uppercase font-bold">
              {t('show_my_qr')}
            </p>
          </div>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onNavigateToScanQR}
          className="bg-white text-on-surface p-6 rounded-2xl flex flex-col justify-between h-40 shadow-md text-left border border-outline-variant"
        >
          <div className="relative">
            <QrCode className="w-10 h-10 text-primary" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
              <Search className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-headline font-extrabold text-lg">{t('scan_qr')}</p>
            <p className="text-[10px] text-on-surface-variant font-sans tracking-widest uppercase font-bold">
              {t('scan_merchant_qr')}
            </p>
          </div>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => (window as any).navigateToInvoices?.()}
          className="col-span-2 bg-white text-on-surface p-6 rounded-2xl flex items-center justify-between shadow-sm text-left border border-outline-variant"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shadow-sm border border-primary/20">
              <ReceiptText className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="font-headline font-extrabold text-lg">{t('invoices')}</p>
              <p className="text-[10px] text-on-surface-variant/60 font-sans tracking-widest uppercase font-bold">
                {t('pending_payments')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">2 {t('pending')}</span>
            <ChevronRight className="w-5 h-5 opacity-40" />
          </div>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onNavigateToSendInvoice}
          className="col-span-2 bg-white text-on-surface p-6 rounded-2xl flex items-center justify-between shadow-sm text-left border border-outline-variant"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shadow-sm border border-primary/20">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="font-headline font-extrabold text-lg">{t('send_invoice')}</p>
              <p className="text-[10px] text-on-surface-variant/60 font-sans tracking-widest uppercase font-bold">
                {t('request_payment')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-40" />
        </motion.button>
      </section>

      {/* Featured Event Card */}
      <section>
        <h2 className="font-headline font-bold text-xl mb-4 text-on-surface">
          {t('happening_now')}
        </h2>
        <div className="relative w-full h-64 rounded-xl overflow-hidden group">
          <img
            alt="Summer Jazz Festival"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjsMae9BG0qoCZhG5sO0K0EdMtJ2NYCvvUxMODVzjnHn4CvSivBBJMFJjt7xgT-AwONkRSNQFVuf0J_TpMG644LpHAdcxd72fXKMx3fVf3NS7_E8gafjYkndUCszvoRvAs0ubmfjoR6-O1wtHv_s48_UxkbDMvq4SvM9CmJkl7g9pWtTCuP9WhnvCg_pueRs2JrPbmtPoczQhWrkfKBxvDt3NG-3bTLTTfixeHSZfGUj18vJ7rYGzG6G1ajFzjsoPvlHT5RdbLb1uM"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
            <span className="bg-secondary-container text-on-secondary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit mb-2">
              {t('featured')}
            </span>
            <h3 className="font-headline font-extrabold text-2xl text-white mb-1">
              Summer Jazz Festival
            </h3>
            <p className="text-white/80 text-sm font-medium">
              Tickets & exclusive merch available
            </p>
          </div>
        </div>
      </section>

      {/* Nearby Merchants */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="font-headline font-bold text-xl text-on-surface">
            {t('nearby_merchants')}
          </h2>
          <button className="text-secondary font-bold text-sm">{t('see_all')}</button>
        </div>
        <div className="space-y-4">
          {/* Merchant 1 */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onNavigateToMerchant}
            className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container">
              <img
                alt="Velvet Brews"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5F6T5la48VoEsPpXGbyQsCyEafHk3LSmIufJ9egrP2fMBOzdFfTcCm6Tec-GHG_g-Atk6o4-VBmiqT_9DtTsKlxiTwFTD1uPDPQFpBe2x56LKbE6KISx92WqfkdRBm45L9kib-s72fNaKXj-T9Tlttt30M4enFvCuH318Mjr3C-HR_qzhUREOCMLSzuVHYJgNv7S8Gku21X2oYKwQ-3C5d0DMUJeimktk8_lA3nhJfZd9bQVJw35r1Xr3KA1Z73HHHb4cfFAuWoKf"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-grow">
              <h4 className="font-headline font-bold text-on-surface">
                Velvet Brews
              </h4>
              <p className="text-on-surface-variant text-sm">
                Specialty Coffee • 0.2 mi
              </p>
              <div className="flex items-center gap-1 mt-1 text-on-secondary-container">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold">4.9</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-outline-variant" />
          </motion.div>
          {/* Merchant 2 */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onNavigateToMerchant}
            className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container">
              <img
                alt="Main Street Market"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSEiCqLLvKe81e4KDEloA79BMLjZ1lw5undzlZrYwyiES4LBGa2JVLuPXWiHGeNtnonx-Kd91Ry9OoGKCWX4VDGPsgmFeKE4ZzQWlXDkbNUPsZR6x-YREKjFeTlmcGipSsWSm0-y6BHxwxJOaBRSq7XMbGWMfpkKCVl-PcYOF_iwSNXfzWY-aGCGCCf-WGFuYGNOBAP9V-acnbDy7q1XO_PFS0IYXs43Ii5hGQodqlmrPmBfR8JhGiKBznPvbRM6Nk2zhXPSSUwCkK"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-grow">
              <h4 className="font-headline font-bold text-on-surface">
                Main Street Market
              </h4>
              <p className="text-on-surface-variant text-sm">
                Organic Grocer • 0.5 mi
              </p>
              <div className="flex items-center gap-1 mt-1 text-on-secondary-container">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold">4.7</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-outline-variant" />
          </motion.div>
        </div>
      </section>

    </main>
  );
}
