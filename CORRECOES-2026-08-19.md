# Correções SGE — 19/08/2026

## 1. Militar novo desaparecia após reabrir
Causa encontrada: o formulário envia campos opcionais com valor `undefined`. O Firestore rejeita objetos com `undefined`, mas o erro era apenas registrado no console; a interface mantinha o registro local/otimista até a próxima carga.

Correção aplicada em `src/lib/firebase.ts`:
- sanitização profunda dos payloads antes de gravações no Firestore;
- gravação de militar individual substitui o documento completo para também remover campos opcionais antigos;
- espelho individual também é atualizado no Realtime Database;
- sanitização estendida a usuários, organizações, destinos, assignments, metadados, agenda, missões, pernoite e aditamento para evitar o mesmo padrão de falha.

## 2. Escala mobile escondia dias/folgas
Causa encontrada: quatro colunas sticky ocupavam aproximadamente 492 px antes das colunas dos dias. Em telas de celular, os dias ficavam atrás das colunas congeladas.

Correção aplicada em `src/components/EscalasView.tsx`:
- em telas menores que `sm`, Nº, graduação e seletor de função deixam de ocupar a área congelada;
- o nome do militar permanece sticky à esquerda;
- os dias ficam imediatamente visíveis e continuam com rolagem horizontal;
- desktop mantém as quatro colunas e o layout atual.

## Pontos adicionais identificados na auditoria
- existe uma camada antiga/local em `src/services/db.ts` e páginas legadas que não são usadas pelo fluxo principal atual; não foi removida para evitar regressão desnecessária;
- há várias gravações que apenas registravam erro no console; a sanitização central reduz falhas silenciosas por `undefined`;
- o projeto possui configuração PWA duplicada (registro manual + `vite-plugin-pwa`), ponto recomendado para uma próxima limpeza porque pode causar comportamento de cache/service worker difícil de diagnosticar;
- existem usos de `toISOString().split('T')[0]` para "hoje" em várias telas; no fuso do Brasil isso pode virar o dia antecipadamente à noite. Recomenda-se padronizar depois com data local.

## Validação
A estrutura e as alterações foram revisadas estaticamente. O ambiente desta análise não conseguiu instalar as dependências npm dentro do limite disponível, portanto o `tsc` completo não pôde ser validado com os módulos do projeto presentes.
