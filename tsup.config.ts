import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  clean: true,
  dts: false,
  banner: {
    js: '#!/usr/bin/env node\nprocess.noDeprecation = true;',
  },
})
