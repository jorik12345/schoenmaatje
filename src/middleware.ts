import { defineMiddleware } from 'astro:middleware';
import { createSessionClient, requiresLogin, usesSession } from './lib/auth';

export const onRequest = defineMiddleware(async (ctx, next) => {
  ctx.locals.supabase = null;
  ctx.locals.user = null;
  // Openbare (gecachete) pagina's raken de inlogsessie nooit aan.
  if (ctx.isPrerendered || !usesSession(ctx.url.pathname)) return next();

  const authHeaders: Record<string, string> = {};
  const supabase = createSessionClient(ctx, authHeaders);
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    ctx.locals.supabase = supabase;
    ctx.locals.user = data.user ?? null;
  }

  if (supabase && requiresLogin(ctx.url.pathname) && !ctx.locals.user) {
    return ctx.redirect(`/inloggen?naar=${encodeURIComponent(ctx.url.pathname + ctx.url.search)}`);
  }

  const response = await next();
  for (const [k, v] of Object.entries(authHeaders)) response.headers.set(k, v);
  // Persoonlijke pagina's nooit cachen, niet in de browser en niet op het CDN.
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Netlify-CDN-Cache-Control', 'no-store');
  return response;
});
