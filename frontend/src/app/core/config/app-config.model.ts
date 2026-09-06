export type AppMode = 'test' | 'prod';
export type AppBrand = 'purple' | 'green';
export type ColorMode = 'light' | 'dark';

export interface AppConfig {
  appName: string;
  mode: AppMode;
  brand: AppBrand;
  version: string;
  googleClientId: string;
  googleEnabled: boolean;
  defaultHostelPartner: string;
  coverQuote: string;
  coverQuoteAuthor: string;
  allowPasswordSignup: boolean;
  signupHint: string;
}
