# SGE Integrado — Remix + Projeto Original

- Interface/arquitetura base: Remix recebido.
- Firebase ativo: projeto original `escala2plus`.
- Organização `rancho` usa os caminhos legados sem sufixo para preservar dados existentes:
  - `militares`
  - `assignments`
  - `destinos`
  - `escalas_meta`
  - `red_days`
  - `aditamentos`
- Organizações futuras usam caminhos isolados com sufixo por `orgId`.
- Nenhuma migração automática dos dados existentes é executada.

## Correção v2 - 14/08/2026
- Dia vermelho manual: Realtime Database passa a ser a única fonte de sincronização ao vivo de `red_days`, evitando corrida com o listener do Firestore que podia reverter a marcação para preta.
- Firestore continua recebendo uma cópia de backup de `red_days` e serve como fallback legado caso RTDB esteja vazio.
- Mantida a lógica original de contagem de folga preta/vermelha no `EscalasView`.
- Logo SGE substituído pelo arquivo exato fornecido pelo usuário em 14/08/2026.
- Ícones PWA/iPhone derivados da mesma arte e cache do service worker incrementado para forçar atualização visual.

## V3 — logo empacotado no React + PWA

- O logo oficial enviado pelo usuário agora existe em `src/assets/sge-logo.png` e é importado diretamente por `SgeLogo.tsx`; não depende mais de caminho absoluto em `public` para aparecer no PC/preview.
- O mesmo logo oficial foi usado como fonte para `public/sge-logo.png`, `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`, favicons e `escala-icon.png`.
- O cache do service worker foi elevado para `sge-pwa-v3-logo-bundled-20260814`.
- Referências de favicon/PWA receberam versão nova para evitar reaproveitamento do ícone antigo.
- Nenhuma alteração foi feita na lógica de escala/folgas desta V3.


## V5 - logo embutido
O logo principal do componente SgeLogo agora fica embutido em base64 no próprio TSX, evitando falha do importador do AI Studio com arquivos binários. Os ícones PWA continuam em public.


## V6 — Identidade verde neon
- Interface alinhada ao logo oficial: verde neon/lima como cor principal.
- Tons azul, ciano, índigo e roxo convertidos para a família verde/lima.
- Fundo principal ajustado de azul-marinho para preto/verde-oliva muito escuro.
- Dourado/âmbar e vermelho preservados como acentos funcionais.
- Nenhuma alteração em Firebase, dados, folgas ou lógica de escala.
