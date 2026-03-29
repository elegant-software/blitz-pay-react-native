import { useState, useEffect } from 'react';
import { Screen } from './types';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import Explore from './screens/Explore';
import Assistant from './screens/Assistant';
import Merchant from './screens/Merchant';
import Checkout from './screens/Checkout';
import Vault from './screens/Vault';
import MyQRCode from './screens/MyQRCode';
import QRScanner from './screens/QRScanner';
import Account from './screens/Account';
import Notifications from './screens/Notifications';
import Invoices from './screens/Invoices';
import SendInvoice from './screens/SendInvoice';
import ShakeReward from './components/ShakeReward';
import TrueLayerPayment from './components/TrueLayerPayment';
import FloatingAvatar from './components/FloatingAvatar';
import SplashScreen from './components/SplashScreen';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('explore');
  const [invoiceToPay, setInvoiceToPay] = useState<string | null>(null);
  const [showShakeReward, setShowShakeReward] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  // Expose navigation to invoices globally for the quick action tile
  useEffect(() => {
    (window as any).navigateToInvoices = () => setCurrentScreen('invoices');
  }, []);

  const handlePaymentSuccess = () => {
    setShowShakeReward(true);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'explore':
        return (
          <Explore
            onNavigateToMerchant={() => setCurrentScreen('merchant')}
            onNavigateToMyQR={() => setCurrentScreen('my-qr')}
            onNavigateToScanQR={() => setCurrentScreen('scan-qr')}
            onNavigateToSendInvoice={() => setCurrentScreen('send-invoice')}
          />
        );
      case 'assistant':
        return <Assistant />;
      case 'vault':
        return <Vault />;
      case 'invoices':
        return (
          <Invoices 
            onBack={() => setCurrentScreen('explore')} 
            onPay={(amount) => setInvoiceToPay(amount)}
          />
        );
      case 'notifications':
        return (
          <Notifications 
            onBack={() => setCurrentScreen('explore')} 
            onNavigateToInvoices={() => setCurrentScreen('invoices')}
          />
        );
      case 'merchant':
        return (
          <Merchant
            onBack={() => setCurrentScreen('explore')}
            onPayNow={() => setCurrentScreen('checkout')}
          />
        );
      case 'checkout':
        return <Checkout onConfirm={handlePaymentSuccess} />;
      case 'my-qr':
        return <MyQRCode onBack={() => setCurrentScreen('explore')} />;
      case 'scan-qr':
        return (
          <QRScanner
            onBack={() => setCurrentScreen('explore')}
            onScan={() => setCurrentScreen('merchant')}
          />
        );
      case 'account':
        return <Account />;
      case 'send-invoice':
        return (
          <SendInvoice 
            onBack={() => setCurrentScreen('explore')} 
            onSent={() => setCurrentScreen('explore')}
          />
        );
      default:
        return (
          <Explore
            onNavigateToMerchant={() => setCurrentScreen('merchant')}
            onNavigateToMyQR={() => setCurrentScreen('my-qr')}
            onNavigateToScanQR={() => setCurrentScreen('scan-qr')}
            onNavigateToSendInvoice={() => setCurrentScreen('send-invoice')}
          />
        );
    }
  };

  const showHeader = !['assistant', 'merchant', 'checkout', 'my-qr', 'scan-qr', 'invoices', 'notifications', 'send-invoice'].includes(currentScreen);
  const showBottomNav = !['checkout', 'my-qr', 'scan-qr', 'invoices', 'notifications', 'send-invoice'].includes(currentScreen);
  const showFloatingAvatar = !['assistant', 'checkout', 'my-qr', 'scan-qr', 'invoices', 'notifications', 'send-invoice'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
      <AnimatePresence>
        {!isAppReady && (
          <SplashScreen onComplete={() => setIsAppReady(true)} />
        )}
      </AnimatePresence>

      {/* Refined Light Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-primary/5 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-secondary/5 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className={`relative z-10 flex flex-col min-h-screen transition-opacity duration-500 ${isAppReady ? 'opacity-100' : 'opacity-0'}`}>
        {showHeader && (
          <Header onNavigateToNotifications={() => setCurrentScreen('notifications')} />
        )}
        
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>

        <FloatingAvatar isVisible={showFloatingAvatar} />

        {showBottomNav && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        <AnimatePresence>
          {invoiceToPay && (
            <TrueLayerPayment
              amount={invoiceToPay}
              onSuccess={() => {
                setInvoiceToPay(null);
                handlePaymentSuccess();
              }}
              onCancel={() => setInvoiceToPay(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showShakeReward && (
            <ShakeReward
              onComplete={() => {
                setShowShakeReward(false);
                setCurrentScreen('vault');
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
