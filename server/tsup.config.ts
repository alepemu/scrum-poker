import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  // @poker/shared is source-only, so it must be bundled into the output.
  noExternal: ['@poker/shared'],
  clean: true,
  sourcemap: true,
});
