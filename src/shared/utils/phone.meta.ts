import { parsePhoneNumber } from 'libphonenumber-js';

export interface PhoneMeta {
  ddd: string | null;
  state: string | null;
  uf: string | null;
  region: string | null;
  timezone: string | null;
  utcOffset: string | null;
  carrier: string | null;
  carrierIsEstimate: boolean;
}

// ── DDD → estado / região / fuso ──────────────────────────────────────────

interface DddData {
  uf: string;
  state: string;
  region: string;
  tz: string;      // IANA timezone
  utc: string;     // exibição ex: "UTC-3"
}

const DDD_META: Record<string, DddData> = {
  // São Paulo
  '11': { uf: 'SP', state: 'São Paulo',            region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '12': { uf: 'SP', state: 'São Paulo',            region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '13': { uf: 'SP', state: 'São Paulo',            region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '14': { uf: 'SP', state: 'São Paulo',            region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '15': { uf: 'SP', state: 'São Paulo',            region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '16': { uf: 'SP', state: 'São Paulo',            region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '17': { uf: 'SP', state: 'São Paulo',            region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '18': { uf: 'SP', state: 'São Paulo',            region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '19': { uf: 'SP', state: 'São Paulo',            region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  // Rio de Janeiro / Espírito Santo
  '21': { uf: 'RJ', state: 'Rio de Janeiro',       region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '22': { uf: 'RJ', state: 'Rio de Janeiro',       region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '24': { uf: 'RJ', state: 'Rio de Janeiro',       region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '27': { uf: 'ES', state: 'Espírito Santo',       region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '28': { uf: 'ES', state: 'Espírito Santo',       region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  // Minas Gerais
  '31': { uf: 'MG', state: 'Minas Gerais',         region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '32': { uf: 'MG', state: 'Minas Gerais',         region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '33': { uf: 'MG', state: 'Minas Gerais',         region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '34': { uf: 'MG', state: 'Minas Gerais',         region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '35': { uf: 'MG', state: 'Minas Gerais',         region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '37': { uf: 'MG', state: 'Minas Gerais',         region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '38': { uf: 'MG', state: 'Minas Gerais',         region: 'Sudeste',    tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  // Paraná
  '41': { uf: 'PR', state: 'Paraná',               region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '42': { uf: 'PR', state: 'Paraná',               region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '43': { uf: 'PR', state: 'Paraná',               region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '44': { uf: 'PR', state: 'Paraná',               region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '45': { uf: 'PR', state: 'Paraná',               region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '46': { uf: 'PR', state: 'Paraná',               region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  // Santa Catarina
  '47': { uf: 'SC', state: 'Santa Catarina',       region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '48': { uf: 'SC', state: 'Santa Catarina',       region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '49': { uf: 'SC', state: 'Santa Catarina',       region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  // Rio Grande do Sul
  '51': { uf: 'RS', state: 'Rio Grande do Sul',    region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '53': { uf: 'RS', state: 'Rio Grande do Sul',    region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '54': { uf: 'RS', state: 'Rio Grande do Sul',    region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  '55': { uf: 'RS', state: 'Rio Grande do Sul',    region: 'Sul',        tz: 'America/Sao_Paulo',   utc: 'UTC-3' },
  // Distrito Federal / Centro-Oeste
  '61': { uf: 'DF', state: 'Distrito Federal',     region: 'Centro-Oeste', tz: 'America/Sao_Paulo', utc: 'UTC-3' },
  '62': { uf: 'GO', state: 'Goiás',                region: 'Centro-Oeste', tz: 'America/Sao_Paulo', utc: 'UTC-3' },
  '63': { uf: 'TO', state: 'Tocantins',            region: 'Norte',      tz: 'America/Araguaina',   utc: 'UTC-3' },
  '64': { uf: 'GO', state: 'Goiás',                region: 'Centro-Oeste', tz: 'America/Sao_Paulo', utc: 'UTC-3' },
  '65': { uf: 'MT', state: 'Mato Grosso',          region: 'Centro-Oeste', tz: 'America/Cuiaba',    utc: 'UTC-4' },
  '66': { uf: 'MT', state: 'Mato Grosso',          region: 'Centro-Oeste', tz: 'America/Cuiaba',    utc: 'UTC-4' },
  '67': { uf: 'MS', state: 'Mato Grosso do Sul',   region: 'Centro-Oeste', tz: 'America/Campo_Grande', utc: 'UTC-4' },
  '68': { uf: 'AC', state: 'Acre',                 region: 'Norte',      tz: 'America/Rio_Branco',  utc: 'UTC-5' },
  '69': { uf: 'RO', state: 'Rondônia',             region: 'Norte',      tz: 'America/Porto_Velho', utc: 'UTC-4' },
  // Bahia / Sergipe
  '71': { uf: 'BA', state: 'Bahia',                region: 'Nordeste',   tz: 'America/Bahia',       utc: 'UTC-3' },
  '73': { uf: 'BA', state: 'Bahia',                region: 'Nordeste',   tz: 'America/Bahia',       utc: 'UTC-3' },
  '74': { uf: 'BA', state: 'Bahia',                region: 'Nordeste',   tz: 'America/Bahia',       utc: 'UTC-3' },
  '75': { uf: 'BA', state: 'Bahia',                region: 'Nordeste',   tz: 'America/Bahia',       utc: 'UTC-3' },
  '77': { uf: 'BA', state: 'Bahia',                region: 'Nordeste',   tz: 'America/Bahia',       utc: 'UTC-3' },
  '79': { uf: 'SE', state: 'Sergipe',              region: 'Nordeste',   tz: 'America/Maceio',      utc: 'UTC-3' },
  // Nordeste
  '81': { uf: 'PE', state: 'Pernambuco',           region: 'Nordeste',   tz: 'America/Recife',      utc: 'UTC-3' },
  '82': { uf: 'AL', state: 'Alagoas',              region: 'Nordeste',   tz: 'America/Maceio',      utc: 'UTC-3' },
  '83': { uf: 'PB', state: 'Paraíba',              region: 'Nordeste',   tz: 'America/Fortaleza',   utc: 'UTC-3' },
  '84': { uf: 'RN', state: 'Rio Grande do Norte',  region: 'Nordeste',   tz: 'America/Fortaleza',   utc: 'UTC-3' },
  '85': { uf: 'CE', state: 'Ceará',                region: 'Nordeste',   tz: 'America/Fortaleza',   utc: 'UTC-3' },
  '86': { uf: 'PI', state: 'Piauí',                region: 'Nordeste',   tz: 'America/Fortaleza',   utc: 'UTC-3' },
  '87': { uf: 'PE', state: 'Pernambuco',           region: 'Nordeste',   tz: 'America/Recife',      utc: 'UTC-3' },
  '88': { uf: 'CE', state: 'Ceará',                region: 'Nordeste',   tz: 'America/Fortaleza',   utc: 'UTC-3' },
  '89': { uf: 'PI', state: 'Piauí',                region: 'Nordeste',   tz: 'America/Fortaleza',   utc: 'UTC-3' },
  // Norte
  '91': { uf: 'PA', state: 'Pará',                 region: 'Norte',      tz: 'America/Belem',       utc: 'UTC-3' },
  '92': { uf: 'AM', state: 'Amazonas',             region: 'Norte',      tz: 'America/Manaus',      utc: 'UTC-4' },
  '93': { uf: 'PA', state: 'Pará',                 region: 'Norte',      tz: 'America/Belem',       utc: 'UTC-3' },
  '94': { uf: 'PA', state: 'Pará',                 region: 'Norte',      tz: 'America/Belem',       utc: 'UTC-3' },
  '95': { uf: 'RR', state: 'Roraima',              region: 'Norte',      tz: 'America/Boa_Vista',   utc: 'UTC-4' },
  '96': { uf: 'AP', state: 'Amapá',                region: 'Norte',      tz: 'America/Belem',       utc: 'UTC-3' },
  '97': { uf: 'AM', state: 'Amazonas',             region: 'Norte',      tz: 'America/Manaus',      utc: 'UTC-4' },
  '98': { uf: 'MA', state: 'Maranhão',             region: 'Nordeste',   tz: 'America/Fortaleza',   utc: 'UTC-3' },
  '99': { uf: 'MA', state: 'Maranhão',             region: 'Nordeste',   tz: 'America/Fortaleza',   utc: 'UTC-3' },
};

// ── Operadora por prefixo (estimativa pré-portabilidade) ──────────────────
// Mapa: DDD → lista de [prefixo4digitos, operadora]
// "Prefixo" = primeiros 4 dígitos do número do assinante (ex: 9927 de 992748497)
// Fonte: tabelas ANATEL de distribuição de numeração
// ATENÇÃO: pode estar desatualizado após portabilidade

type CarrierRange = [number, number, string]; // [inicio, fim, operadora] (4 primeiros dígitos)

const CARRIER_RANGES: Record<string, CarrierRange[]> = {
  // Padrão nacional para celular (9 + 8 dígitos): prefixo = primeiros 4 dígitos do assinante
  // Ex: 9927 → DDD 92, prefixo 9927
  // Vivo (Telefônica): 9900-9939, 9949-9979 (varia por DDD)
  // TIM: 9800-9849, 9850-9899
  // Claro: 9700-9799, 9200-9299
  // Oi: 9600-9699, 9100-9199
  // Algar: algumas faixas regionais
  // Nota: prefixo aqui são os 2 dígitos APÓS o 9 inicial

  // Regra simplificada por segundo dígito do assinante móvel (após o 9):
  // 9 0xxx → Vivo
  // 9 1xxx → Oi / Claro
  // 9 2xxx-9 3xxx → Claro
  // 9 4xxx → TIM
  // 9 5xxx → TIM / Vivo
  // 9 6xxx → Oi
  // 9 7xxx → Vivo
  // 9 8xxx → TIM
  // 9 9xxx → Vivo / Claro
};

// Estimativa por segundo dígito do assinante (após o 9 inicial)
const MOBILE_PREFIX_CARRIER: Record<string, string> = {
  '90': 'Vivo', '91': 'Oi', '92': 'Claro', '93': 'Claro',
  '94': 'TIM',  '95': 'TIM', '96': 'Oi',  '97': 'Vivo',
  '98': 'TIM',  '99': 'Vivo',
};

// Prefixos fixos por DDD (primeiros 4 dígitos do assinante)
const LANDLINE_PREFIX_CARRIER: Record<string, string> = {
  // Vivo (fixo): prefixos 3xxx em SP
  '30': 'Vivo', '31': 'Vivo', '32': 'Vivo', '33': 'Vivo',
  '34': 'Vivo', '35': 'Vivo', '36': 'Vivo', '37': 'Vivo',
  '38': 'Vivo', '39': 'Vivo',
  // Oi: 2xxx, 4xxx
  '20': 'Oi', '21': 'Oi', '22': 'Oi', '23': 'Oi', '24': 'Oi',
  '25': 'Oi', '26': 'Oi', '27': 'Oi', '28': 'Oi', '29': 'Oi',
  '40': 'Oi', '41': 'Oi', '42': 'Oi', '43': 'Oi', '44': 'Oi',
  // Claro: 5xxx
  '50': 'Claro', '51': 'Claro', '52': 'Claro', '53': 'Claro',
};

function estimateCarrier(nationalNumber: string, isMobile: boolean): string | null {
  if (nationalNumber.length < 4) return null;

  // Celular brasileiro: DDD(2) + 9 + 8 dígitos
  // Pegar os 2 dígitos após o 9 inicial
  if (isMobile && nationalNumber.length >= 5 && nationalNumber[2] === '9') {
    const prefix2 = nationalNumber.substring(2, 4); // ex: '99' de '9299...'
    return MOBILE_PREFIX_CARRIER[prefix2] ?? null;
  }

  // Fixo: DDD(2) + 4 dígitos iniciais
  if (!isMobile && nationalNumber.length >= 6) {
    const prefix2 = nationalNumber.substring(2, 4);
    return LANDLINE_PREFIX_CARRIER[prefix2] ?? null;
  }

  return null;
}

// ── Função pública ────────────────────────────────────────────────────────

export function getPhoneMeta(rawNumber: string): PhoneMeta {
  const empty: PhoneMeta = {
    ddd: null, state: null, uf: null, region: null,
    timezone: null, utcOffset: null, carrier: null, carrierIsEstimate: false,
  };

  try {
    const phone = parsePhoneNumber(rawNumber, 'BR');
    if (phone.country !== 'BR') return empty;

    const national = phone.nationalNumber as string; // ex: '92992748497'
    const ddd = national.substring(0, 2);
    const meta = DDD_META[ddd];
    if (!meta) return { ...empty, ddd };

    const type = phone.getType();
    const isMobile = type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE';
    const carrier = estimateCarrier(national, isMobile);

    return {
      ddd,
      state: meta.state,
      uf: meta.uf,
      region: meta.region,
      timezone: meta.tz,
      utcOffset: meta.utc,
      carrier,
      carrierIsEstimate: carrier !== null,
    };
  } catch {
    return empty;
  }
}
