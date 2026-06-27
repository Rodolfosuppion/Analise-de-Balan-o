export interface FinancialYear {
  ano: string;
  ativoTotal: number;
  ativoCirculante: number;
  ativoNaoCirculante: number;
  passivoTotal: number;
  passivoCirculante: number;
  passivoNaoCirculante: number;
  patrimonioLiquido: number;
  receitaLiquida: number;
  custos: number;
  lucroBruto: number;
  despesasOperacionais: number;
  ebitda: number | null;
  ebit: number;
  resultadoFinanceiro: number;
  lucroLiquido: number;
  fco: number;
  fci: number;
  fcf: number;
}

export interface AnalysisResponse {
  empresa: string;
  moeda: string;
  anos: FinancialYear[];
  resumoExecutivo: string;
  pontosFortes: string[];
  pontosAtencao: string[];
  recomendacoes: string[];
  notasExplicativasDestaques: string[];
}

export const mockAnalysisData: AnalysisResponse = {
  empresa: "Alfa Indústria e Comércio de Alimentos S.A.",
  moeda: "R$ Milhares",
  anos: [
    {
      ano: "2023",
      ativoTotal: 10800,
      ativoCirculante: 5100,
      ativoNaoCirculante: 5700,
      passivoTotal: 10800,
      passivoCirculante: 3600,
      passivoNaoCirculante: 3000,
      patrimonioLiquido: 4200,
      receitaLiquida: 15400,
      custos: -9550,
      lucroBruto: 5850,
      despesasOperacionais: -4100,
      ebitda: 2350,
      ebit: 1750,
      resultadoFinanceiro: -450,
      lucroLiquido: 910,
      fco: 1600,
      fci: -1500,
      fcf: -200
    },
    {
      ano: "2024",
      ativoTotal: 12500,
      ativoCirculante: 6800,
      ativoNaoCirculante: 5700,
      passivoTotal: 12500,
      passivoCirculante: 4100,
      passivoNaoCirculante: 3200,
      patrimonioLiquido: 5200,
      receitaLiquida: 18500,
      custos: -11100,
      lucroBruto: 7400,
      despesasOperacionais: -4600,
      ebitda: 3400,
      ebit: 2800,
      resultadoFinanceiro: -500,
      lucroLiquido: 1518,
      fco: 2200,
      fci: -1200,
      fcf: -800
    }
  ],
  resumoExecutivo: `### Relatório de Desempenho Econômico-Financeiro (2023 - 2024)

Prezado Gestor,

Apresentamos a análise executiva detalhada baseada nas demonstrações financeiras consolidadas da **Alfa Indústria e Comércio de Alimentos S.A.**, compreendendo os exercícios encerrados em 31 de dezembro de 2023 e 31 de dezembro de 2024. 

#### 1. Desempenho Operacional e Receitas
O exercício de 2024 foi marcado por uma excelente expansão comercial. A **Receita Operacional Líquida** atingiu **R$ 18,5 milhões**, representando um **crescimento de 20,13%** em comparação com os R$ 15,4 milhões auferidos em 2023. Esse desempenho indica que a empresa capturou novas fatias de mercado e otimizou seu portfólio de produtos.
*   **Margem Bruta:** A margem bruta subiu ligeiramente de **37,99%** em 2023 para **40,00%** em 2024. O controle eficiente dos custos de produção (insumos, energia e logística) permitiu que o Lucro Bruto saltasse de R$ 5,85 milhões para R$ 7,4 milhões, absorvendo satisfatoriamente as pressões inflacionárias do período.

#### 2. Eficiência de Custos e Alavancagem Operacional
O grande destaque do período foi a **alavancagem operacional**. Enquanto a receita líquida cresceu 20,13%, as despesas administrativas, comerciais e gerais (Despesas Operacionais) cresceram apenas **12,20%** (passando de R$ 4,1 milhões para R$ 4,6 milhões).
*   **Lucro Operacional (EBIT):** Como reflexo direto dessa disciplina nos gastos, o EBIT expandiu **60,00%**, atingindo **R$ 2,8 milhões** (contra R$ 1,75 milhão em 2023). A margem operacional EBIT subiu de **11,36% para 15,14%**.
*   **Geração de Caixa Operacional (EBITDA):** O EBITDA alcançou **R$ 3,4 milhões** em 2024, fornecendo uma excelente capacidade líquida de autofinanciamento de investimentos em ativos imobilizados.

#### 3. Resultado Líquido e Rentabilidade dos Sócios
O **Lucro Líquido** do exercício de 2024 encerrou em **R$ 1,518 milhão**, um avanço de **66,81%** comparado com o resultado de R$ 910 mil obtido em 2023. Essa expansão robusta foi impulsionada pela excelência operacional, que compensou com tranquilidade o aumento de R$ 50 mil nas despesas financeiras líquidas (R$ -500 mil em 2024 vs. R$ -450 mil em 2023) geradas por empréstimos de capital de giro de curto prazo.
*   **ROE (Retorno sobre o PL):** O retorno para os acionistas atingiu **29,19%** em 2024 (comparado com 21,67% em 2023), consolidando a excelente atratividade financeira do negócio.
*   **ROA (Retorno sobre o Ativo):** O ROA elevou-se para **12,14%** (vs. 8,43% em 2023), comprovando que a eficiência na alocação dos ativos da empresa melhorou significativamente.

#### 4. Estrutura Patrimonial e Liquidez
A empresa apresenta uma estrutura patrimonial equilibrada, mas com sinais que exigem atenção contínua.
*   **Liquidez Corrente:** O índice de Liquidez Corrente situa-se em **1,66** em 2024 (R$ 6,8 milhões de ativo circulante contra R$ 4,1 milhões de passivo circulante), em comparação com **1,42** em 2023. Isso significa que para cada R$ 1,00 de dívida de curto prazo, a empresa possui R$ 1,66 de bens e direitos realizáveis no mesmo período, garantindo uma folga financeira saudável.
*   **Liquidez Geral:** O índice de Liquidez Geral é de **1,66** (não havendo ativos realizáveis a longo prazo relevantes em nossa base, o Ativo Não Circulante é composto essencialmente por Imobilizado/Intangível), o que corrobora a consistência no longo prazo.
*   **Endividamento Geral:** O endividamento geral (Passivo Exigível Total / Ativo Total) manteve-se praticamente estável, passando de **61,11%** em 2023 para **58,40%** em 2024. A empresa financia a maior parte de suas operações com capital de terceiros, mas o crescimento acelerado do Patrimônio Líquido (PL) reduziu a dependência externa.

#### 5. Análise do Fluxo de Caixa (DFC)
O fluxo de caixa operacional (FCO) registrou geração de **R$ 2,2 milhões**, confirmando que o lucro contábil é suportado por uma real entrada de recursos financeiros líquidos. 
*   Esses fundos operacionais financiaram **R$ 1,2 milhão** em investimentos de modernização industrial (FCI) e permitiram amortizar/custear **R$ 800 mil** em contratos de financiamentos e distribuição de dividendos (FCF). 
*   A variação líquida do caixa consolidado foi positiva em **R$ 200 mil**, aumentando a liquidez imediata disponível em contas bancárias.
`,
  pontosFortes: [
    "Crescimento expressivo de 20,13% na Receita Líquida, demonstrando forte tração comercial e expansão de mercado.",
    "Alavancagem operacional robusta, com expansão do Lucro Líquido em 66,81% decorrente de rigoroso controle de custos fixos.",
    "Aumento substancial no Retorno sobre o Patrimônio Líquido (ROE) de 21,67% para 29,19%, evidenciando alta eficiência gerencial de capital.",
    "Geração de Caixa Operacional (FCO) sólida de R$ 2,2 milhões, garantindo autofinanciamento total dos investimentos sem necessidade de endividamento adicional."
  ],
  pontosAtencao: [
    "Concentração significativa do Passivo no Curto Prazo (Passivo Circulante representa 56,16% do endividamento exigível total).",
    "Elevação do Custo Financeiro Líquido para R$ 500 mil decorrente de taxas de juros flutuantes e dependência de limites de cheque especial/giro bancário.",
    "Aumento nas contas de Ativo Circulante que pode sugerir crescimento do ciclo financeiro (ex: acúmulo de estoques ou prazo de recebimento estendido)."
  ],
  recomendacoes: [
    "Realizar o alongamento do perfil das dívidas de curto prazo, captando debêntures ou linhas BNDES de longo prazo para reduzir as pressões de curto prazo sobre o caixa.",
    "Otimizar a gestão do Capital de Giro por meio de um controle severo de Contas a Receber e Estoques (reduzindo os dias de faturamento médios).",
    "Adotar políticas de hedge ou renegociação de indexadores das dívidas existentes para mitigar o impacto de oscilações da taxa Selic."
  ],
  notasExplicativasDestaques: [
    "Nota 14 (Contingências): Há contingências trabalhistas e cíveis classificadas como perdas possíveis na ordem de R$ 380 mil, para as quais nenhuma provisão foi contabilizada, seguindo as diretrizes do CPC 25.",
    "Nota 18 (Garantias e Avais): Parte substancial do Imobilizado industrial está alienado fiduciariamente como garantia de empréstimos bancários de longo prazo.",
    "Nota 22 (Transações de Partes Relacionadas): Compra de matérias-primas junto a coligadas totalizou R$ 1,2 milhão, operada estritamente sob preços de mercado, não evidenciando desvio de recursos."
  ]
};
