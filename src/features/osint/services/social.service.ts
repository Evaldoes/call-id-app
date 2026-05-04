import axios from 'axios';
import { parsePhoneNumber } from 'libphonenumber-js';

export type CheckStatus = 'checking' | 'found' | 'not_found' | 'unknown';

export interface SocialCheck {
  platform: string;
  status: CheckStatus;
  detail?: string;
  url: string;
  iconName: string;
  color: string;
}

export interface SocialPresence {
  checks: SocialCheck[];
  e164: string;
  nationalNumber: string;
}

function parseNumber(raw: string): { e164: string; national: string; stripped: string } {
  try {
    const p = parsePhoneNumber(raw, 'BR');
    const e164 = p.format('E.164');
    return { e164, national: p.formatNational().replace(/\D/g, ''), stripped: e164.replace('+', '') };
  } catch {
    const stripped = raw.replace(/\D/g, '');
    return { e164: `+${stripped}`, national: stripped, stripped };
  }
}

// ── Checadores individuais ────────────────────────────────────────────────

const RISK_PT: Record<string, string> = {
  Low: 'Baixo', Medium: 'Médio', High: 'Alto',
};

const COUNTRY_PT: Record<string, string> = {
  Brazil: 'Brasil', 'United States': 'Estados Unidos', 'United Kingdom': 'Reino Unido',
  Germany: 'Alemanha', France: 'França', Spain: 'Espanha', Portugal: 'Portugal',
  Italy: 'Itália', Argentina: 'Argentina', Chile: 'Chile', Colombia: 'Colômbia',
  Mexico: 'México', Peru: 'Peru', Bolivia: 'Bolívia', Paraguay: 'Paraguai',
  Uruguay: 'Uruguai', Venezuela: 'Venezuela', Ecuador: 'Equador',
  Canada: 'Canadá', Australia: 'Austrália', Japan: 'Japão', China: 'China',
  India: 'Índia', Russia: 'Rússia', Netherlands: 'Holanda', Switzerland: 'Suíça',
  Belgium: 'Bélgica', Sweden: 'Suécia', Norway: 'Noruega', Denmark: 'Dinamarca',
  Finland: 'Finlândia', Poland: 'Polônia', 'South Africa': 'África do Sul',
  Nigeria: 'Nigéria', Angola: 'Angola', Mozambique: 'Moçambique',
};

// DDD -> cidade principal (Brasil)
const DDD_MAP: Record<string, string> = {
  '11':'São Paulo','12':'São José dos Campos','13':'Santos','14':'Bauru',
  '15':'Sorocaba','16':'Ribeirão Preto','17':'São José do Rio Preto','18':'Presidente Prudente',
  '19':'Campinas','21':'Rio de Janeiro','22':'Campos dos Goytacazes','24':'Volta Redonda',
  '27':'Vitória','28':'Cachoeiro de Itapemirim','31':'Belo Horizonte','32':'Juiz de Fora',
  '33':'Governador Valadares','34':'Uberlândia','35':'Pouso Alegre','37':'Divinópolis',
  '38':'Montes Claros','41':'Curitiba','42':'Ponta Grossa','43':'Londrina','44':'Maringá',
  '45':'Foz do Iguaçu','46':'Francisco Beltrão','47':'Joinville','48':'Florianópolis',
  '49':'Chapecó','51':'Porto Alegre','53':'Pelotas','54':'Caxias do Sul','55':'Santa Maria',
  '61':'Brasília','62':'Goiânia','63':'Palmas','64':'Rio Verde','65':'Cuiabá',
  '66':'Rondonópolis','67':'Campo Grande','68':'Rio Branco','69':'Porto Velho',
  '71':'Salvador','73':'Ilhéus','74':'Juazeiro','75':'Feira de Santana','77':'Vitória da Conquista',
  '79':'Aracaju','81':'Recife','82':'Maceió','83':'João Pessoa','84':'Natal',
  '85':'Fortaleza','86':'Teresina','87':'Petrolina','88':'Juazeiro do Norte',
  '89':'Picos','91':'Belém','92':'Manaus','93':'Santarém','94':'Marabá',
  '95':'Boa Vista','96':'Macapá','97':'Coari','98':'São Luís','99':'Imperatriz',
};

export interface SpamCallsResult {
  riskLabel: string | null;         // 'Low' | 'Medium' | 'High'
  estimation: 'serioes' | 'unserioes' | 'neutral' | null; // trustworthy | untrustworthy | neutral
  reports: number;                  // quantidade de relatos de usuários
  country: string | null;           // país de origem
  city: string | null;              // cidade pelo DDD (BR)
  leadText: string | null;          // texto descritivo da página
  lat: number | null;               // coordenada do país
  lng: number | null;
  isSpam: boolean;
}

async function checkSpamCalls(e164: string): Promise<Partial<SocialCheck> & { spamData?: SpamCallsResult }> {
  try {
    const { data } = await axios.get(
      `https://spamcalls.net/en/search?q=${encodeURIComponent(e164)}`,
      {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://spamcalls.net/en/',
        },
      },
    );

    // Spam risk: <h3 class="typ"><span class="thinner">Spam-Risk</span> <strong>Low</strong>
    const riskMatch = data.match(/Spam-Risk<\/span>\s*<strong>([^<]+)<\/strong>/i);
    const riskLabel = riskMatch?.[1]?.trim() ?? null;

    // User reports: <span class="zusammenfassung-meldungen ...">0</span>
    const reportsMatch = data.match(/zusammenfassung-meldungen[^>]*>(\d+)<\/span>/);
    const reports = reportsMatch ? parseInt(reportsMatch[1], 10) : 0;

    // Estimation icon: bg-serioes | bg-unserioes | bg-neutral
    const estMatch = data.match(/zusammenfassung-serioesitaet[^>]*bg-(serioes|unserioes|neutral)/);
    const estimation = (estMatch?.[1] ?? null) as SpamCallsResult['estimation'];

    // Country from summary block: <span class="subline"><a href=".../country-code/55">Brazil</a>
    const countryRawMatch = data.match(/country-code\/\d+[^>]*>([^<]+)<\/a>/i);
    const countryRaw = countryRawMatch?.[1]?.trim() ?? null;
    const country = countryRaw ? (COUNTRY_PT[countryRaw] ?? countryRaw) : null;

    // DDD → city (only for Brazilian numbers +55)
    const dddMatch = e164.match(/^\+55(\d{2})/);
    const city = dddMatch ? (DDD_MAP[dddMatch[1]] ?? null) : null;

    // Map marker coordinates (country-level center)
    const coordMatch = data.match(/L\.marker\(\[([-\d.]+),\s*([-\d.]+)\]/);
    const lat = coordMatch ? parseFloat(coordMatch[1]) : null;
    const lng = coordMatch ? parseFloat(coordMatch[2]) : null;

    const isSpam = estimation === 'unserioes' || reports > 0;

    // Generate lead text in Portuguese based on parsed data
    const riskPT = riskLabel ? (RISK_PT[riskLabel] ?? riskLabel) : null;
    const leadText = reports > 0
      ? `Este número possui ${reports} relato${reports !== 1 ? 's' : ''} de spam. Risco avaliado como ${riskPT ?? 'desconhecido'}.`
      : `Nenhum relato de spam encontrado. Risco avaliado como ${riskPT ?? 'desconhecido'}.`;

    const spamData: SpamCallsResult = {
      riskLabel: riskPT,
      estimation, reports, country, city, leadText, lat, lng, isSpam,
    };

    // Build concise detail string for the card
    const parts: string[] = [];
    if (reports > 0) parts.push(`${reports} relato${reports !== 1 ? 's' : ''}`);
    else parts.push('Sem relatos');
    if (riskPT) parts.push(`Risco ${riskPT}`);
    if (city) parts.push(city);
    else if (country) parts.push(country);

    return {
      status: isSpam ? 'found' : 'not_found',
      detail: parts.join(' · '),
      spamData,
    };
  } catch {
    return { status: 'unknown' };
  }
}

async function checkShouldIAnswer(e164: string): Promise<Partial<SocialCheck>> {
  try {
    // BR site uses trunk prefix: 0 + national (e.g. +5592... → 092...)
    const isBR = e164.startsWith('+55');
    const nationalDigits = isBR ? e164.slice(3) : e164.replace(/^\+/, '');
    const urlNumber = isBR ? `0${nationalDigits}` : nationalDigits;
    const baseUrl = isBR
      ? `https://br.shouldianswer.net/numero-de-telefone/${urlNumber}`
      : `https://www.shouldianswer.com/phone-number/${urlNumber}`;

    const { data } = await axios.get(baseUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        'Referer': 'https://www.shouldianswer.com/',
      },
    });

    // Score class in mainInfoHeader: score unknown | negative | neutral | positive
    const scoreClassMatch = data.match(/mainInfoHeader[\s\S]*?class="score\s+(unknown|negative|neutral|positive)"/);
    const scoreClass = scoreClassMatch?.[1] ?? 'unknown';

    // Line type: <span>telefone celular</span> or <span>telefone fixo</span>
    const lineMatch = data.match(/<span>(telefone\s+\w+)<\/span>/i);
    const lineType = lineMatch?.[1] ?? null;

    // Schema.org ratingValue (2.5=unknown, 1=negative, 5=positive)
    const ratingMatch = data.match(/itemprop="ratingValue"\s+content="([\d.]+)"/);
    const ratingValue = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    // User review count — count <div class="review " (not reviewNew)
    const reviewCount = (data.match(/<div class="review [^"]*">/g) ?? [])
      .filter((m: string) => !m.includes('reviewNew')).length;

    // Category from JS var categoriesNames — pick first assigned category id
    const catNamesMatch = data.match(/var categoriesNames\s*=\s*(\{[^}]+\})/);
    // Category selected for this number (if any review set it) - look for active category button text
    const activeCatMatch = data.match(/class="[^"]*active[^"]*"[^>]*>\s*([^<]{3,40})\s*<\//);
    const category = activeCatMatch?.[1]?.trim() ?? null;

    const isSpam = scoreClass === 'negative';
    const isPositive = scoreClass === 'positive';

    const scoreLabel: Record<string, string> = {
      negative: 'Negativo',
      neutral: 'Neutro',
      positive: 'Positivo',
      unknown: 'Desconhecido',
    };

    const parts: string[] = [];
    if (reviewCount > 0) parts.push(`${reviewCount} avaliação${reviewCount !== 1 ? 'ões' : ''}`);
    else parts.push('Sem avaliações');
    parts.push(`Score: ${scoreLabel[scoreClass]}`);
    if (lineType) parts.push(lineType.replace('telefone ', ''));
    if (category) parts.push(category);

    return {
      status: isSpam ? 'found' : isPositive ? 'not_found' : 'unknown',
      detail: parts.join(' · '),
    };
  } catch {
    return { status: 'unknown' };
  }
}

// wa.me não expõe server-side se um número está cadastrado —
// a verificação só acontece dentro do app do WhatsApp após o deep link abrir.
// Mantemos como link manual; status sempre unknown.
function checkWhatsApp(_stripped: string): Partial<SocialCheck> {
  return { status: 'unknown', detail: 'Toque para verificar no WhatsApp' };
}


async function checkTellows(stripped: string): Promise<Partial<SocialCheck>> {
  try {
    const { data } = await axios.get(
      `https://www.tellows.com.br/num/${stripped}`,
      {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      },
    );

    // Score from image: score/s5.jpg → 5 (1-3=seguro, 4-6=neutro, 7-9=perigoso)
    const scoreMatch = data.match(/score\/s(\d)\.(?:jpg|png)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    // City/region from page title: "Quem é 0... de Uberlândia, Minas Gerais | Score..."
    const cityMatch = data.match(/de ([^|]+?)\s*\|\s*Score/);
    const city = cityMatch?.[1]?.trim() ?? null;

    // No ratings flag
    const noRatings = /não há classificações|sem classificações|no ratings/i.test(data);

    // Number of user comments (if any)
    const commentsMatch = data.match(/(\d+)\s*comentário/i);
    const comments = commentsMatch ? parseInt(commentsMatch[1], 10) : 0;

    if (score === null) return { status: 'unknown' };

    const SCORE_LABEL: Record<number, string> = {
      1: 'Seguro', 2: 'Seguro', 3: 'Seguro',
      4: 'Neutro', 5: 'Neutro', 6: 'Neutro',
      7: 'Suspeito', 8: 'Perigoso', 9: 'Perigoso',
    };
    const label = SCORE_LABEL[score] ?? 'Desconhecido';
    const isSpam = score >= 7;

    const parts: string[] = [`Score ${score}/9 · ${label}`];
    if (comments > 0) parts.push(`${comments} comentário${comments !== 1 ? 's' : ''}`);
    else if (noRatings) parts.push('Sem avaliações');
    if (city) parts.push(city);

    return {
      status: isSpam ? 'found' : noRatings ? 'unknown' : 'not_found',
      detail: parts.join(' · '),
    };
  } catch {
    return { status: 'unknown' };
  }
}

// ── Orquestrador público ──────────────────────────────────────────────────

export function buildInitialChecks(raw: string): SocialPresence {
  const { e164, national, stripped } = parseNumber(raw);

  const checks: SocialCheck[] = [
    {
      platform: 'WhatsApp',
      status: 'unknown',
      detail: 'Toque para verificar no WhatsApp',
      url: `https://wa.me/${stripped}`,
      iconName: 'message-circle-outline',
      color: '#25D366',
    },
    {
      platform: 'SpamCalls',
      status: 'checking',
      url: `https://spamcalls.net/en/search?q=${encodeURIComponent(e164)}`,
      iconName: 'shield-outline',
      color: '#E74C3C',
    },
    {
      platform: 'ShouldIAnswer',
      status: 'checking',
      url: e164.startsWith('+55')
        ? `https://br.shouldianswer.net/numero-de-telefone/0${e164.slice(3)}`
        : `https://www.shouldianswer.com/phone-number/${stripped}`,
      iconName: 'alert-circle-outline',
      color: '#E67E22',
    },
    {
      platform: 'Tellows',
      status: 'checking',
      url: `https://www.tellows.com.br/num/${stripped}`,
      iconName: 'bar-chart-outline',
      color: '#FF6600',
    },
    {
      platform: 'Telegram',
      status: 'unknown',
      detail: 'Toque para verificar no Telegram',
      url: `https://t.me/+${stripped}`,
      iconName: 'paper-plane-outline',
      color: '#2AABEE',
    },
    {
      platform: 'Google',
      status: 'unknown',
      detail: 'Toque para pesquisar',
      url: `https://www.google.com/search?q="${e164}"+OR+"${national}"`,
      iconName: 'search-outline',
      color: '#4285F4',
    },
  ];

  return { checks, e164, nationalNumber: national };
}

export async function runSingleCheck(
  platform: string,
  e164: string,
): Promise<Partial<SocialCheck> & { spamData?: SpamCallsResult }> {
  const stripped = e164.replace('+', '');
  switch (platform) {
    case 'WhatsApp':     return checkWhatsApp(stripped);
    case 'SpamCalls':    return checkSpamCalls(e164);
    case 'ShouldIAnswer':return checkShouldIAnswer(e164);
    case 'Tellows':      return checkTellows(stripped);
    default:             return { status: 'unknown' };
  }
}
