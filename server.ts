import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const {
  VITE_KEYCLOAK_URL: KEYCLOAK_URL,
  VITE_KEYCLOAK_REALM: KEYCLOAK_REALM,
  KEYCLOAK_SERVER_CLIENT_ID,
  KEYCLOAK_ADMIN_SECRET,
} = process.env;

// ── Obtain admin access token via client credentials grant ──────────────────
async function getAdminToken(): Promise<string> {
  const url = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: KEYCLOAK_SERVER_CLIENT_ID ?? '',
      client_secret: KEYCLOAK_ADMIN_SECRET ?? '',
    }).toString(),
  });
  if (!res.ok) throw new Error(`Admin token fetch failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ── POST /api/register ───────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

  // Basic validation
  if (!name || !email || !password) {
    res.status(422).json({ error: 'validation_failed', fields: ['name', 'email', 'password'] });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(422).json({ error: 'validation_failed', fields: ['email'] });
    return;
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    res.status(422).json({ error: 'validation_failed', fields: ['password'] });
    return;
  }

  try {
    const adminToken = await getAdminToken();

    const createRes = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          username: email,
          email,
          firstName: name,
          enabled: true,
          emailVerified: false,
          credentials: [{ type: 'password', value: password, temporary: false }],
        }),
      }
    );

    if (createRes.status === 201) {
      // Keycloak returns the new user URL in the Location header
      const location = createRes.headers.get('Location') ?? '';
      const userId = location.split('/').pop() ?? '';
      res.status(201).json({ userId });
      return;
    }

    if (createRes.status === 409) {
      res.status(409).json({ error: 'email_conflict' });
      return;
    }

    const body = await createRes.json().catch(() => ({}));
    console.error('Keycloak create user error:', createRes.status, body);
    res.status(500).json({ error: 'server_error' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
app.listen(PORT, () => {
  console.log(`BlitzPay API server listening on port ${PORT}`);
});
