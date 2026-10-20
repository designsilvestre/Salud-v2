# Salud Odontologia · site v2

HTML + CSS + JS puro, sem build. Abre com duplo clique ou sobe para a Vercel arrastando a pasta.
Spec: `../ESTRUTURA_NOVA_Salud_2026-10-11.md` (v2).

## Estrutura
- `index.html` · seções 00 a 11
- `css/style.css` · tokens no `:root`
- `js/main.js` · loop único de scroll (hero, assinatura, texto que preenche, navbar), quiz, modais, player
- `assets/video/hero-*.mp4` · filme do hero (corte do "salud clip" sem cenas de procedimento)
- `assets/video/depoimentos/` · depoimentos comprimidos (540x960)
- `assets/img/faces/` · rostos da assinatura (240x320)

## Editar rápido
- WhatsApp: `js/main.js`, constante `WA` e objeto `MSG`
- Rostos da assinatura: array `FACES` em `js/main.js` (N ≥ 8 sequência completa; 4 a 7 sem círculo; < 4 estático)
- Quiz: arrays `QUIZ` e `RESULT` em `js/main.js`
- Textos dos modais de tratamento: objeto `TREAT` em `js/main.js`

## Pendências antes de publicar
- `noindex` no `<head>` (remover na publicação)
- WhatsApp oficial, links de Instagram/Facebook, horário, convênios
- Prêmios com nome, entidade e ano
- TCLE / autorização de imagem de cada paciente que aparece em vídeo ou rosto
- Logo vetorial (o PNG atual foi extraído do logo.jpg)

## Avaliações do Google automáticas (api/)
O site já funciona sem isso: mostra as 8 avaliações fixas do HTML. Com a API ligada, ele passa a buscar sozinho, uma vez por dia, nome, foto, texto, nota e total.

### Fase 1 · Places API (até 5 avaliações com foto + as 8 fixas)
1. No Google Cloud (conta da clínica): criar projeto, ativar faturamento e ativar **Places API (New)**.
2. Criar uma chave de API e restringi-la ao IP do servidor e só à Places API (New).
3. Achar o Place ID da Salud: https://developers.google.com/maps/documentation/places/web-service/place-id
4. Na hospedagem (PHP): copiar `api/config.example.php` para `api/config.php` e colar a chave e o Place ID.
5. A pasta `cache/` precisa de permissão de escrita (755). O primeiro acesso cria `cache/reviews.json`.
Teste: abrir `seudominio/api/reviews.php` deve devolver um JSON com `"source":"api"`.

### Fase 2 · Business Profile API (todas as avaliações)
Precisa de acesso aprovado pelo Google na conta dona do perfil (provavelmente a Sofia).
Quando aprovado, trocar só a função `fetch_reviews()` em `api/reviews.php`. O formato de saída e o front-end continuam iguais, e as 8 fixas podem sair do HTML.

Observação: na Vercel (sem PHP) a API não roda e o site usa as fixas.
