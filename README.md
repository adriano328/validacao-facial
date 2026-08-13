# E-Voto

Aplicacao React para cadastro, autenticacao com 2FA e exibicao de informacoes
do usuario autenticado.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- Axios
- SweetAlert2

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Variaveis de ambiente

Crie um arquivo `.env.local` quando precisar sobrescrever os valores padrao:

```bash
VITE_API_BASE_URL=https://sua-api.execute-api.us-east-1.amazonaws.com/test
```

## Arquitetura

O projeto segue uma organizacao por camadas e features:

```text
src/
  app/
    config/       # configuracoes globais da aplicacao
    providers/    # composicao de providers React
    routes/       # definicao das rotas
    App.tsx

  features/
    auth/         # token, fluxo de autenticacao e rotas protegidas
    document-verification/
    login/
    registration/
    two-factor/
    user/

  shared/
    api/          # cliente HTTP compartilhado
    data/         # listas e dados estaticos
    lib/          # wrappers de bibliotecas
    styles/       # estilos globais
    ui/           # componentes reutilizaveis
    utils/        # helpers puros

  main.tsx
```

## Convencoes

- `app` deve conter apenas composicao da aplicacao, rotas e configuracoes.
- `features` deve conter codigo ligado a um fluxo de negocio especifico.
- `shared` deve conter codigo reutilizavel e sem dependencia de uma feature.
- Imports entre camadas devem usar aliases:
  - `@app/*`
  - `@features/*`
  - `@shared/*`
- Evite imports relativos longos como `../../../`.
- Novos endpoints devem ficar no `api` da propria feature, usando
  `@shared/api/client`.

## Build

O build de producao executa TypeScript e Vite:

```bash
npm run build
```
