import { defineConfig } from 'vite';

const repositoryName = process.env.GITHUB_REPOSITORY
  ? process.env.GITHUB_REPOSITORY.split('/')[1]
  : null;

export default defineConfig({
  base: repositoryName ? `/${repositoryName}/` : '/',
  root: '.',
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
