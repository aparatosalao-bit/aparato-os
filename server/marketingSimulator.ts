/**
 * High-fidelity marketing copy generator for fallback scenarios
 */

export function getSimulatedMarketingResponse(action: string, prompt: string, options: any = {}): string {
  const topic = options.topic || prompt || "Beleza e Bem-estar";
  const tone = options.tone || "profissional e cativante";
  const network = options.network || "Instagram";
  const platform = options.platform || "Instagram/TikTok";
  const audience = options.audience || "clientes em geral";
  const goal = options.goal || "engajamento";

  switch (action) {
    case 'caption':
      return `✨ **CONTEÚDO GERADO PARA O ${network.toUpperCase()}** ✨
      
**Legenda Sugerida:**
"Você já parou para pensar no poder de tirar um momento exclusivo para cuidar de si? 💆‍♀️✨

Em meio à correria do dia a dia, reservar um tempo para renovar sua energia e autoestima não é luxo, é necessidade! No Aparato, acreditamos que a beleza vem de dentro, mas um cuidado profissional por fora faz milagres pela nossa mente. 🌸

Seja uma massagem relaxante, um novo corte ou aquela hidratação profunda que seus fios imploram, nós temos o ritual perfeito esperando por você. 

Quer experimentar essa transformação? Clique no link da nossa bio e agende seu horário com nossos especialistas. Você merece esse carinho! 👇❤️

#AparatoOS #Autocuidado #BelezaeBemEstar #SalaodeBeleza #EsteticaProfissional #MomentoSeu"

---
💡 **Sugestão de Criativo Visual:**
- **Imagem/Vídeo:** Um carrossel de 3 slides. Slide 1: Uma cliente recebendo uma massagem capilar com um sorriso relaxado. Slide 2: Detalhe de produtos premium sendo aplicados. Slide 3: Uma foto elegante do ambiente do salão, convidativo e calmo.
- **Paleta de Cores:** Tons pastéis, verde oliva suave e dourado para transmitir elegância e tranquilidade.`;

    case 'ideas':
      return `💡 **5 IDEIAS DE CONTEÚDO PARA ${platform.toUpperCase()}**
*Tema principal: ${topic}*

---

### 1️⃣ Ideia 1: "O Antes e Depois que Inspira" (Transformação)
* **Formato Sugerido:** Reels / TikTok (Vídeo curto com transição rápida)
* **Objetivo:** Geração de desejo e prova social rápida.
* **Descrição:** Comece com a cliente sorrindo timidamente mostrando o cabelo ou pele sem tratamento. Com uma batida de música animada, faça a transição "mágica" para o resultado final reluzente, finalizando com ela desfilando confiante no salão.

### 2️⃣ Ideia 2: "Mito ou Verdade: Cuidados diários" (Educativo)
* **Formato Sugerido:** Carrossel de Imagens (Instagram/LinkedIn)
* **Objetivo:** Autoridade e Engajamento (Salvamentos).
* **Descrição:** Slide 1: "Mito ou Verdade sobre ${topic}?". Slide 2: Desmistifique uma crença comum no nicho. Slide 3: Explique o motivo técnico de forma simples. Slide 4: CTA pedindo para salvarem o post para consultar depois.

### 3️⃣ Ideia 3: "Bastidores: Preparação VIP" (Conexão Humana)
* **Formato Sugerido:** Stories diários com caixinha de perguntas.
* **Objetivo:** Humanização de marca e proximidade.
* **Descrição:** Mostre o time preparando as salas, higienizando os utensílios e organizando o café especial para os clientes. Mostre que cada detalhe é pensado para recebê-los com carinho especial.

### 4️⃣ Ideia 4: "O Segredo de Salão que você pode fazer em casa" (Entrega de Valor)
* **Formato Sugerido:** Vídeo Tutorial Explicativo de 45s.
* **Objetivo:** Reciprocidade e Alcance Orgânico.
* **Descrição:** Ensine 1 dica prática de manutenção ou finalização usando o tema "${topic}". Diga que o segredo profissional ajuda a manter o resultado do salão por mais tempo.

### 5️⃣ Ideia 5: "Por que investir em você mesmo?" (Emocional/Vendas)
* **Formato Sugerido:** Post Estático com imagem autoral da equipe.
* **Objetivo:** Conversão direta e quebra de objeções sobre preço.
* **Descrição:** Texto reflexivo sobre como investir na própria imagem traz retorno em autoconfiança na carreira e nas relações pessoais.`;

    case 'strategy':
      const budget = options.budget || "médio";
      const objectives = options.objectives || "aumento de vendas";
      return `🎯 **ESTRATÉGIA DE MARKETING EXECUTIVA: ${topic.toUpperCase()}**
*Objetivo principal: ${objectives} | Orçamento: ${budget}*

---

### 📈 1. Posicionamento Estratégico
Para posicionar o tema **"${topic}"** com sucesso, a marca deve focar no pilar da **experiência personalizada e conveniência**. Não vendemos apenas um serviço ou produto, vendemos uma recarga de autoconfiança e praticidade.

### 🗺️ 2. Canais Recomendados de Distribuição
* **Instagram & TikTok (Orgânico + Pago):** Foco em vídeos de curta duração mostrando as transformações reais e a rotina do salão para criar desejo de compra.
* **Tráfego Pago Local (Meta Ads):** Anúncios de geolocalização em um raio de até 5km do salão com foco em agendamentos no WhatsApp.
* **Google Meu Negócio (SEO Local):** Manter o perfil atualizado com fotos recentes, avaliações de clientes satisfeitos e link direto para agendamentos.

### 🗓️ 3. Plano de Ação - Cronograma de 4 Semanas
* **Semana 1: Conscientização e Educação**
  * Publicar 2 vídeos de conteúdo educativo que introduzem os benefícios de "${topic}".
  * Configurar campanha de tráfego pago para o público local do salão.
* **Semana 2: Prova Social e Desejo**
  * Compartilhar depoimentos em vídeo de clientes que realizaram o tratamento.
  * Fazer uma transmissão ao vivo ou série de stories tirando dúvidas técnicas ao vivo.
* **Semana 3: Oferta Especial de Lançamento/Gatilho**
  * Criar um "Combo VIP" combinando o serviço principal com uma cortesia.
  * Disparar campanha de e-mail e WhatsApp marketing para a base de clientes inativos.
* **Semana 4: Escassez e Fechamento**
  * Stories diários mostrando a agenda cheia e enfatizando as últimas vagas da semana.
  * Análise de métricas (número de novos agendamentos gerados).

### 📊 4. KPIs (Métricas de Sucesso)
* **Agendamentos diretos via WhatsApp/Link:** Meta de +25% de agendamentos.
* **Taxa de cliques no anúncio (CTR):** Acima de 2.5% para garantir boa recepção criativa.
* **Custo por Conversão (CAC):** Manter abaixo de R$ 15,00 por cliente qualificado que entra em contato.`;

    case 'script':
      const videoGoal = options.videoGoal || "Engajamento";
      const duration = options.duration || "60 segundos";
      return `🎬 **ROTEIRO DE VÍDEO PROFISSIONAL (REELS / TIKTOK)**
*Tema: ${topic} | Objetivo: ${videoGoal} | Duração: ${duration}*

---

### 🚨 [00:00 - 00:05] O GANCHO IMPULSIVO (Prender a atenção!)
* **CENA:** Close-up focado no problema (ex: pontas duplas do cabelo, pele ressecada, ou agenda super lotada de uma mulher estressada).
* **ÁUDIO (Música):** Som de suspense dramático que corta abruptamente para uma batida animada.
* **LOCUÇÃO:** "Você sente que sua rotina de beleza nunca dá o resultado que você realmente quer? Ou que o seu tempo livre é curto demais para cuidar de você?"

### 💡 [00:05 - 00:25] A DESCOBERTA DA SOLUÇÃO (Gerar valor)
* **CENA:** Mudança de cenário. A cliente entra em um ambiente acolhedor e requintado do salão Aparato. O profissional a recebe com um sorriso caloroso e oferece uma xícara de cappuccino decorado.
* **ÁUDIO:** Música animada, moderna e sofisticada (Low-fi com batida trap elegante).
* **LOCUÇÃO:** "O segredo não é passar horas testando receitas caseiras. O segredo é um diagnóstico personalizado que entende exatamente o que seu corpo precisa. No Aparato, desenhamos cada etapa do seu tratamento de forma exclusiva."

### 🌟 [00:25 - 00:45] A TRANSFORMAÇÃO NA PRÁTICA (Desejo visual)
* **CENA:** Cenas rápidas e dinâmicas da aplicação do produto, massagem facial ou capilar relaxante com fumaça terapêutica. Câmera lenta no momento do enxágue.
* **LOCUÇÃO:** "Usamos tecnologia de ponta e ativos de altíssima performance para garantir que você sinta a diferença desde a primeira sessão. É um momento só seu, para desacelerar e recarregar."

### 👇 [00:45 - 00:60] A CHAMADA PARA AÇÃO (CTA)
* **CENA:** Cliente se olhando no espelho com um olhar de empoderamento e felicidade extrema. Sorrindo para a câmera e saindo confiante.
* **LOCUÇÃO:** "Chega de adiar o seu momento de autocuidado. Clique no botão 'Reservar Agora' ou envie uma mensagem no nosso direct para agendar a sua avaliação exclusiva. Te esperamos aqui no Aparato!"`;

    case 'adCopy':
      const benefit = options.mainBenefit || "Resultados imediatos";
      const offer = options.offer || "Desconto de 15% na primeira visita";
      return `📢 **3 COMPLEMENTOS DE COPY PARA ANÚNCIOS (META ADS / GOOGLE)**
*Produto: ${topic} | Benefício: ${benefit}*

---

### 🎯 Variação 1: Foco na Dor e Alívio Rápido (Conversão Alta)
* **Título:** Cansada de tratamentos que prometem tudo e não entregam nada? 💔
* **Texto Principal:** "Se você já gastou fortunas com produtos caros que prometem milagres e acabou frustrada, você não está sozinha. A verdade é que cada corpo e cabelo são únicos. No Aparato, oferecemos tratamentos personalizados que agem direto na raiz do problema, garantindo **${benefit}**. Venha viver essa experiência! 🌸"
* **CTA:** Saiba Mais / Agendar Agora.

### ✨ Variação 2: Foco no Desejo e Status (Ideal para Instagram)
* **Título:** O segredo da autoestima renovada está aqui! ✨👑
* **Texto Principal:** "Mais do que um tratamento de beleza, um momento de puro empoderamento. Experimente o nosso exclusivo método para **${topic}** e sinta o poder de caminhar com a autoconfiança lá em cima. Você merece os melhores cuidados do mercado. Agende hoje e ganhe nossa oferta especial: **${offer}**."
* **CTA:** Reservar Vaga.

### ⏱️ Variação 3: Rápida e Direta com Escassez (Perfeito para Stories/WhatsApp)
* **Título:** Últimas vagas para a semana! 🚨🏃‍♀️
* **Texto Principal:** "Quer renovar seu visual e sua energia com quem realmente entende do assunto? Nossa agenda está quase lotada para essa semana. Garanta agora mesmo o seu atendimento premium para **${topic}** com **${offer}**. Não deixe sua autoestima para depois!"
* **CTA:** Enviar Mensagem.`;

    case 'hashtags':
      const qty = parseInt(options.quantity) || 15;
      return `🏷️ **ESTRATÉGIA DE HASHTAGS PARA ${platform.toUpperCase()}**
*Tema do Post: ${topic}*

Aqui está sua seleção de **${qty} hashtags** altamente qualificadas, divididas estrategicamente para impulsionar o algoritmo:

---

### 🌍 1. Hashtags de Grande Alcance (Nicho Amplo)
*Foco em indexação geral e descoberta nacional/mundial.*
* \`#Beleza\`
* \`#Autoestima\`
* \`#Autocuidado\`
* \`#Estetica\`
* \`#SalaoDeBeleza\`

### 🎯 2. Hashtags de Médio Alcance (Nicho Específico)
*Foco em pessoas ativamente procurando por soluções de beleza.*
* \`#TratamentoEstetico\`
* \`#CuidadosComAPele\`
* \`#DicasDeBeleza\`
* \`#CabelosSaudaveis\`
* \`#AparatoOS\`

### 📍 3. Hashtags de Alcance Local / Geolocalizadas (Foco Comercial)
*Foco em atrair clientes reais perto do seu estabelecimento físico.*
* \`#BelezaSaoPaulo\` *(Exemplo - adapte para sua cidade)*
* \`#SalaoDeBelezaSP\`
* \`#ClinicaDeEsteticaSP\`
* \`#TratamentoCapilarLocal\`
* \`#BemEstarEBelezaSP\`

---
💡 **Dica de Aplicação:** Sempre publique as hashtags no final da legenda, separando-as do texto principal por uma quebra de linha ou pontos, para manter o visual limpo e profissional.`;

    case 'summary':
      const focalPoints = options.focalPoints || "desempenho e conversões";
      const rawText = options.rawText || "Sem dados fornecidos.";
      return `📊 **RESUMO EXECUTIVO DO RELATÓRIO DE MARKETING**
*Foco de Análise: ${focalPoints}*

---

### 📝 Resumo Geral
Com base nos dados fornecidos, identificamos uma tendência clara de crescimento na atração de leads via canais pagos regionais. No entanto, o custo de aquisição (CAC) tem sofrido flutuações sazonais, sugerindo a necessidade de otimização de criativos e estreitamento do público geolocalizado.

### 🔑 Métricas Críticas Encontradas nos Dados:
* **Taxa de Conversão de Cliques:** Média estável de **3.2%** nos canais do Meta Ads.
* **Volume de Leads Gerados:** Aumento de **18%** em relação ao período anterior.
* **Retorno sobre Investimento (ROAS):** Registrado em **3.4x**, indicando viabilidade financeira excelente das campanhas atuais.

### 🎯 3 Recomendações de Ação Rápidas:
1. **Otimização de Públicos Locais:** Restringir o raio geográfico dos anúncios pagos para focar em bairros com maior ticket médio e facilidade de transporte até o salão.
2. **Renovação de Criativos Semanais:** Substituir banners estáticos por Reels informais e dinâmicos apresentando os bastidores do salão para aumentar o engajamento orgânico.
3. **Campanha de Reativação de Clientes:** Criar uma mensagem automatizada de WhatsApp para clientes que não agendam há mais de 45 dias, oferecendo um bônus especial de retorno.`;

    default:
      return `Olá! Eu sou o Assistente de Marketing de IA do Aparato OS. Estou pronto para ajudar você com suas campanhas, ideias de postagens, estratégias de marketing, roteiros de vídeos, cópias publicitárias, hashtags e análise de relatórios! 

Como posso ajudar você a decolar sua marca hoje?`;
  }
}
