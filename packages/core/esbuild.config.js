// eslint-disable-next-line @typescript-eslint/no-var-requires
require(`esbuild`)
  .build({
    entryPoints: [`src/index.ts`],
    outfile: `dist/index.js`,
    platform: `browser`,
    format: `esm`,
    sourcemap: true,
    bundle: true,
    external: [`react`, `recoil`],
  })
  .catch(() => process.exit(1))
