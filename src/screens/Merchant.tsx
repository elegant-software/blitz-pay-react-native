import { ArrowLeft, Share2, Heart, Clock, MapPin, Verified, Bolt, Mic, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

interface MerchantProps {
  onBack: () => void;
  onPayNow: () => void;
}

export default function Merchant({ onBack, onPayNow }: MerchantProps) {
  const { t } = useLanguage();
  return (
    <main className="pb-32">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 w-full border-b border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center p-2 rounded-full bg-white/[0.03] shadow-sm active:scale-95 transition-transform border border-white/10"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <span className="font-headline font-black text-2xl tracking-tighter text-white italic">
            Blitz<span className="text-primary">Pay</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Share2 className="w-6 h-6 text-white/60 hover:text-primary transition-colors cursor-pointer" />
          <Heart className="w-6 h-6 text-white/60 hover:text-red-400 transition-colors cursor-pointer" />
        </div>
      </nav>

      {/* Merchant Header */}
      <header className="px-6 pt-8 pb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-headline font-extrabold text-3xl tracking-tight text-white">
            Main Street Market
          </h1>
          <Verified className="w-6 h-6 text-primary fill-primary text-primary-container" />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/40 text-sm font-medium">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{t('open_until')} 9:00 PM</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>242 Main St, Downtown</span>
          </div>
        </div>
      </header>

      {/* Hero Product Card */}
      <section className="px-6 mb-12">
        <div className="bg-surface-container-high rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative border border-white/5">
          <div className="aspect-[4/5] w-full relative">
            <img
              alt="Sourdough starter"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkNbC2KnK3i-I2RYDKakweg5g-zTCw2CyCb5sNDd6QU8yBQEzXtkIyJRltywTpjLeDFTNaVhs_6iKwEm_w9Mr8GfCBuL48S71VOSK-g0IgElA831SzaFKKiX8mMwBisVMtZ0xFrBML1Wct8luuGJyHOuCeAwIt4GMvhi9SURAE0v-224DgNKGbC088s2hF6QERLq4zgOui4hDf_Q4-qkT1lTz4YR90J-dkrjm42fc4CI0l4E-xpCXFcKM--xdKFw-c3Tu7lGKoKgYW"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block border border-primary/30 backdrop-blur-md">
                {t('featured_craft')}
              </span>
              <h2 className="font-headline font-bold text-2xl leading-tight mb-1">
                Premium Sourdough Starter Kit
              </h2>
              <p className="text-white/60 text-sm font-medium">
                Heirloom 50-year culture, organic rye flour, and fermentation jar.
              </p>
            </div>
          </div>
          <div className="p-6 flex flex-col gap-6">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-white/40 text-xs uppercase tracking-widest font-bold">
                  {t('price')}
                </span>
                <span className="font-headline font-extrabold text-3xl text-white drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                  $45.00
                </span>
              </div>
              <div className="flex items-center gap-1 text-primary font-bold text-sm">
                <Bolt className="w-4 h-4 fill-current" />
                <span>{t('blitz_verified')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onPayNow}
                className="flex-1 bg-primary text-primary-container font-extrabold py-4 rounded-full active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
              >
                {t('pay_now')}
              </button>
              <button className="flex-1 bg-white/5 text-white font-extrabold py-4 rounded-full active:scale-95 transition-all border border-white/10">
                {t('reserve')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Blitz Assistant Intelligence Card */}
      <section className="px-6 mb-12">
        <div className="bg-primary/10 p-8 rounded-xl relative overflow-hidden group border border-primary/20">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <Mic className="w-6 h-6 text-primary fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-primary/60 text-[10px] font-bold uppercase tracking-widest">
                  {t('blitz_assistant')}
                </span>
                <span className="text-white font-headline font-bold">
                  {t('price_intelligence')}
                </span>
              </div>
            </div>
            <p className="text-white/90 font-headline text-lg leading-relaxed mb-6 italic">
              "{t('cheaper_elsewhere')}"
            </p>
            <button className="inline-flex items-center gap-2 text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-full border border-primary/20 hover:bg-primary/20 transition-colors">
              {t('compare_prices')}
              <TrendingDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* More from Merchant Carousel */}
      <section>
        <div className="px-6 mb-6 flex justify-between items-end">
          <h3 className="font-headline font-extrabold text-xl text-on-background">
            {t('more_from_merchant')}
          </h3>
          <button className="text-secondary font-bold text-sm">{t('view_all')}</button>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar gap-4 px-6">
          {[
            {
              name: 'Organic Rye Flour',
              price: '$12.00',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-Hpf8382kW0i2wwdI_pm5eJM2chbWjmWOnBHn0AxK74aheFOMAEIzkgjDIVp7vUM5a23WwJWJitSXx9B5RryT5CdL6TcwW8lAedo8ViCadGKzZWf96ig4WLub3u00GA_afUU4fY0lz4ejy9TCEdXLjUQlnMFKGw56sltxi6KimWAj_iW0TAG6W8a6DeIioTomN5Ws2s3YdvJ90ocMSvJOQPP9tt2OITy7_-G3ArlnVa23Ncrx592v2SfrcEl0ZWEVBhhUz5uRi9Sp',
            },
            {
              name: 'Rattan Proofing Basket',
              price: '$28.00',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClI2OLgCzNztBY33p4bH9zvbHm7v3WDgCDIuF-kgNEjCKjnFpozDdwGOvftf3XcwDmFGjUUaCrCXpjSJeEP3GKhnH7ROKYBZHO37V8xXaUnQcKqCIfaRCVV6pbWmWyVOXcgtT1rgm9k4c1p4uwSsl5CrnnlAG1_thyZm5KCzAZIGmR-ne3n8tr6shF4ZLeI6J0HBrupJyGjTluAsTMyT7cBfrbWUDGmtUWc2b9XC9WdX_WAo-zmO95hdIOB7PxRNhxfoA5CWWTwKC5',
            },
          ].map((item, i) => (
            <div key={i} className="flex-shrink-0 w-44">
              <div className="aspect-square rounded-xl overflow-hidden bg-surface-container mb-3">
                <img
                  alt={item.name}
                  className="w-full h-full object-cover"
                  src={item.img}
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-bold text-on-background block leading-tight mb-1">
                {item.name}
              </span>
              <span className="text-on-surface-variant text-sm font-medium">
                {item.price}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
