import babel from 'rollup-plugin-babel';

const external = Object.keys(require('./package.json').dependencies || {});

export default {
  entry: 'src/runtime/index.js',
  targets: [
    { dest: 'dist/runtime.js', format: 'cjs' },
    { dest: 'dist/runtime.es.js', format: 'es' },
  ],
  external: external.concat([/^babel-runtime/]),
  plugins: [
    babel({
      presets: [
        ["env", {
          targets: {
            browsers: ["last 2 versions", "> 2%"]
          },
          modules: false,
        }],
      ],
      plugins: [
        'transform-runtime',
      ],
      runtimeHelpers: true,
    }),
  ],
};
