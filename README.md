# PTZ Controller — Stream Deck Plugin

Controle câmeras PTZ diretamente pelo Stream Deck. Suporta movimentação, zoom, presets e ajuste de velocidade para até 5 câmeras simultaneamente.

---

## Instalação

1. Baixe o arquivo `com.ft.ptzcontroller.streamDeckPlugin` na pasta `Release/`
2. Dê dois cliques no arquivo — o Stream Deck abrirá automaticamente e pedirá confirmação para instalar
3. Após a instalação, as ações do plugin estarão disponíveis na biblioteca do Stream Deck

> **Requisitos:** Stream Deck 6.0 ou superior · macOS 10.15+ ou Windows 10+

---

## Configuração inicial

Antes de usar os botões de controle, é necessário configurar as câmeras com a ação **PTZ Config**.

1. Arraste a ação **PTZ Config** para um botão do Stream Deck
2. Abra o Property Inspector (clique no botão no software do Stream Deck)
3. Selecione a câmera (`CAM 1` a `CAM 5`) e preencha:
   - **Camera IP** — endereço HTTP da câmera (ex: `http://192.168.0.123`)
   - **Movement Speed** — velocidade de movimentação (0–63)
   - **Zoom Speed** — velocidade do zoom (0–7)
   - **Auth (User)** — usuário em Base64
   - **Auth (Password)** — senha em Base64
4. Os campos salvam automaticamente ao serem alterados

Repita para cada câmera que quiser controlar.

---

## Ações disponíveis

### PTZ Config

Configura os parâmetros de conexão e velocidade de uma câmera.

| Campo | Descrição |
|---|---|
| Camera | Seleciona qual câmera está sendo configurada (CAM 1–5) |
| Camera IP | Endereço HTTP da câmera na rede |
| Movement Speed | Velocidade de pan/tilt (0–63) |
| Zoom Speed | Velocidade do zoom (0–7) |
| Auth (User) | Usuário de autenticação em Base64 |
| Auth (Password) | Senha de autenticação em Base64 |

> As configurações são globais — compartilhadas entre todos os botões que apontam para a mesma câmera.

---

### Movimentos (PTZ Movement)

Move a câmera em qualquer direção enquanto o botão está pressionado. Ao soltar, envia o comando de parada automaticamente.

| Campo | Descrição |
|---|---|
| Camera | Câmera a ser controlada |
| Movement | Direção do movimento |

**Direções disponíveis:** Up, Down, Left, Right, Right-Up, Right-Down, Left-Up, Left-Down, Stop

---

### Zoom

Controla o zoom da câmera enquanto o botão está pressionado.

| Campo | Descrição |
|---|---|
| Camera | Câmera a ser controlada |
| Zoom | `IN` (aproximar) ou `OUT` (afastar) |
| Stop Command | Comando enviado ao soltar o botão (padrão: `ZoomStop`) |

---

### Preset

Chama ou grava um preset da câmera.

| Campo | Descrição |
|---|---|
| Camera | Câmera a ser controlada |
| Preset ID | Número do preset (0–99) |

**Comportamento:**
- **Pressão curta** — chama o preset (move a câmera para a posição salva)
- **Pressão longa (2,5 s)** — grava o preset (salva a posição atual como aquele ID)

---

### PTZ Focus

Controla o foco da câmera. Suporta foco automático (disparo único) e foco manual por proximidade (enquanto pressionado).

| Campo | Descrição |
|---|---|
| Camera | Câmera a ser controlada |
| Mode | `Auto Focus`, `Focus Near` ou `Focus Far` |

**Modos:**
- **Auto Focus** — pressão única aciona o auto-foco da câmera (`FocusAuto`)
- **Focus Near** — segure para focar em objetos próximos; solta para parar (`FocusNear` / `FocusStop`)
- **Focus Far** — segure para focar em objetos distantes; solta para parar (`FocusFar` / `FocusStop`)

O botão exibe o label correspondente ao modo configurado: **AF**, **F+** ou **F−**.

---

### PTZ Speed

Ajusta a velocidade de movimentação de uma câmera em incrementos configuráveis. Útil para ter botões de `+` e `−` de velocidade no deck.

| Campo | Descrição |
|---|---|
| Camera | Câmera cujo `Movement Speed` será alterado |
| Direction | `+` (aumentar) ou `−` (diminuir) |
| Step | Valor do incremento por pressão (1–20) |

> A velocidade fica limitada entre 0 e 63. A alteração é refletida imediatamente nas próximas movimentações.

---

## Múltiplas câmeras

Cada ação de controle (Movimento, Zoom, Preset, Speed) possui um campo **Camera** que indica qual câmera ela controla. Isso permite ter botões para câmeras diferentes no mesmo perfil do Stream Deck.

---

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| Botão mostra alerta (X vermelho) | Câmera não configurada ou IP incorreto | Verifique a ação PTZ Config para aquela câmera |
| Movimento não responde | Speed com valor NaN após editar config | Salve novamente o PTZ Config da câmera |
| Preset não é chamado | Pressão muito rápida ou muito longa | Pressão curta chama; 2,5 s+ grava |
| Ação não aparece na lista | Stream Deck não estava aberto durante a instalação | Reinicie o Stream Deck |
