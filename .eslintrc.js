module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [ '@typescript-eslint' ],
  rules: {
    '@typescript-eslint/camelcase': [ 0 ],
    '@typescript-eslint/no-unused-vars': [ 'error', { argsIgnorePattern: '^_' } ],
    '@typescript-eslint/no-use-before-define': [ 'error', { functions: false, classes: true } ],
    indent: [ 'error', 2, { SwitchCase: 1 } ],
    'linebreak-style': [ 'error', 'windows' ],
    quotes: [ 'error', 'single' ],
    semi: [ 'error', 'always' ],
  },
};
