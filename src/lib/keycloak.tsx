import Keycloak from 'keycloak-js';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

// ─── Singleton instance ────────────────────────────────────────────────────

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? '',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? '',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? '',
});

// ─── Types ─────────────────────────────────────────────────────────────────

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number; // Unix ms
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface AuthState {
  initialized: boolean;
  authenticated: boolean;
  token: string | null;
  user: UserProfile | null;
  isWebAuthnAvailable: boolean;
  biometricEnrolled: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithBiometric: () => void;
  logout: () => void;
  enrollBiometric: () => void;
}

// ─── Storage helpers ────────────────────────────────────────────────────────

const SESSION_KEY = 'blitzpay_session';

function biometricKey(userId: string) {
  return `blitzpay_biometric_${userId}`;
}

function readSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeSession(s: StoredSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── JWT helpers ────────────────────────────────────────────────────────────

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseUser(idToken: string): UserProfile | null {
  const c = decodeJwt(idToken);
  if (!c.sub) return null;
  return {
    id: c.sub as string,
    email: (c.email as string) ?? '',
    name: (c.name as string) ?? (c.preferred_username as string) ?? '',
    emailVerified: (c.email_verified as boolean) ?? false,
  };
}

// ─── Token refresh (manual — works for ROPC-obtained tokens) ───────────────

async function refreshAccessToken(refreshToken: string): Promise<StoredSession | null> {
  const url = `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/token`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
        refresh_token: refreshToken,
      }).toString(),
    });
    if (!res.ok) return null;
    const d = await res.json() as { access_token: string; refresh_token: string; id_token: string; expires_in: number };
    return {
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      idToken: d.id_token,
      expiresAt: Date.now() + d.expires_in * 1000,
    };
  } catch {
    return null;
  }
}

// ─── Context & Provider ─────────────────────────────────────────────────────

const defaultAuth: AuthState = {
  initialized: false,
  authenticated: false,
  token: null,
  user: null,
  isWebAuthnAvailable: false,
  biometricEnrolled: false,
  login: async () => {},
  loginWithBiometric: () => {},
  logout: () => {},
  enrollBiometric: () => {},
};

const KeycloakContext = createContext<AuthState>(defaultAuth);

interface KeycloakProviderProps {
  children: ReactNode;
  onSessionExpired?: () => void;
}

const BYPASS_USER: UserProfile = {
  id: 'dev-bypass',
  email: 'dev@blitzpay.local',
  name: 'Dev User',
  emailVerified: true,
};

export function KeycloakProvider({ children, onSessionExpired }: KeycloakProviderProps) {
  const isBypass = import.meta.env.VITE_AUTH_BYPASS === 'true';

  const [initialized, setInitialized] = useState(isBypass);
  const [authenticated, setAuthenticated] = useState(isBypass);
  const [token, setToken] = useState<string | null>(isBypass ? 'bypass-token' : null);
  const [user, setUser] = useState<UserProfile | null>(isBypass ? BYPASS_USER : null);
  const [isWebAuthnAvailable, setIsWebAuthnAvailable] = useState(false);
  const initStarted = useRef(false);

  useEffect(() => {
    // Skip real Keycloak init in bypass mode
    if (isBypass) return;

    // Guard against React 19 Strict Mode double-invoke
    if (initStarted.current) return;
    initStarted.current = true;

    // Detect platform biometric availability
    if (window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setIsWebAuthnAvailable)
        .catch(() => {});
    }

    // Init SDK — handles OAuth callback in URL (e.g. Face ID redirect-back)
    keycloak
      .init({ checkLoginIframe: false, pkceMethod: 'S256' })
      .then((auth) => {
        if (auth && keycloak.token && keycloak.idToken) {
          // Authenticated via OAuth redirect (Face ID / WebAuthn flow)
          const session: StoredSession = {
            accessToken: keycloak.token,
            refreshToken: keycloak.refreshToken ?? '',
            idToken: keycloak.idToken,
            expiresAt: (keycloak.tokenParsed?.exp ?? 0) * 1000,
          };
          writeSession(session);
          setToken(keycloak.token);
          setUser(parseUser(keycloak.idToken));
          setAuthenticated(true);
          setInitialized(true);
          return;
        }

        // Not authenticated via OAuth — restore from ROPC sessionStorage
        const stored = readSession();
        if (stored) {
          if (stored.expiresAt > Date.now() + 60_000) {
            // Token still valid for >1 min
            setToken(stored.accessToken);
            setUser(parseUser(stored.idToken));
            setAuthenticated(true);
            setInitialized(true);
          } else if (stored.refreshToken) {
            // Try to renew
            refreshAccessToken(stored.refreshToken).then((renewed) => {
              if (renewed) {
                writeSession(renewed);
                setToken(renewed.accessToken);
                setUser(parseUser(renewed.idToken));
                setAuthenticated(true);
              } else {
                clearSession();
              }
              setInitialized(true);
            });
          } else {
            clearSession();
            setInitialized(true);
          }
        } else {
          setInitialized(true);
        }
      })
      .catch(() => {
        // SDK init failure (e.g., Keycloak unreachable) — still check stored session
        const stored = readSession();
        if (stored && stored.expiresAt > Date.now() + 60_000) {
          setToken(stored.accessToken);
          setUser(parseUser(stored.idToken));
          setAuthenticated(true);
        }
        setInitialized(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── login (ROPC — no redirect, fully in-app) ────────────────────────────
  const login = async (email: string, password: string): Promise<void> => {
    const url = `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/token`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
          username: email,
          password,
          scope: 'openid profile email',
        }).toString(),
      });
    } catch {
      throw new Error('network_error');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string; error_description?: string };
      console.error('[Keycloak ROPC]', res.status, body.error, body.error_description);
      if (res.status === 401 || body.error === 'invalid_grant') throw new Error('wrong_credentials');
      if (res.status === 400 && body.error === 'account-disabled') throw new Error('account_locked');
      throw new Error('network_error');
    }

    const d = await res.json() as { access_token: string; refresh_token: string; id_token: string; expires_in: number };
    const session: StoredSession = {
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      idToken: d.id_token,
      expiresAt: Date.now() + d.expires_in * 1000,
    };
    writeSession(session);
    setToken(d.access_token);
    setUser(parseUser(d.id_token));
    setAuthenticated(true);

    // Schedule proactive refresh 1 minute before expiry
    const msUntilRefresh = d.expires_in * 1000 - 60_000;
    if (msUntilRefresh > 0) {
      setTimeout(() => {
        refreshAccessToken(d.refresh_token).then((renewed) => {
          if (renewed) {
            writeSession(renewed);
            setToken(renewed.accessToken);
            setUser(parseUser(renewed.idToken));
          } else {
            clearSession();
            setAuthenticated(false);
            setToken(null);
            setUser(null);
            onSessionExpired?.();
          }
        });
      }, msUntilRefresh);
    }
  };

  // ── loginWithBiometric (Keycloak WebAuthn redirect) ─────────────────────
  const loginWithBiometric = () => {
    keycloak.login({ loginHint: user?.email });
  };

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    clearSession();
    setAuthenticated(false);
    setToken(null);
    setUser(null);
    if (!isBypass) keycloak.logout({ redirectUri: window.location.origin });
  };

  // ── enrollBiometric (Application-Initiated Action) ───────────────────────
  const enrollBiometric = () => {
    if (user) {
      keycloak.login({ action: 'webauthn-register-passwordless', loginHint: user.email } as Parameters<typeof keycloak.login>[0]);
    }
  };

  const biometricEnrolled = user
    ? (() => {
        try {
          const raw = localStorage.getItem(biometricKey(user.id));
          return raw ? (JSON.parse(raw) as { enrolled: boolean }).enrolled : false;
        } catch {
          return false;
        }
      })()
    : false;

  return (
    <KeycloakContext.Provider
      value={{
        initialized,
        authenticated,
        token,
        user,
        isWebAuthnAvailable,
        biometricEnrolled,
        login,
        loginWithBiometric,
        logout,
        enrollBiometric,
      }}
    >
      {children}
    </KeycloakContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(KeycloakContext);
}
