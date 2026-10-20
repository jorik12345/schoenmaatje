import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect }) => {
  await locals.supabase?.auth.signOut({ scope: 'local' });
  return redirect('/');
};

// Uitloggen via een gewone link zou door een prefetch of crawler per ongeluk kunnen gebeuren.
export const GET: APIRoute = ({ redirect }) => redirect('/account');
