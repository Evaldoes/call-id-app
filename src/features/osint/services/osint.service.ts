import { lookupNumber } from '../../lookup/services/lookup.service';
import {
  analyzeSpamLocal,
  checkShouldIAnswer,
  checkAnatel,
  SpamResult,
} from './spam.service';
import type { CallerInfo } from '../../../types';

export type RiskLevel = 'safe' | 'unknown' | 'suspicious' | 'dangerous';

export interface AnatelInfo {
  operator?: string;
  portedFrom?: string;
}

export interface OsintReport {
  number: string;
  callerInfo: CallerInfo;
  spam: SpamResult;
  anatel: AnatelInfo | null;
  riskLevel: RiskLevel;
  summary: string;
  generatedAt: Date;
}

function calcRiskLevel(spam: SpamResult, callerInfo: CallerInfo): RiskLevel {
  if (spam.score >= 70) return 'dangerous';
  if (spam.score >= 40) return 'suspicious';
  if (callerInfo.valid) return 'safe';
  return 'unknown';
}

function buildSummary(report: Omit<OsintReport, 'summary' | 'generatedAt'>): string {
  const parts: string[] = [];

  if (report.callerInfo.countryName) {
    parts.push(`Origem: ${report.callerInfo.countryName}`);
  }
  if (report.callerInfo.carrier) {
    parts.push(`Operadora: ${report.callerInfo.carrier}`);
  }
  if (report.anatel?.operator) {
    parts.push(`Anatel: ${report.anatel.operator}`);
  }
  if (report.spam.isSpam) {
    parts.push(`⚠ Possível spam (score: ${report.spam.score})`);
  }
  if (report.spam.reports) {
    parts.push(`${report.spam.reports} relatos na comunidade`);
  }

  return parts.join(' · ') || 'Informações insuficientes para análise.';
}

export async function buildOsintReport(
  rawNumber: string,
  apiOptions: { numverifyKey?: string; abstractApiKey?: string },
): Promise<OsintReport> {
  const [callerInfo, shouldIAnswer, anatel] = await Promise.allSettled([
    lookupNumber(rawNumber, apiOptions),
    checkShouldIAnswer(rawNumber),
    checkAnatel(rawNumber),
  ]);

  const info =
    callerInfo.status === 'fulfilled'
      ? callerInfo.value
      : ({
          number: rawNumber,
          valid: false,
          provider: 'local',
          fetchedAt: new Date(),
        } as CallerInfo);

  const communitySpam =
    shouldIAnswer.status === 'fulfilled' ? shouldIAnswer.value : {};
  const anatelInfo =
    anatel.status === 'fulfilled' ? anatel.value : null;

  const localSpam = analyzeSpamLocal(rawNumber);

  // Mescla análise local com dados da comunidade
  const spam: SpamResult = {
    isSpam: localSpam.isSpam || communitySpam.isSpam || false,
    confidence: communitySpam.reports
      ? 'high'
      : localSpam.confidence,
    score: Math.max(localSpam.score, communitySpam.score ?? 0),
    reasons: localSpam.reasons,
    reports: communitySpam.reports,
  };

  const riskLevel = calcRiskLevel(spam, info);

  const partial = { number: rawNumber, callerInfo: info, spam, anatel: anatelInfo, riskLevel };

  return {
    ...partial,
    summary: buildSummary(partial),
    generatedAt: new Date(),
  };
}
