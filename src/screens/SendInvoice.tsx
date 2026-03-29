import { ArrowLeft, Send, User, Euro, FileText, CheckCircle2, Loader2, Plus, Trash2, Search, ChevronRight, Users, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';
import { useLanguage } from '../lib/LanguageContext';

interface SendInvoiceProps {
  onBack: () => void;
  onSent: () => void;
}

interface InvoiceItem {
  id: string;
  description: string;
  amount: string;
}

interface Contact {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

interface Group {
  id: string;
  name: string;
  memberIds: string[];
  icon: any;
}

const CONTACTS: Contact[] = [
  { id: '1', name: 'Alex Rivera', handle: '@arivera', avatar: 'https://picsum.photos/seed/alex/100/100' },
  { id: '2', name: 'Sarah Chen', handle: '@schen', avatar: 'https://picsum.photos/seed/sarah/100/100' },
  { id: '3', name: 'Marcus Vogt', handle: '@mvogt', avatar: 'https://picsum.photos/seed/marcus/100/100' },
  { id: '4', name: 'Elena Rossi', handle: '@erossi', avatar: 'https://picsum.photos/seed/elena/100/100' },
];

const GROUPS: Group[] = [
  { id: 'g1', name: 'Design Team', memberIds: ['1', '2'], icon: Users },
  { id: 'g2', name: 'Project Alpha', memberIds: ['3', '4', '1'], icon: Users },
];

export default function SendInvoice({ onBack, onSent }: SendInvoiceProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<'contact' | 'details'>('contact');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', amount: '' }
  ]);
  
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const filteredContacts = CONTACTS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [items]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', amount: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const toggleContact = (contact: Contact) => {
    setSelectedContacts(prev => 
      prev.find(c => c.id === contact.id)
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, contact]
    );
  };

  const selectGroup = (group: Group) => {
    const groupMembers = CONTACTS.filter(c => group.memberIds.includes(c.id));
    setSelectedContacts(prev => {
      const newContacts = [...prev];
      groupMembers.forEach(member => {
        if (!newContacts.find(c => c.id === member.id)) {
          newContacts.push(member);
        }
      });
      return newContacts;
    });
  };

  const handleSend = () => {
    if (selectedContacts.length === 0 || items.some(i => !i.description || !i.amount)) return;
    
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSent();
      }, 2000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-surface flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-surface/80 backdrop-blur-xl border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <button 
            onClick={step === 'details' ? () => setStep('contact') : onBack} 
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {t('payments')}
            </span>
            <span className="font-headline font-bold text-lg text-on-surface tracking-tight">
              {step === 'contact' ? t('select_recipients') : t('invoice_details')}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-8 pb-12 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="font-headline font-extrabold text-3xl mb-4 text-on-surface">{t('invoice_sent')}</h2>
              <p className="text-on-surface-variant/60 max-w-xs">
                {t('invoice_sent_msg', { 
                  amount: `€${totalAmount.toFixed(2)}`, 
                  count: selectedContacts.length 
                })}
              </p>
            </motion.div>
          ) : step === 'contact' ? (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
                <input
                  type="text"
                  placeholder={t('search_contacts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-surface-container rounded-2xl border border-outline-variant focus:ring-2 focus:ring-primary transition-all text-on-surface"
                />
              </div>

              {/* Groups Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 px-1">Groups</h3>
                <div className="grid grid-cols-2 gap-3">
                  {GROUPS.map(group => (
                    <motion.button
                      key={group.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectGroup(group)}
                      className="flex items-center gap-3 p-4 bg-surface-container rounded-2xl border border-outline-variant hover:border-primary/20 transition-all text-left"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <group.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-on-surface">{group.name}</p>
                        <p className="text-[10px] text-on-surface-variant/60">{group.memberIds.length} {t('members')}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 px-1">{t('contacts')}</h3>
                {filteredContacts.map(contact => {
                  const isSelected = selectedContacts.find(c => c.id === contact.id);
                  return (
                    <motion.button
                      key={contact.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleContact(contact)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isSelected ? 'bg-primary/5 border-primary' : 'bg-surface-container border-outline-variant'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full border border-outline-variant" referrerPolicy="no-referrer" />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-surface">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-on-surface">{contact.name}</p>
                          <p className="text-xs text-on-surface-variant/60">{contact.handle}</p>
                        </div>
                      </div>
                      {!isSelected && <ChevronRight className="w-5 h-5 text-on-surface-variant/20" />}
                    </motion.button>
                  );
                })}
              </div>

              {selectedContacts.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('details')}
                  className="w-full h-16 rounded-full bg-primary text-white font-headline font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20 sticky bottom-4"
                >
                  {t('continue_with', { count: selectedContacts.length })}
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Recipients Summary */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 px-1">{t('recipients')}</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContacts.map(contact => (
                    <div key={contact.id} className="flex items-center gap-2 p-2 bg-primary/5 rounded-full border border-primary/10">
                      <img src={contact.avatar} alt={contact.name} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                      <span className="text-xs font-bold text-on-surface pr-1">{contact.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">{t('invoice_items')}</h3>
                  <button onClick={addItem} className="text-primary flex items-center gap-1 text-xs font-bold">
                    <Plus className="w-4 h-4" /> {t('add_item')}
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 bg-surface-container rounded-2xl border border-outline-variant space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">{t('description')}</label>
                          <input
                            type="text"
                            placeholder={t('service_product')}
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-on-surface font-medium placeholder:text-on-surface-variant/20"
                          />
                        </div>
                        <div className="w-24 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">{t('amount')}</label>
                          <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-sm">€</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={item.amount}
                              onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                              className="w-full bg-transparent border-none pl-4 p-0 focus:ring-0 text-on-surface font-bold text-right"
                            />
                          </div>
                        </div>
                        {items.length > 1 && (
                          <button onClick={() => removeItem(item.id)} className="self-end p-2 text-on-surface-variant/40 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-6 bg-surface-container rounded-2xl border border-outline-variant space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant/60">{t('subtotal_per_person')}</span>
                  <span className="text-on-surface font-medium">€{totalAmount.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-outline-variant flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="font-bold text-on-surface block">{t('total_amount')}</span>
                    <span className="text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-wider">
                      {t('total_for', { 
                        amount: `€${(totalAmount * selectedContacts.length).toFixed(2)}`, 
                        count: selectedContacts.length 
                      })}
                    </span>
                  </div>
                  <span className="font-headline font-extrabold text-2xl text-primary">€{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={items.some(i => !i.description || !i.amount) || isSending}
                onClick={handleSend}
                className={`w-full h-16 rounded-full font-headline font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all ${
                  items.some(i => !i.description || !i.amount) || isSending
                    ? 'bg-surface-container-highest text-on-surface-variant/40 cursor-not-allowed'
                    : 'bg-primary text-white hover:shadow-primary/20'
                }`}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  <>
                    {t('send_to', { count: selectedContacts.length })}
                    <Send className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
