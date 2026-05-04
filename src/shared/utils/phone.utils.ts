import { parsePhoneNumber, PhoneNumber } from 'libphonenumber-js';
import type { LineType } from '../../types';
import { getPhoneMeta } from './phone.meta';

export function parseLocal(rawNumber: string): {
  formatted: string;
  valid: boolean;
  countryCode?: string;
  lineType?: LineType;
  state?: string;
  uf?: string;
  region?: string;
  timezone?: string;
  utcOffset?: string;
  estimatedCarrier?: string;
  carrierIsEstimate?: boolean;
} {
  try {
    const phone: PhoneNumber = parsePhoneNumber(rawNumber, 'BR');
    const type = phone.getType();
    const meta = getPhoneMeta(rawNumber);
    return {
      formatted: phone.formatInternational(),
      valid: phone.isValid(),
      countryCode: phone.country,
      lineType: mapType(type),
      state: meta.state ?? undefined,
      uf: meta.uf ?? undefined,
      region: meta.region ?? undefined,
      timezone: meta.timezone ?? undefined,
      utcOffset: meta.utcOffset ?? undefined,
      estimatedCarrier: meta.carrier ?? undefined,
      carrierIsEstimate: meta.carrierIsEstimate,
    };
  } catch {
    return { formatted: rawNumber, valid: false };
  }
}

function mapType(type: string | undefined): LineType {
  switch (type) {
    case 'MOBILE': return 'mobile';
    case 'FIXED_LINE': return 'landline';
    case 'VOIP': return 'voip';
    case 'TOLL_FREE': return 'toll_free';
    case 'PREMIUM_RATE': return 'premium_rate';
    default: return 'unknown';
  }
}

export function formatDisplayNumber(number: string): string {
  try {
    return parsePhoneNumber(number, 'BR').formatNational();
  } catch {
    return number;
  }
}

export function normalizeNumber(number: string): string {
  return number.replace(/\D/g, '');
}
