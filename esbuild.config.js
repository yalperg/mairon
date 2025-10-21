import esbuild from 'esbuild';

const isDev = process.env.NODE_ENV === 'development';

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'neutral',
  outdir: 'dist',
  sourcemap: isDev,
  target: ['es2020'],
  tsconfig: 'tsconfig.json',
  format: 'esm',
  outExtension: { '.js': '.js' },
  minify: !isDev,
  logLevel: 'info',
  treeShaking: true,
  legalComments: isDev ? 'inline' : 'none',
  metafile: !isDev,
};

async function build() {
  try {
    if (isDev) {
      const ctx = await esbuild.context(config);
      await ctx.watch();
      console.log('Watching for changes...');
    } else {
      const result = await esbuild.build(config);
      console.log('Build completed successfully!');
      if (result.metafile) {
        console.log(
          `Output files: ${Object.keys(result.metafile.outputs).length}`,
        );
      }
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
