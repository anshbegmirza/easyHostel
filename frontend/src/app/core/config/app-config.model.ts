export type AppMode = 'test' | 'prod';
export type AppBrand = 'purple' | 'green';
export type ColorMode = 'light' | 'dark';
export type ThemePalette = 'purple' | 'green' | 'works4' | 'amber';

export interface AppConfig {
  appName: string;
  mode: AppMode;
  brand: AppBrand;
  themePalette: ThemePalette;
  version: string;
  googleClientId: string;
  googleEnabled: boolean;
  defaultHostelPartner: string;
  coverQuote: string;
  coverQuoteAuthor: string;
  allowPasswordSignup: boolean;
  signupHint: string;
}
