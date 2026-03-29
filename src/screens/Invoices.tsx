import { ArrowLeft, ReceiptText, ShieldCheck, ChevronRight, Calendar, Building2, ArrowRight, MapPin, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';

interface InvoicesProps {
  onBack: () => void;
  onPay: (amount: string) => void;
}

export default function Invoices({ onBack, onPay }: InvoicesProps) {
  const { t } = useLanguage();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const pendingInvoices = [
    {
      id: 'INV-2026-001',
      sender: 'Berlin Energy GmbH',
      address: 'Stralauer Platz 34, 10243 Berlin',
      email: 'billing@berlinenergy.de',
      phone: '+49 30 1234567',
      amount: '€142.50',
      dueDate: '2026-04-05',
      issueDate: '2026-03-20',
      type: 'Utility',
      items: [
        { desc: 'Electricity Usage (Feb)', price: '€110.00' },
        { desc: 'Service Fee', price: '€10.00' },
        { desc: 'VAT (19%)', price: '€22.50' },
      ]
    },
    {
      id: 'INV-2026-042',
      sender: 'Cloud Systems EU',
      address: 'Rue de la Loi 200, 1040 Brussels',
      email: 'finance@cloudsystems.eu',
      phone: '+32 2 299 11 11',
      amount: '€89.99',
      dueDate: '2026-04-12',
      issueDate: '2026-03-25',
      type: 'SaaS Subscription',
      items: [
        { desc: 'Enterprise Plan', price: '€75.62' },
        { desc: 'VAT (19%)', price: '€14.37' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[110] bg-surface flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-surface/80 backdrop-blur-xl border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {t('payments')}
            </span>
            <span className="font-headline font-bold text-lg text-on-surface tracking-tight">{t('invoices')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant/40">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-xs font-bold text-primary">{t('secure')}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-8 pb-12">
        <div className="mb-8">
          <h2 className="font-headline font-extrabold text-2xl mb-2 text-on-surface">{t('pending_invoices')}</h2>
          <p className="text-on-surface-variant/60 text-sm">
            {t('invoices_awaiting', { count: pendingInvoices.length })}
          </p>
        </div>

        <div className="space-y-6">
          {pendingInvoices.map((inv) => (
            <motion.button
              key={inv.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedInvoice(inv)}
              className="w-full text-left bg-white rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col hover:border-primary/20 transition-all group"
            >
              {/* Invoice Header Style */}
              <div className="p-5 border-b border-dashed border-outline-variant flex justify-between items-start bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{inv.sender}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">{inv.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-headline font-bold text-primary text-lg">{inv.amount}</p>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
                    <Calendar className="w-3 h-3" />
                    <span>{t('due')} {inv.dueDate}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white flex items-center justify-between text-xs text-on-surface-variant/60">
                <span>{inv.type}</span>
                <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {t('view_invoice')} <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </main>

      {/* Invoice Detail Modal (Paper Style) */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <ReceiptText className="w-6 h-6 text-primary" />
                  <span className="font-headline font-bold text-lg text-on-surface">{t('invoice_detail')}</span>
                </div>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 hover:bg-surface-container rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 rotate-90 text-on-surface" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Paper Invoice Content */}
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-headline font-extrabold text-2xl text-on-surface">{selectedInvoice.sender}</h3>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant/60">
                        <MapPin className="w-3 h-3" />
                        <span>{selectedInvoice.address}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">{t('invoice_no')}</p>
                      <p className="font-mono font-bold text-on-surface">{selectedInvoice.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">{t('issue_date')}</p>
                      <p className="text-sm font-bold text-on-surface">{selectedInvoice.issueDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-1">{t('due_date')}</p>
                      <p className="text-sm font-bold text-red-500">{selectedInvoice.dueDate}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 border-b border-outline-variant pb-2">{t('line_items')}</h4>
                    <div className="space-y-3">
                      {selectedInvoice.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-on-surface-variant/80">{item.desc}</span>
                          <span className="font-bold text-on-surface">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-dashed border-outline-variant space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant/60 text-sm">{t('total_amount_due')}</span>
                      <span className="font-headline font-extrabold text-3xl text-primary">{selectedInvoice.amount}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="pt-6 border-t border-outline-variant space-y-3">
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant/60">
                    <Mail className="w-4 h-4" />
                    <span>{selectedInvoice.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant/60">
                    <Phone className="w-4 h-4" />
                    <span>{selectedInvoice.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-8 bg-surface-container-low border-t border-outline-variant">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onPay(selectedInvoice.amount);
                    setSelectedInvoice(null);
                  }}
                  className="w-full h-16 rounded-full bg-primary text-white font-headline font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
                >
                  {t('pay_with_truelayer')}
                  <ArrowRight className="w-6 h-6" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
