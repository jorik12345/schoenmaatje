import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { APIContext } from 'astro';
import { supabaseConfig } from './supabase';

/**
 * Routes die met een inlogsessie werken. Alleen hier leest/schrijft de site auth-cookies.
 * Alle andere serverpagina's worden op het CDN gecachet en mogen dus nooit iets persoonlijks bevatten.
 */
const SESSION_ROUTES = [/^\/account(\/|$)/, /^\/aanbieden\/?$/, /^\/inloggen\/?$/, /^\/registreren\/?$/, /^\/uitloggen\/?$/, /^\/wachtwoord-vergeten\/?$/, /^\/auth\//];
/** Routes waarvoor je ingelogd moet zijn. */
const PROTECTED_ROUTES = [/^\/account(\/|$)/, /^\/aanbieden\/?$/];

export const usesSession = (path: string) => SESSION_ROUTES.some((r) => r.test(path));
export const requiresLogin = (path: string) => PROTECTED_ROUTES.some((r) => r.test(path));

export function createSessionClient(ctx: Pick<APIContext, 'request' | 'cookies'>, extraHeaders: Record<string, string>) {
  if (!supabaseConfig) return null;
  return createServerClient(supabaseConfig.url, supabaseConfig.key, {
    cookies: {
      getAll: () => parseCookieHeader(ctx.request.headers.get('cookie') ?? '').map(({ name, value }) => ({ name, value: value ?? '' })),
      setAll: (cookies, headers) => {
        for (const { name, value, options } of cookies) ctx.cookies.set(name, value, { ...options, path: options.path ?? '/' });
        Object.assign(extraHeaders, headers);
      },
    },
  });
}

/** Alleen interne paden als doel na inloggen, nooit een ander domein. */
export function safeNext(value: string | null | undefined, fallback = '/account'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}

/** URL waar links in e-mails naartoe gaan. Bevat altijd een query, zodat e-mailtemplates `&token_hash=…` kunnen toevoegen. */
export function confirmUrl(origin: string, next: string): string {
  return `${origin}/auth/bevestigen?naar=${encodeURIComponent(next)}`;
}

/** Vertaal Supabase Auth-fouten naar begrijpelijke Nederlandse meldingen. */
export function authErrorMessage(error: { message?: string; code?: string; status?: number } | null): string {
  const code = error?.code ?? '';
  const msg = (error?.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'Dit e-mailadres en wachtwoord passen niet bij elkaar.';
  if (code === 'email_not_confirmed') return 'Bevestig eerst je e-mailadres via de link die we je hebben gestuurd.';
  if (code === 'user_already_exists' || msg.includes('already registered')) return 'Er bestaat al een account met dit e-mailadres. Log in of vraag een inloglink aan.';
  if (code === 'weak_password' || msg.includes('password should')) return 'Kies een sterker wachtwoord van minstens 8 tekens.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error?.status === 429) return 'Er zijn net te veel verzoeken gedaan. Probeer het over een paar minuten opnieuw.';
  if (code.startsWith('captcha') || msg.includes('captcha')) return 'De beveiligingscontrole is niet gelukt. Probeer het opnieuw.';
  if (code === 'otp_expired' || msg.includes('expired')) return 'Deze link is verlopen of al gebruikt. Vraag een nieuwe aan.';
  if (code === 'otp_disabled' || code === 'signup_disabled') return 'Er kunnen op dit moment geen nieuwe accounts worden aangemaakt.';
  return 'Er ging iets mis. Probeer het opnieuw, of neem contact met ons op als het blijft gebeuren.';
}
