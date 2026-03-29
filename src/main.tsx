import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './lib/LanguageContext';
import { KeycloakProvider } from './lib/keycloak';

// KeycloakProvider is placed outside StrictMode to prevent double-initialization
// of the Keycloak singleton in React 19 development mode.
createRoot(document.getElementById('root')!).render(
  <KeycloakProvider>
    <StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </StrictMode>
  </KeycloakProvider>,
);
