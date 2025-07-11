import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [sveltekit()],
  define: {
    global: 'window'
  },
  resolve: {
    alias: {
      events: 'events'
    }
  }
};