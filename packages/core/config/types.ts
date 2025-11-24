export type ModuleConfig = {
  id: string;
  enabled?: boolean;
  departments?: string[] | null;
};

export type LanguageConfig = {
  default: string;
  available?: string[];
  autoTranslate?: boolean;
};

export type TenantConfig = {
  id: string;
  name: string;
  defaultLocale: string;
  designTokens?: Record<string, string | number> | null;
  languages?: LanguageConfig | null;
  modules: ModuleConfig[];
};
