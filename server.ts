import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import * as XLSX from "xlsx";

dotenv.config();

const app = express();
const PORT = 3000;

// Configurar limites de payload maiores para suportar arquivos PDF codificados em base64
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Variável para armazenar o cliente Gemini de forma persistente (lazy initialization)
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("A chave de API GEMINI_API_KEY não foi encontrada nas variáveis de ambiente. Por favor, configure-a no painel 'Settings > Secrets' do AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Endpoint para análise de arquivos PDF ou XLS das demonstrações contábeis
app.post("/api/analyze", async (req, res) => {
  try {
    const { pdfBase64, fileName } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({
        error: "Nenhum arquivo ou dado foi enviado.",
      });
    }

    // Remover prefixos comuns de data URI se existirem
    let base64Data = pdfBase64;
    if (pdfBase64.includes(";base64,")) {
      base64Data = pdfBase64.split(";base64,")[1];
    }

    const nameLower = fileName?.toLowerCase() || "";
    const isExcel = nameLower.endsWith(".xls") || nameLower.endsWith(".xlsx");

    const ai = getGeminiClient();

    const basePrompt = `
Você é um Analista de Controladoria e Finanças Sênior e Especialista em Contabilidade Brasileira (CPC/IFRS).
Sua tarefa é analisar as demonstrações contábeis completas de uma empresa (Balanço Patrimonial, DRE, DFC, DMPL e Notas Explicativas se presentes).

Instruções importantes para extração e pareamento dos dados:
1. Extraia com precisão os dados financeiros comparativos para os anos apresentados (normalmente os dois últimos anos, ex: 2024 e 2023). Se houver apenas um ano disponível, extraia os dados deste único ano.
2. Certifique-se de que os valores numéricos sejam convertidos corretamente de acordo com a escala do relatório (por exemplo, se estiver em milhares ou milhões, extraia o valor real ou mantenha consistência entre todas as variáveis).
3. Lucro Bruto, EBITDA, EBIT e Lucro Líquido devem refletir os dados reais da DRE. Se não encontrar o EBITDA de forma explícita, estime somando a depreciação e amortização ao EBIT (se fornecidos), caso contrário estime ou retorne nulo.
4. Identifique as contas fundamentais de Ativo Circulante, Ativo Não Circulante, Passivo Circulante, Passivo Não Circulante e Patrimônio Líquido para o cálculo preciso dos indicadores de Liquidez e Endividamento.
5. Se a Demonstração do Fluxo de Caixa (DFC) estiver disponível, extraia os fluxos Operacionais (FCO), de Investimento (FCI) e de Financiamento (FCF). Se não houver, use o valor zero (0) ou tente estimar com base nas variações de contas se apropriado.
6. Crie um resumo executivo robusto e profissional (em formato Markdown no campo 'resumoExecutivo') voltado diretamente para o gestor da empresa. O texto deve ser formal, claro, analítico e de alto nível (focado em vendas, custos, margens, geração de caixa e saúde financeira global).
7. Extraia e destaque os pontos fortes (pontosFortes), pontos de atenção ou riscos (pontosAtencao), e forneça recomendações estratégicas acionáveis (recomendacoes).
8. Destaque pontos críticos das Notas Explicativas ou detalhes adicionais relevantes que encontrar no documento (notasExplicativasDestaques) se encontrar menção a processos judiciais, contingências passivas, partes relacionadas relevantes, eventos subsequentes ou novos investimentos.

Siga estritamente o esquema JSON solicitado. Retorne apenas o JSON estruturado.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        empresa: { type: Type.STRING, description: "Nome da empresa analisada" },
        moeda: { type: Type.STRING, description: "Moeda utilizada, ex: R$, USD, etc. (seja específico: R$ Milhares, R$ Milhões, etc.)" },
        anos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ano: { type: Type.STRING, description: "Ano correspondente, ex: '2024'" },
              ativoTotal: { type: Type.NUMBER, description: "Ativo Total" },
              ativoCirculante: { type: Type.NUMBER, description: "Ativo Circulante" },
              ativoNaoCirculante: { type: Type.NUMBER, description: "Ativo Não Circulante" },
              passivoTotal: { type: Type.NUMBER, description: "Passivo Total (Soma do Passivo Circulante e Não Circulante + Patrimônio Líquido)" },
              passivoCirculante: { type: Type.NUMBER, description: "Passivo Circulante" },
              passivoNaoCirculante: { type: Type.NUMBER, description: "Passivo Não Circulante" },
              patrimonioLiquido: { type: Type.NUMBER, description: "Patrimônio Líquido" },
              receitaLiquida: { type: Type.NUMBER, description: "Receita Operacional Líquida" },
              custos: { type: Type.NUMBER, description: "Custo das Vendas / Serviços Prestados (valor negativo ou positivo correspondente ao custo)" },
              lucroBruto: { type: Type.NUMBER, description: "Lucro Bruto" },
              despesasOperacionais: { type: Type.NUMBER, description: "Despesas Operacionais totais (vendas, administrativas, gerais, etc.)" },
              ebitda: { type: Type.NUMBER, description: "EBITDA (LAJIDA) - se não houver explicitamente, estimar ou fornecer nulo" },
              ebit: { type: Type.NUMBER, description: "EBIT (Lucro Operacional)" },
              resultadoFinanceiro: { type: Type.NUMBER, description: "Resultado Financeiro Líquido" },
              lucroLiquido: { type: Type.NUMBER, description: "Lucro Líquido do Exercício" },
              fco: { type: Type.NUMBER, description: "Fluxo de Caixa das Atividades Operacionais" },
              fci: { type: Type.NUMBER, description: "Fluxo de Caixa das Atividades de Investimento" },
              fcf: { type: Type.NUMBER, description: "Fluxo de Caixa das Atividades de Financiamento" }
            },
            required: ["ano", "ativoTotal", "ativoCirculante", "passivoTotal", "passivoCirculante", "patrimonioLiquido", "receitaLiquida", "lucroLiquido"]
          }
        },
        resumoExecutivo: { type: Type.STRING, description: "Relatório executivo completo em markdown em português contendo análise minuciosa para o gestor. Divida em seções com títulos elegantes, analisando crescimento, rentabilidade, endividamento e caixa." },
        pontosFortes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Lista de 3 a 5 pontos fortes identificados nas demonstrações"
        },
        pontosAtencao: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Lista de 3 a 5 pontos de atenção ou riscos identificados"
        },
        recomendacoes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Lista de 3 a 5 recomendações financeiras acionáveis para a diretoria"
        },
        notasExplicativasDestaques: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Destaques das Notas Explicativas (contingências, provisões, partes relacionadas, etc.)"
        }
      },
      required: ["empresa", "anos", "resumoExecutivo", "pontosFortes", "pontosAtencao", "recomendacoes"]
    };

    let response;

    if (isExcel) {
      // Processar Excel no Servidor convertendo para formato de texto CSV estruturado
      const buffer = Buffer.from(base64Data, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      
      let sheetsText = "";
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
        if (csvData.trim()) {
          sheetsText += `--- ABA: ${sheetName} ---\n${csvData}\n\n`;
        }
      });

      if (!sheetsText.trim()) {
        throw new Error("A planilha carregada parece estar vazia ou não pôde ser lida pelo interpretador.");
      }

      const excelPrompt = `
Abaixo está o conteúdo extraído das abas de uma planilha contábil carregada pelo usuário (formato de texto CSV):

${sheetsText}

---

${basePrompt}
`;

      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [excelPrompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1,
        }
      });

    } else {
      // Processar PDF de forma nativa com a leitura de arquivos do Gemini
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: "application/pdf"
            }
          },
          basePrompt
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1,
        }
      });
    }

    if (!response.text) {
      throw new Error("Não foi possível obter resposta estruturada do Gemini.");
    }

    const resultData = JSON.parse(response.text.trim());
    return res.json(resultData);

  } catch (error: any) {
    console.error("Erro durante a análise do documento contábil:", error);
    
    // Tratamento de limites de requisição (Rate limits - 429) do Gemini Free Tier
    if (error.message?.includes("429") || error.status === 429) {
      return res.status(429).json({
        error: "Limite de chamadas por minuto da API gratuita excedido. Por favor, aguarde 60 segundos antes de tentar novamente para que o limite seja redefinido.",
      });
    }

    return res.status(500).json({
      error: error.message || "Erro interno ao processar e analisar as demonstrações contábeis. Verifique se o arquivo está corrompido ou tente novamente.",
    });
  }
});

// Configurar o servidor de desenvolvimento Vite ou servir os arquivos compilados de produção
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Servidor] Rodando com sucesso na porta ${PORT}`);
  });
}

startServer();
