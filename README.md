# Santo Neon — Home

Nova home da [santoneon.com.br](https://santoneon.com.br), reformulada a partir do
briefing de posicionamento: tirar a Santo Neon da comparação por preço e mostrar
a tecnologia — **impressão 3D no acrílico**, **LED que não estoura na câmera** e
**1 ano de garantia**.

## O que tem na página

| Seção | O que faz |
| --- | --- |
| Hero | Letreiro neon que "pega" com flicker real (GSAP) sobre fundo de partículas Three.js que reage ao mouse e ao scroll |
| Clientes | Marquee infinito com os cases citados no briefing (Barreto, Chaim, Pecorino) |
| Tecnologia | Os 3 diferenciais que tiram a marca da guerra de preço |
| Teste da câmera | Demo interativa: alterna entre "neon comum" (flicker, listras, estouro) e Santo Neon (luz estável) |
| Cases | Cards com tilt 3D e letreiros em estilos distintos |
| Processo | 4 passos que acendem em sequência no scroll |
| Orçamento | Formulário progressivo com lógica: cada resposta "acende" o pedido, preview ao vivo do letreiro (texto + cor) e envio já formatado para o WhatsApp |

## Stack

- **HTML/CSS/JS estático** — sem build, deploy em qualquer host (a página pesa pouco e carrega rápido; página rápida barateia o custo do anúncio no Google/Meta).
- **GSAP 3.15 + ScrollTrigger** — entrada do herói, reveals, marquee, tilt (`vendor/`).
- **Three.js 0.185** — partículas com shader customizado, blending aditivo, repulsão de cursor e parallax de scroll (`vendor/`).
- **Fontes self-hosted** (`assets/fonts/`): Space Grotesk (variável) e Pacifico (letreiro).

Bibliotecas e fontes são servidas do próprio site (sem CDN de terceiros): menos
requisição externa, melhor nota de página, melhor leilão de mídia.

## Rodando localmente

Precisa de um servidor estático (os módulos ES não abrem via `file://`):

```bash
npx serve .
# ou
python3 -m http.server 8000
```

## Antes de publicar

1. Em `js/main.js`, trocar:
   - `WHATSAPP_NUMBER` — número real com DDI+DDD, só dígitos (ex.: `5511987654321`);
   - `INSTAGRAM_URL` — perfil real.
2. Substituir `assets/og.jpg` por uma foto real de produto quando a captação
   ambientizada dos cases acontecer (mesma coisa para os cards de cases —
   os letreiros CSS são placeholders até existirem fotos com qualidade).
3. Conectar o formulário à ferramenta de mensuração (GA4 / Meta Pixel) para
   os testes A/B de campos previstos no plano de mídia.

## Acessibilidade e performance

- Conteúdo 100% legível sem JavaScript (animações só aprimoram).
- `prefers-reduced-motion` desliga partículas, flicker e reveals.
- Partículas: densidade e DPR reduzidos em telas pequenas, pausa quando a aba
  fica oculta, fallback em gradiente CSS sem WebGL.
