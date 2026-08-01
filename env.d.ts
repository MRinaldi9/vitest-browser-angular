declare namespace NodeJS {
  interface ProcessEnv {
    VITEST_VSCODE?: 'true' | 'false';
    CI?: string;
  }
}
