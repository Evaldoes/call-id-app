import axios from 'axios';
import { parseLocal } from '../../../shared/utils/phone.utils';
import type { CallerInfo, LineType } from '../../../types';

interface LookupOptions {
  numverifyKey?: string;
  abstractApiKey?: string;
}

async function fromNumverify(
  number: string,
  apiKey: string,
): Promise<Partial<CallerInfo>> {
  const { data } = await axios.get('https://apilayer.net/api/validate', {
    params: { access_key: apiKey, number, format: 1 },
    timeout: 8000,
  });
  return {
    valid: data.valid,
    formatted: data.international_format || undefined,
    countryCode: data.country_code || undefined,
    countryName: data.country_name || undefined,
    location: data.location || undefined,
    carrier: data.carrier || undefined,
    lineType: (data.line_type as LineType) || undefined,
    provider: 'numverify',
  };
}

async function fromAbstractApi(
  number: string,
  apiKey: string,
): Promise<Partial<CallerInfo>> {
  const { data } = await axios.get(
    'https://phonevalidation.abstractapi.com/v1/',
    {
      params: { api_key: apiKey, phone: number },
      timeout: 8000,
    },
  );
  return {
    valid: data.valid,
    formatted: data.format?.international || undefined,
    countryCode: data.country?.code || undefined,
    countryName: data.country?.name || undefined,
    location: data.location || undefined,
    carrier: data.carrier?.name || undefined,
    lineType: mapAbstractType(data.type),
    provider: 'abstractapi',
  };
}

function mapAbstractType(type: string): LineType {
  const map: Record<string, LineType> = {
    Mobile: 'mobile',
    Landline: 'landline',
    'Voice over IP': 'voip',
    'Toll Free': 'toll_free',
    'Premium Rate': 'premium_rate',
  };
  return map[type] ?? 'unknown';
}

export async function lookupNumber(
  number: string,
  options: LookupOptions,
): Promise<CallerInfo> {
  const local = parseLocal(number);

  let result: CallerInfo = {
    number,
    formatted: local.formatted,
    valid: local.valid,
    countryCode: local.countryCode,
    lineType: local.lineType,
    state: local.state,
    uf: local.uf,
    region: local.region,
    timezone: local.timezone,
    utcOffset: local.utcOffset,
    estimatedCarrier: local.estimatedCarrier,
    carrierIsEstimate: local.carrierIsEstimate,
    provider: 'local',
    fetchedAt: new Date(),
  };

  if (options.abstractApiKey) {
    try {
      const abstract = await fromAbstractApi(number, options.abstractApiKey);
      result = { ...result, ...abstract, fetchedAt: new Date() };
    } catch {}
  }

  if (options.numverifyKey) {
    try {
      const numverify = await fromNumverify(number, options.numverifyKey);
      result = { ...result, ...numverify, fetchedAt: new Date() };
    } catch {}
  }

  return result;
}
