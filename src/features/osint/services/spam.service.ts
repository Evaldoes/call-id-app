import axios from 'axios';
import { normalizeNumber } from '../../../shared/utils/phone.utils';

export interface SpamResult {
  isSpam: boolean;
  confidence: 'low' | 'medium' | 'high';
  score: number;
  reasons: string[];
  reports?: number;
}

// Prefixos usados massivamente por telemarketers no Brasil
const TELEMARKETING_PREFIXES = [
  '0800', '0300', '0500', '4002', '4003', '4004', '4007',
  '3003', '3004',
];

// Operadoras de telemarketing intensivo — DDDs suspeitos quando combinados com padrões
const HIGH_RISK_DDD_PATTERNS = [
  /^55(11|21|31|41|51|61|71|81|85|92)(4\d{7}|3\d{7})$/,
];

// Números repetitivos são comuns em robocalls
function hasRepetitivePattern(digits: string): boolean {
  const last8 = digits.slice(-8);
  return /^(.)\1{4,}/.test(last8) || /^(\d{2})\1{3}/.test(last8);
}

export function analyzeSpamLocal(rawNumber: string): SpamResult {
  const digits = normalizeNumber(rawNumber);
  const reasons: string[] = [];
  let score = 0;

  for (const prefix of TELEMARKETING_PREFIXES) {
    if (digits.includes(prefix)) {
      reasons.push(`Prefixo de telemarketing detectado (${prefix})`);
      score += 40;
      break;
    }
  }

  for (const pattern of HIGH_RISK_DDD_PATTERNS) {
    if (pattern.test(digits)) {
      reasons.push('Padrão de número associado a telemarketing');
      score += 20;
      break;
    }
  }

  if (hasRepetitivePattern(digits)) {
    reasons.push('Sequência repetitiva suspeita');
    score += 30;
  }

  // Número muito curto (menos de 10 dígitos sem código de país) = incomum
  if (digits.length < 10) {
    reasons.push('Número com formato incomum');
    score += 15;
  }

  const capped = Math.min(score, 100);
  return {
    isSpam: capped >= 50,
    confidence: capped >= 70 ? 'high' : capped >= 40 ? 'medium' : 'low',
    score: capped,
    reasons,
  };
}

// Consulta o índice público da Anatel (numeração BR)
export async function checkAnatel(e164: string): Promise<{ operator?: string; portedFrom?: string } | null> {
  try {
    const national = e164.replace(/^\+55/, '');
    const { data } = await axios.get(
      `https://sistemas.anatel.gov.br/PGMQ/api/numeros/${national}`,
      { timeout: 6000 },
    );
    if (data?.operadora) {
      return {
        operator: data.operadora,
        portedFrom: data.operadoraOrigem,
      };
    }
  } catch {}
  return null;
}

export async function checkShouldIAnswer(e164: string): Promise<Partial<SpamResult>> {
  try {
    const number = e164.replace('+', '');
    const { data } = await axios.get(
      `https://www.shouldianswer.com/api/v1/phone-number/${number}`,
      {
        timeout: 6000,
        headers: { Accept: 'application/json' },
      },
    );
    if (data) {
      return {
        isSpam: (data.score ?? 0) < 0,
        score: Math.abs(data.score ?? 0),
        reports: data.comments_count ?? 0,
      };
    }
  } catch {}
  return {};
}
