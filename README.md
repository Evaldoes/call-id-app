# CallerID — Identificador de Chamadas com OSINT

Aplicativo Android que identifica chamadas recebidas e realiza análise de inteligência de fonte aberta (OSINT) sobre qualquer número de telefone.

> Desenvolvido com React Native (Expo bare workflow) + UI Kitten, totalmente em português.

---

## Funcionalidades

- **Identificação automática** — detecta chamadas recebidas em segundo plano e exibe notificação com dados do número
- **Consulta manual OSINT** — busca qualquer número e exibe relatório completo de inteligência
- **Análise de spam** — combina detecção local por padrões + consulta nas comunidades SpamCalls, ShouldIAnswer e Tellows
- **Metadados locais BR** — estado, UF, região, fuso horário e estimativa de operadora derivados do DDD, sem API externa
- **Presença online** — verifica o número em SpamCalls, ShouldIAnswer, Tellows; abre WhatsApp, Telegram e Google com um toque
- **Histórico de chamadas** — registra e enriquece automaticamente as chamadas recebidas/perdidas
- **Score de risco** — classificação em 4 níveis: Seguro / Desconhecido / Suspeito / Perigoso
- **APIs opcionais** — suporte a NumVerify e Abstract Phone para operadora e localização detalhada
- **Sem telemetria** — nenhum dado é enviado a servidores próprios; tudo roda no dispositivo ou consultas diretas às fontes

---

## Stack técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 (bare workflow) |
| UI | UI Kitten v5 + Eva Design System (tema escuro) |
| Navegação | React Navigation v7 (bottom tabs + native stack) |
| Estado global | Zustand v5 |
| Armazenamento seguro | Expo Secure Store |
| Parsing de telefone | libphonenumber-js |
| HTTP | Axios |
| Linguagem | TypeScript 5.9 |

---

## Arquitetura

O projeto segue a estrutura **feature-first**, onde cada funcionalidade tem seus próprios screens, componentes, hooks, services e store:

```
src/
├── features/
│   ├── calls/
│   │   ├── components/     # CallItem
│   │   ├── hooks/          # useCallMonitor, useCallLogImport, useAutoImport
│   │   ├── screens/        # CallsScreen, CallDetailScreen
│   │   ├── services/       # calllog.service
│   │   └── store/          # calls.store (Zustand)
│   ├── lookup/
│   │   ├── components/     # CallerInfoCard
│   │   ├── hooks/          # useLookup
│   │   ├── screens/        # LookupScreen
│   │   └── services/       # lookup.service (NumVerify / AbstractAPI)
│   ├── osint/
│   │   ├── components/     # RiskBanner, IntelCard, SpamCard, SocialPresenceCard
│   │   ├── hooks/          # useOsint
│   │   ├── screens/        # OsintScreen
│   │   └── services/       # osint.service, spam.service, social.service
│   └── settings/
│       ├── screens/        # SettingsScreen
│       └── store/          # settings.store (Zustand + SecureStore)
├── navigation/             # AppNavigator (bottom tabs)
├── shared/
│   ├── components/         # LoadingSpinner, Tag
│   ├── hooks/              # usePermissions
│   └── utils/
│       ├── phone.utils.ts  # parseLocal, formatDisplayNumber, normalizeNumber
│       └── phone.meta.ts   # getPhoneMeta — DDD → estado / região / fuso / operadora
└── types/                  # CallerInfo, CallRecord, ApiSettings, LookupStatus
```

### Fluxo de análise OSINT

```
rawNumber
  └─ lookupNumber()       → CallerInfo (local + API opcional)
       └─ parseLocal()    → libphonenumber-js + getPhoneMeta()
  └─ checkShouldIAnswer() → score da comunidade (spam.service)
  └─ checkAnatel()        → operadora ANATEL (quando disponível)
  └─ analyzeSpamLocal()   → detecção offline por padrões BR
  └─ buildOsintReport()   → OsintReport com riskLevel + summary

// Paralelamente (SocialPresenceCard):
  └─ runSingleCheck()     → SpamCalls / ShouldIAnswer / Tellows (scraping)
```

---

## Pré-requisitos

- Node.js 18+
- Android Studio com SDK 34+ (para build nativo)
- Dispositivo ou emulador Android

---

## Instalação e execução

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/caller-id-app.git
cd caller-id-app

# Instalar dependências
npm install

# Executar no Android (conecte um dispositivo ou inicie um emulador)
npm run android
```

> **Nota:** o projeto usa **bare workflow** do Expo. Não funciona com Expo Go — é necessário um build nativo.

---

## Chaves de API (opcional)

O app funciona sem chaves de API. Para habilitar dados de operadora e localização mais precisos, configure em **Config → Chaves de API**:

| Serviço | Plano gratuito | O que adiciona |
|---------|---------------|----------------|
| [NumVerify](https://apilayer.com/marketplace/number_verification-api) | 250 req/mês | operadora, localização, tipo de linha |
| [Abstract Phone](https://app.abstractapi.com/api/phone-validation/) | 250 req/mês | operadora, localização, tipo de linha |

As chaves são armazenadas localmente via **Expo Secure Store** (Keystore/Keychain do sistema operacional).

---

## Permissões Android

| Permissão | Finalidade |
|-----------|-----------|
| `READ_PHONE_STATE` | Detectar chamadas recebidas em segundo plano |
| `READ_CALL_LOG` | Importar histórico de chamadas do dispositivo |
| `PROCESS_INCOMING_CALLS` | Receber eventos de chamadas |
| `RECEIVE_BOOT_COMPLETED` | Reiniciar monitoramento após reboot |
| `FOREGROUND_SERVICE` | Manter monitoramento ativo |
| `POST_NOTIFICATIONS` | Exibir notificação com dados do chamador |

---

## Metadados locais BR (offline)

O módulo `phone.meta.ts` fornece informações derivadas do DDD sem nenhuma API externa:

- **Estado e UF** — ex: `Amazonas (AM)`
- **Região** — ex: `Norte`
- **Fuso horário** — tabela com os 67 DDDs brasileiros (IANA + offset UTC)
- **Operadora estimada** — estimativa por prefixo de celular (~70% de acurácia; portabilidade numérica reduz precisão)

---

## Licença

MIT © Evaldo Cardoso
