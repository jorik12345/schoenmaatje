// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// Pagina's zijn standaard statisch; een pagina met `export const prerender = false` draait als Netlify Function.
export default defineConfig({
  site: 'https://schoenmaatje.nl',
  adapter: netlify(),
});
