# 47 FIGHT

DESENVOLVIMENTO DE JOGO: ARENA CLASH



Crie um jogo de luta 2D lateral chamado ARENA CLASH, com personagens originais, combate em tempo real e modos contra inteligência artificial e multiplayer online.



O projeto deve ser uma aplicação web responsiva, jogável em navegadores de computadores e celulares.



1. OBJETIVO PRINCIPAL



Desenvolver um jogo de luta funcional, e não apenas uma interface demonstrativa.



Os jogadores devem conseguir selecionar lutadores, entrar em uma arena, movimentar-se, atacar, defender, saltar, causar dano real, perder vida e vencer a partida.



Todas as ações devem estar conectadas à lógica do jogo.



2. TECNOLOGIAS



- React e TypeScript para a aplicação.

- Phaser 3 para o motor de jogo 2D, renderização, animações, controles e colisões.

- CSS moderno para menus e interface.

- Supabase para autenticação, banco de dados e recursos online, caso necessário.

- Um servidor autoritativo de partidas em tempo real para o multiplayer online.

- WebSockets ou tecnologia equivalente para comunicação de baixa latência.



Organize o código em módulos reutilizáveis. Mantenha a interface React separada da lógica do combate.



Não simule o multiplayer com dois personagens controlados no mesmo navegador. O modo online deverá conectar jogadores em aparelhos diferentes.



3. IDENTIDADE VISUAL



Crie uma identidade visual própria, com estética de jogo de luta arcade moderno.



- Nome: ARENA CLASH.

- Paleta: preto, grafite, vermelho e detalhes em azul elétrico.

- Arena 2D lateral com plataformas visuais, cenário e iluminação.

- Interface com barras de vida, energia, cronômetro e identificação dos lutadores.

- Menus com animações suaves e efeitos sonoros opcionais.

- Personagens originais, sem copiar personagens, logotipos ou recursos visuais de franquias existentes.



Use recursos gráficos provisórios claramente organizados, que possam ser substituídos posteriormente por sprites profissionais.



4. MENU PRINCIPAL



Criar uma tela inicial com:



- Logotipo ARENA CLASH.

- Botão JOGAR CONTRA IA.

- Botão MULTIPLAYER ONLINE.

- Botão SELECIONAR LUTADOR.

- Botão CONFIGURAÇÕES.

- Botão COMO JOGAR.



Cada botão deve executar sua função. Implementar navegação funcional e retorno aos menus.



5. PERSONAGENS



Criar inicialmente três lutadores originais:



1. VEX — lutador ágil, com ataques rápidos.

2. TITAN — lutador pesado, com golpes fortes e movimentação mais lenta.

3. NYRA — lutadora equilibrada, com ataques de médio alcance.



Cada personagem deverá ter atributos próprios:



- Vida máxima.

- Velocidade de movimentação.

- Velocidade de ataque.

- Dano dos golpes.

- Alcance dos ataques.

- Quantidade máxima de energia.

- Habilidade especial exclusiva.



Implementar uma tela de seleção com retratos, nomes, atributos e descrição das habilidades.



Usar valores de atributos configuráveis para facilitar o balanceamento.



6. MOVIMENTAÇÃO



O motor de jogo deve implementar:



- Movimentação horizontal para a esquerda e direita.

- Salto com gravidade.

- Detecção de chão e aterrissagem.

- Limites laterais da arena.

- Orientação automática dos lutadores para que se encarem.

- Animação de repouso, caminhada, salto, queda, ataque, defesa, dano e vitória.

- Bloqueio de comandos incompatíveis durante determinadas animações.

- Prevenção contra saltos infinitos e movimentação fora dos limites.



A movimentação deve ser processada em uma atualização de jogo consistente, independente da taxa de quadros do dispositivo.



7. SISTEMA DE COMBATE



Implementar os seguintes comandos:



- Ataque leve.

- Ataque forte.

- Defesa.

- Salto.

- Habilidade especial.

- Combinações de ataques.



Cada ataque deve possuir:



- Tempo de preparação.

- Janela ativa de acerto.

- Tempo de recuperação.

- Alcance configurável.

- Dano configurável.

- Regras de cancelamento e combinação, quando aplicáveis.



Implementar hitboxes para ataques e hurtboxes para personagens. Os golpes só devem causar dano quando as áreas de ataque e de vulnerabilidade se sobrepuserem durante a janela ativa.



Evitar que um mesmo golpe cause dano repetidamente em todos os quadros. Cada ataque deve registrar os alvos já atingidos.



A defesa deve reduzir ou bloquear o dano conforme as regras definidas. Ataques fortes podem causar maior dano e recuperação mais longa.



Implementar feedback visual para acertos, bloqueios, dano recebido e uso de poderes.



8. VIDA, ENERGIA E VITÓRIA



Cada jogador começa com 100 pontos de vida.



Criar:



- Barra de vida individual.

- Barra de energia para habilidades especiais.

- Cronômetro de 99 segundos.

- Indicador de dano recebido.

- Animação de derrota.

- Tela de vitória e derrota.

- Botão de revanche.

- Botão para retornar ao menu.



A energia pode ser acumulada ao acertar ataques ou receber golpes, conforme regras configuráveis.



A habilidade especial deve consumir energia e respeitar seu tempo de recuperação.



A partida termina quando um lutador fica sem vida ou o cronômetro chega a zero. No fim do tempo, vence quem tiver mais vida. Em caso de empate, aplicar uma regra de desempate definida pelo jogo.



Impedir ataques, alterações de vida e movimentações de combate depois que a partida terminar.



9. MODO CONTRA INTELIGÊNCIA ARTIFICIAL



Criar um adversário controlado por IA com estados como:



- Aproximar-se.

- Manter distância.

- Atacar.

- Defender.

- Saltar.

- Recuar.

- Usar habilidade especial.

- Recuperar-se após um golpe.

- Reagir à proximidade do jogador.



A IA deve considerar distância, vida, estado atual, disponibilidade de ataques e energia.



Criar três dificuldades:



- Fácil: decisões mais lentas e oportunidades frequentes.

- Normal: alternância equilibrada entre ataques e defesa.

- Difícil: melhor escolha de distância, defesa e aproveitamento de oportunidades.



A IA não deve conhecer ações futuras do jogador nem executar golpes impossíveis. Respeitar as mesmas regras de combate aplicadas ao jogador.



10. CONTROLES



No computador:



- A e D: movimentar.

- W: saltar.

- J: ataque leve.

- K: ataque forte.

- L: habilidade especial.

- S: defender.



No celular, criar botões virtuais para movimentação, salto, ataque leve, ataque forte, defesa e habilidade especial.



Permitir que vários botões sejam pressionados simultaneamente quando as regras permitirem.



Os controles devem responder sem exigir cliques repetidos desnecessários. Evitar que os comandos de jogo acionem acidentalmente botões da interface.



11. MULTIPLAYER ONLINE



Implementar um modo online com salas privadas.



Fluxo esperado:



1. O jogador abre Multiplayer Online.

2. Escolhe um lutador.

3. Cria uma sala privada.

4. O sistema gera um código de convite.

5. O segundo jogador entra com esse código.

6. Ambos confirmam que estão prontos.

7. O servidor inicia a partida.

8. Os comandos de ambos os jogadores são sincronizados.

9. O servidor valida os movimentos, os golpes, o dano, a vida e o resultado.

10. Ambos veem o mesmo resultado final.



Requisitos:



- Comunicação em tempo real.

- Indicadores de conexão e desconexão.

- Tratamento de latência.

- Validação de comandos no servidor.

- Proteção contra dano e resultados enviados diretamente pelo cliente.

- Regras para abandono e desconexão.

- Botão de revanche.

- Encerramento correto das salas.

- Impedir que terceiros entrem em salas privadas sem o código ou autorização.



Não considerar uma partida online funcional apenas porque dois clientes conseguem abrir a mesma tela. A movimentação, os ataques e os resultados precisam estar sincronizados de verdade.



Caso o servidor multiplayer ainda não esteja configurado, implementar a interface e a estrutura de integração, indicar claramente o que falta e manter o modo contra IA totalmente jogável.



12. INTERFACE DURANTE A LUTA



No topo da tela, exibir:



- Nome e retrato dos lutadores.

- Barra de vida dos dois jogadores.

- Barras de energia.

- Cronômetro central.

- Identificação do jogador e do adversário.

- Indicador de conexão no multiplayer.



Durante o combate, exibir efeitos de impacto e feedback visual legível sem esconder os lutadores.



Implementar pausa apenas no modo contra IA. No multiplayer, a pausa individual não deve congelar o adversário nem interromper unilateralmente o servidor.



13. ARQUITETURA DO CÓDIGO



Separar o projeto em módulos para:



- Interface e navegação.

- Configuração dos lutadores.

- Estado da partida.

- Movimentação e física.

- Sistema de ataques e colisões.

- Animações.

- Inteligência artificial.

- Controles de teclado e toque.

- HUD e efeitos visuais.

- Comunicação multiplayer.

- Validação e regras do servidor.



Centralizar os atributos dos personagens e os parâmetros de combate em configurações reutilizáveis.



Não duplicar a lógica de dano em vários componentes. O resultado dos ataques deve passar por uma única camada de regras de combate.



14. DESEMPENHO E RESPONSIVIDADE



O jogo deve funcionar em navegadores modernos, inclusive em celulares.



- Redimensionar a arena corretamente.

- Preservar a proporção dos elementos importantes.

- Evitar controles minúsculos em telas de toque.

- Limitar efeitos visuais desnecessários.

- Limpar eventos, conexões e recursos ao sair da partida.

- Mostrar mensagens claras quando ocorrer um erro de conexão.

- Evitar dependências desnecessárias.



15. CRITÉRIOS DE ACEITAÇÃO



Considerar a primeira versão do modo solo concluída somente quando:



1. O jogador consegue iniciar uma partida.

2. Os personagens se movimentam e saltam.

3. Os ataques acertam apenas quando há colisão válida.

4. A vida diminui corretamente.

5. A defesa funciona.

6. A habilidade especial consome energia.

7. A IA reage de acordo com a dificuldade.

8. A vitória e a derrota são detectadas.

9. A revanche inicia uma partida limpa.

10. Os controles funcionam em teclado e celular.

11. Não existem erros graves no console.

12. A partida pode ser reiniciada sem recarregar a página.



Para o multiplayer, exigir adicionalmente duas sessões independentes conectadas, comandos sincronizados, validação do servidor e resultados idênticos para os dois jogadores.



16. ORDEM DE IMPLEMENTAÇÃO



Trabalhe em etapas e preserve o código funcional a cada etapa.



FASE 1 — Criar a estrutura, os menus e a seleção de lutadores.



FASE 2 — Integrar o Phaser 3 e construir uma arena funcional com movimentação, salto e colisões.



FASE 3 — Implementar ataques, defesa, vida, energia, animações e condições de vitória.



FASE 4 — Implementar a IA com três dificuldades.



FASE 5 — Criar os controles para celular e aperfeiçoar a interface.



FASE 6 — Integrar o multiplayer online com servidor autoritativo.



FASE 7 — Testar, corrigir bugs e validar os critérios de aceitação.



Comece pela FASE 1 e avance para a FASE 2 sem parar em uma tela estática. Continue até existir um modo de combate funcional. Não substitua funcionalidades por botões sem ação ou resultados simulados.



Antes de concluir cada fase, informe o que foi implementado, quais testes foram realizados e quais dependências ou configurações ainda faltam.



Priorize uma base funcional, organizada e expansível para que novos personagens, arenas, combos e modos de jogo possam ser adicionados posteriormente.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/118b7e12-dd1a-4e2f-9110-4262b1dc01a5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
