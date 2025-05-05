module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true // Jika menggunakan testing
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
    "prettier" // Tambahkan ini untuk menghindari konflik format
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
    ecmaVersion: 2020 // Untuk fitur ES terbaru
  },
  ignorePatterns: [
    "/lib/**/*",
    "/generated/**/*",
    "*.js" // Jika ada file JS yang tidak ingin di-lint
  ],
  plugins: [
    "@typescript-eslint",
    "import",
    "prettier" // Plugin untuk Prettier
  ],
  rules: {
    "quotes": ["error", "double", { "avoidEscape": true }], // Izinkan single quote jika mengandung double quote
    "import/no-unresolved": 0,
    "indent": ["error", 2, { "SwitchCase": 1 }], // Handle case di switch statement
    "max-len": ["error", { "code": 120 }], // Naikkan limit dari default 80
    "object-curly-spacing": ["error", "always"],
    "require-jsdoc": "off", // Nonaktifkan JSDoc requirement
    "valid-jsdoc": "off", // Nonaktifkan validasi JSDoc
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-var-requires": "warn", // Ubah dari error ke warning untuk require()
    "prettier/prettier": "error" // Aktifkan prettier
  },
  settings: {
    "import/resolver": {
      "typescript": {} // Untuk resolve path TypeScript
    }
  }
};