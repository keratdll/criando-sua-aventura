# Rota Caminhão 🚛 (protótipo)

Site para celular que calcula rotas **para caminhão** (toco, truck e carreta) na Grande São Paulo e na Baixada Santista. A rota desvia de pontes e viadutos baixos, de ruas estreitas, de vias com limite de peso e dos problemas que os próprios motoristas reportam.

## O que o motorista faz

1. **Escolhe o caminhão** (aba *Caminhão*) e confere altura, largura, comprimento, peso e eixos.
2. **Define a partida**: "📍 Minha localização", CEP, endereço ou toque no mapa.
3. **Adiciona as entregas** por CEP (`11013-000` ou `11013-000, 120` com o número), por endereço ou tocando no mapa. A ordem pode ser ajustada com ↑ ↓, ou o app sugere a melhor ordem.
4. **Calcula a rota** e vê o tempo total, a hora prevista em cada entrega, rotas alternativas (quando há uma única entrega) e os avisos.
5. **Toca em ▶ Iniciar**. O app segue o GPS, mostra a próxima manobra, fala as instruções e recalcula quando o motorista sai da rota. Ao chegar, toca em **✓ Entregue** e segue para a próxima entrega.
6. **Reporta problemas** (ponte baixa, rua estreita, proibido para caminhão, limite de peso, obra, congestionamento). As próximas rotas desviam desses pontos. Uma ponte reportada com "altura livre 4,1 m" só desvia caminhões mais altos que isso.

## Ruas proibidas no mapa

Assim que o motorista escolhe o caminhão, o mapa mostra **tracejadas** as ruas onde ele não passa (aproxime o mapa até o nível de bairro):

| Linha | Significado |
|---|---|
| vermelha tracejada | proibida para este caminhão (altura, largura, comprimento, peso, peso por eixo, proibição de caminhões ou de carga perigosa) |
| laranja pontilhada | caminhão só para carga e descarga naquela rua |
| roxa tracejada | proibida em alguns horários |
| vinho tracejada | trecho reportado por um motorista (ex.: curva fechada) |

Ao trocar de caminhão, o mapa se atualiza na hora. Toque numa rua tracejada para ver o motivo, por exemplo "Altura máx. 4,3 m (seu caminhão: 4,4 m)". Os dados vêm das marcações do OpenStreetMap, consultadas pelo serviço Overpass. Curvas fechadas raramente estão cadastradas no mapa, então quando um motorista reporta "rua estreita / curva fechada", "proibido", "limite de peso" ou "obra", o app liga o alerta ao trecho da rua mais próxima e o desenha tracejado.

## Trânsito

O Google Maps e o Waze **não liberam** os dados de trânsito para outros apps sem contrato pago. A API de rotas do Google é paga, e os dados do Waze só saem por parceria. Por isso o protótipo:

- tem o botão 🚦, que abre o **Google Maps já na camada de trânsito** da região da rota, para conferir antes de sair;
- permite **marcar um congestionamento** no mapa, ou tocar em **"🚦 Trânsito à frente"** durante a viagem. O app recalcula a rota de caminhão desviando dele por 1 hora;
- se você criar uma **chave gratuita da TomTom** (developer.tomtom.com, sem cartão), mostra o trânsito ao vivo dentro do próprio mapa (aba *Ajustes*).

## Regras regionais

- **ZMRC (São Paulo)**: o app avisa quando a rota entra no centro expandido em horário de restrição (seg–sex 5h–21h, sáb 10h–14h). A área desenhada é **aproximada**. Confira sempre as regras da CET.

## Como abrir

É um site estático, sem instalação:

- **No computador**: dentro desta pasta, rode `python3 -m http.server 8000` e abra `http://localhost:8000`.
- **No celular**: publique a pasta no GitHub Pages (Settings → Pages) ou em qualquer hospedagem com HTTPS. O GPS do celular só funciona em HTTPS. No navegador, use "Adicionar à tela inicial" para abrir como um app.

## Como funciona por dentro

| Arquivo | Função |
|---|---|
| `js/config.js` | Perfis de caminhão, tipos de alerta, área da ZMRC, endereços dos serviços |
| `js/services.js` | Rotas de caminhão ([Valhalla](https://valhalla.github.io/valhalla/), servidor público do OpenStreetMap), CEP ([ViaCEP](https://viacep.com.br)) e endereços ([Nominatim](https://nominatim.org)) |
| `js/geo.js` | Cálculos geográficos (distâncias, polígonos, decodificação de rota) |
| `js/reports.js` | Regras dos alertas: quando valem, para qual caminhão e como viram áreas a evitar |
| `js/guidance.js` | Navegação: próxima manobra, distância e detecção de saída da rota |
| `js/restrictions.js` | Ruas proibidas: leitura das marcações do OSM e regra por caminhão |
| `js/app.js` | Interface, mapa (Leaflet) e fluxo do motorista |

Testes da lógica: `node --test tests/*.test.js`

## Limitações do protótipo (próximos passos)

- **Dados do mapa**: nem toda ponte no Brasil tem a altura cadastrada no OpenStreetMap. Os alertas dos motoristas cobrem isso, mas hoje ficam **só no celular de quem reportou**. O próximo passo natural é um pequeno servidor para **compartilhar os alertas entre todos os motoristas** da empresa.
- **Servidor de rotas gratuito**: o servidor público do Valhalla não tem garantia de disponibilidade e limita as áreas a evitar (cerca de 60 alertas por rota). Para uso em produção, dá para hospedar um Valhalla próprio com o mapa de SP.
- **Trânsito ao vivo** no cálculo da rota exige um serviço pago (HERE, TomTom ou Google Routes).
- Outras restrições locais (Marginais, rodízio, regras da Serra do Mar no sistema Anchieta-Imigrantes, horários municipais da Baixada) podem ser adicionadas como novos avisos.
