# Quickstart: Auth Feature Development Setup

**Feature**: 001-keycloak-auth-login
**Updated**: 2026-03-30

---

## Option A — Bypass Mode (no Keycloak needed)

Set `VITE_AUTH_BYPASS=true` in `.env` and run `npm run dev`. You land directly on the Explore screen as a dev user. No Keycloak server required.

---

## Option B — Real Keycloak (v26.x)

### 1. Create the `.env` file

```bash
cp .env.example .env
```

Fill in your values:

```
VITE_AUTH_BYPASS=false
VITE_KEYCLOAK_URL=http://your-keycloak-server:8080
VITE_KEYCLOAK_REALM=your-realm-name
VITE_KEYCLOAK_CLIENT_ID=blitz-pay-mobile-client
KEYCLOAK_SERVER_CLIENT_ID=blitz-pay-server
KEYCLOAK_ADMIN_SECRET=<secret from blitz-pay-server credentials tab>
```

---

### 2. Create the SPA client (`blitz-pay-mobile-client`)

1. **Clients** → **Create client**
2. Client ID: `blitz-pay-mobile-client` → Next
3. **Capability config**:
   - Client authentication: **OFF**
   - Check **Standard flow** ✅
   - Check **Direct access grants** ✅ ← required for email/password login
4. Next → Save
5. **Settings** tab → **Login settings**:
   - Valid redirect URIs: `http://localhost:3000/*`
   - Web origins: `http://localhost:3000`
6. **Client scopes** tab — confirm `profile` and `email` are listed as **Default** scopes. If not, click **Add client scope** and add both as Default.

---

### 3. Create the server client (`blitz-pay-server`)

This client is used only by `server.ts` (Node.js) to create users via the Keycloak Admin API. Its secret never goes to the browser.

1. **Clients** → **Create client**
2. Client ID: `blitz-pay-server` → Next
3. **Capability config**:
   - Client authentication: **ON**
   - Uncheck Standard flow and Direct access grants
   - Check **Service accounts roles** ✅
4. Next → Save
5. **Credentials** tab → copy the **Client secret** → paste into `.env` as `KEYCLOAK_ADMIN_SECRET`
6. Assign the `manage-users` permission:
   - **Users** (left menu) → search for `service-account-blitz-pay-server` → click the user
   - **Role mapping** tab → **Assign role**
   - Click **Filter by clients** at the top of the dialog
   - Search `realm-management` → find `manage-users` → tick it → **Assign**

> **Note**: If `service-account-blitz-pay-server` doesn't appear in Users, go back to the client Settings tab, check **Service accounts roles**, save, then search again.

---

### 4. Disable User Profile required fields (optional but recommended for testing)

Keycloak 26.x enables Declarative User Profile by default. If `firstName` or `lastName` are marked as required, manually created test users without those fields will get `Account is not fully set up` on login.

1. **Realm settings** → **User profile** tab
2. Click `firstName` → set **Required** to **OFF** → Save
3. Click `lastName` → set **Required** to **OFF** → Save

Alternatively, always fill in First name, Last name, and Username when creating test users manually.

---

### 5. Create a test user

1. **Users** → **Add user**
2. Fill in:
   - **Username**: `test@example.com` (or anything)
   - **Email**: `test@example.com`
   - **First name**: `Test`
   - **Last name**: `User`
   - **Email verified**: ON
3. Save
4. **Credentials** tab → **Set password** → enter a password → **Temporary: OFF** → Save

---

### 6. Run the app

```bash
# Terminal 1 — frontend
npm run dev

# Terminal 2 — registration server (only needed for Sign Up)
npm run server
```

Open `http://localhost:3000` → Login screen appears → enter the test user credentials.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Wrong credentials or Direct access grants is OFF | Enable Direct access grants on the SPA client; check username/password |
| `400 invalid_grant — Account is not fully set up` | User is missing First name, Last name, or Username | Fill in all fields on the user in the admin console, or disable required fields in Realm settings → User profile |
| `400 invalid_scope` | `profile` / `email` scopes not on client | Add them as Default scopes in the client's Client scopes tab |
| `400 invalid_client` | Client ID in `.env` doesn't match Keycloak | Check `VITE_KEYCLOAK_CLIENT_ID` exactly matches the client ID in Keycloak |
| Sign Up fails (500) | `manage-users` role not assigned to service account | Follow step 3 above to assign the role |
| Sign Up fails (network) | `npm run server` not running | Start the server in a second terminal |

---

## Face ID Enrollment Flow

1. Log in with email/password on iOS 14+ Safari (or home-screen PWA).
2. After login, a prompt appears: **"Enable Face ID"** → tap **Enable**.
3. App triggers Keycloak's WebAuthn registration page → complete Face ID enrollment.
4. Log out → Face ID button now appears on the Login screen.
5. Tap it → Face ID prompt → lands on Explore.

> Face ID only works on iOS 14+ in Safari. The button is hidden on unsupported devices.
