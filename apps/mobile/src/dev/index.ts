import type * as DevTools from './devTools';

// The only way into this folder, which holds the test password. Metro replaces __DEV__ with false in
// release builds and drops the require, so none of it is bundled. A plain `import` from anywhere else
// would bypass that, and `check:release` fails if it does.
export const devTools: typeof DevTools | null = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- an import can't be dropped.
    require('./devTools')
  : null;
