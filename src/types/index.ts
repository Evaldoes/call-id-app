export type LineType = 'mobile' | 'landline' | 'voip' | 'toll_free' | 'premium_rate' | 'unknown';

export interface CallerInfo {
  number: string;
  formatted?: string;
  valid: boolean;
  countryCode?: string;
  countryName?: string;
  location?: string;
  carrier?: string;
  lineType?: LineType;
  isSpam?: boolean;
  spamReports?: number;
  provider: 'local' | 'numverify' | 'abstractapi';
  fetchedAt: Date;
  // campos locais BR
  state?: string;
  uf?: string;
  region?: string;
  timezone?: string;
  utcOffset?: string;
  estimatedCarrier?: string;
  carrierIsEstimate?: boolean;
}

export interface CallRecord {
  id: string;
  number: string;
  timestamp: Date;
  type: 'incoming' | 'missed';
  callerInfo?: CallerInfo;
}

export interface ApiSettings {
  numverifyKey: string;
  abstractApiKey: string;
  enableAutoLookup: boolean;
  enableNotifications: boolean;
}

export type LookupStatus = 'idle' | 'loading' | 'success' | 'error';
