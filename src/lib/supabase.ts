const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

const ensureConfig = () => {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY (atau VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY) di file .env.');
  }

  return { supabaseUrl, supabasePublishableKey };
};

export const supabaseRest = async <T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    select?: string;
  } = {}
): Promise<T> => {
  const { supabaseUrl: url, supabasePublishableKey: key } = ensureConfig();
  const endpoint = new URL(`/rest/v1/${path}`, url);

  if (options.select) {
    endpoint.searchParams.set('select', options.select);
  }

  const response = await fetch(endpoint.toString(), {
    method: options.method ?? 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload ? String(payload.message) : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
};
