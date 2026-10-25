import type { APIRoute } from 'astro';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNext } from '../../lib/auth';

export const prerender = false;

/**
 * Hier komen links uit e-mails binnen (bevestigen, inloglink, wachtwoord herstellen).
 * Twee vormen: `?token_hash=…&type=…` (onze e-mailtemplates; werkt op elk apparaat)
 * en `?code=…` (standaardtemplates van Supabase; werkt alleen in dezelfde browser).
 */
export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const supabase = locals.supabase;
  const next = safeNext(url.searchParams.get('naar'));
  if (!supabase) return redirect('/inloggen');

  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const code = url.searchParams.get('code');

  const { error } = tokenHash && type
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error('geen token') };

  if (error) return redirect('/inloggen?fout=link');
  return redirect(type === 'recovery' ? '/account/wachtwoord' : next);
};
