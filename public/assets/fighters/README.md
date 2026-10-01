# Contrato de sprites dos lutadores

## Produção das animações

- Cada animação usa sua própria spritesheet e sua própria configuração. Assim,
  `idle`, `walk`, `jump`, `fall`, `block`, `hurt`, `ko`, `win`, `light`, `heavy`
  e `special` podem ser entregues independentemente e ter quantidades de frames,
  dimensões, FPS, repetição, escala e offsets visuais diferentes.
- A direção-base da arte é **olhando para a direita**. O jogo espelha a mesma
  arte para a esquerda; não devem ser produzidos arquivos separados por direção.
- Exportar em **PNG RGBA transparente**, sem fundo e sem sombra desenhada. A
  sombra é renderizada pelo jogo.
- Não usar root motion: o personagem deve permanecer preso ao mesmo anchor
  corporal em todos os frames. Movimento, salto e colisões pertencem à simulação.
- O origin padrão é `(0.5, 1)`. Manter o anchor corporal (centro dos pés) e a
  baseline consistentes entre frames e entre animações. Pequenos ajustes podem
  ser configurados com `offsetX` e `offsetY`, sem afetar a simulação.
- Usar frames uniformes dentro de cada spritesheet, organizados horizontalmente.
- Naming recomendado: `<lutador>-<animacao>-sheet.png`, por exemplo
  `el-dictador-walk-sheet.png`.
- `256x256` é o padrão inicial de produção, não uma limitação: animações futuras
  podem usar outras dimensões quando necessário, declaradas na configuração.

As animações são opcionais. O fallback visual segue esta ordem: animação do
estado atual, `idle` animado, imagem estática de idle e desenho vetorial. Esse
fallback nunca muda o estado funcional do lutador.

## Primeiro asset planejado

`public/assets/fighters/el-dictador-idle-sheet.png` será produzido posteriormente
com o seguinte contrato (o arquivo não faz parte desta mudança):

- 6 frames de `256x256`;
- disposição horizontal, total de `1536x256`;
- 8 fps em loop;
- fundo transparente;
- personagem olhando para a direita.

Quando o arquivo estiver disponível, a configuração de `dictador` deverá receber
uma entrada `animations.idle` com `asset`, `frameWidth: 256`, `frameHeight: 256`,
`frameCount: 6`, `frameRate: 8` e `repeat: -1`.
