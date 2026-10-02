# Introdução cinematográfica do 47-FIGHT

## Objetivo
Adicionar uma tela inicial independente que reproduz `/assets/videos/intro.mp4` em tela cheia e leva ao menu atual após toque ou clique.

## Implementação
- Criar um componente dedicado para a introdução, mantendo o caminho do vídeo em uma única constante.
- Reproduzir o MP4 em loop, inline, sem controles nativos e inicialmente sem som para permitir autoplay.
- Exibir “TOQUE PARA INICIAR” no celular e “CLIQUE PARA INICIAR” no computador, com pulsação discreta.
- Adicionar um controle separado “ATIVAR SOM” que libera o áudio do próprio vídeo sem abrir o menu.
- Ao iniciar, aplicar fade-out, pausar o vídeo e então revelar o menu existente sem redesenhá-lo.
- Preservar proporção com fundo preto e enquadramento central adaptado para telas móveis.
- Incluir metadados próprios da página inicial e registrar a separação estrutural da introdução.

## Validação
- Confirmar que o arquivo MP4 é servido e reproduzido no navegador.
- Testar abertura, ativação de som e navegação em tamanhos desktop e celular.
- Executar o build e verificar os registros de erros da prévia.

## Fora de escopo
Nenhuma alteração em combate, personagens, sprites, animações, física, controles, multiplayer ou HUD.
