import { useState, useRef } from "react";
import { 
  FileText, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ShieldAlert, 
  BookOpen, 
  HelpCircle, 
  Layers, 
  Activity, 
  ChevronRight, 
  FileCheck,
  RefreshCw,
  Info
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from "recharts";
import ReactMarkdown from "react-markdown";
import { mockAnalysisData, AnalysisResponse, FinancialYear } from "./mockData";

export default function App() {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para carregar os dados de demonstração (Demo)
  const handleLoadDemo = () => {
    setError(null);
    setLoading(true);
    // Simula uma pequena latência de carregamento para efeito visual elegante
    setTimeout(() => {
      setData(mockAnalysisData);
      if (mockAnalysisData.anos.length > 0) {
        // Seleciona o ano mais recente por padrão
        const sortedAnos = [...mockAnalysisData.anos].sort((a, b) => Number(b.ano) - Number(a.ano));
        setSelectedYear(sortedAnos[0].ano);
      }
      setLoading(false);
    }, 800);
  };

  // Processamento do arquivo enviado pelo usuário (PDF ou Excel)
  const processFile = async (file: File) => {
    const nameLower = file.name.toLowerCase();
    const isPDF = file.type === "application/pdf" || nameLower.endsWith(".pdf");
    const isExcel = nameLower.endsWith(".xls") || nameLower.endsWith(".xlsx") || 
                    file.type === "application/vnd.ms-excel" || 
                    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!isPDF && !isExcel) {
      setError("Por favor, selecione apenas arquivos em formato PDF (.pdf) ou Planilhas Excel (.xls, .xlsx).");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        try {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pdfBase64: base64String,
              fileName: file.name
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || "Erro ao processar as demonstrações contábeis.");
          }

          setData(result);
          if (result.anos && result.anos.length > 0) {
            const sortedAnos = [...result.anos].sort((a, b) => Number(b.ano) - Number(a.ano));
            setSelectedYear(sortedAnos[0].ano);
          }
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Falha na comunicação com o servidor de inteligência artificial.");
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Erro ao ler o arquivo físico. Tente novamente.");
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao preparar o arquivo para análise.");
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setData(null);
    setError(null);
    setSelectedYear("");
  };

  // Cálculo de Indicadores Contábeis em tempo real para o ano selecionado
  const getActiveYearData = (): FinancialYear | null => {
    if (!data || !data.anos) return null;
    return data.anos.find(y => y.ano === selectedYear) || data.anos[0];
  };

  const activeData = getActiveYearData();

  // Fórmulas de cálculo seguras
  const calculateLiquidezCorrente = (y: FinancialYear) => {
    if (!y.passivoCirculante || y.passivoCirculante === 0) return 0;
    return y.ativoCirculante / y.passivoCirculante;
  };

  const calculateMargemLiquida = (y: FinancialYear) => {
    if (!y.receitaLiquida || y.receitaLiquida === 0) return 0;
    return (y.lucroLiquido / y.receitaLiquida) * 100;
  };

  const calculateEndividamento = (y: FinancialYear) => {
    if (!y.ativoTotal || y.ativoTotal === 0) return 0;
    // Passivo Exigível Total = Passivo Circulante + Passivo Não Circulante (se disponível, senão Passivo Total - PL)
    const passivoExigivel = (y.passivoCirculante || 0) + (y.passivoNaoCirculante || 0);
    const exigivelReal = passivoExigivel > 0 ? passivoExigivel : (y.passivoTotal - y.patrimonioLiquido);
    return (exigivelReal / y.ativoTotal) * 100;
  };

  const calculateROE = (y: FinancialYear) => {
    if (!y.patrimonioLiquido || y.patrimonioLiquido === 0) return 0;
    return (y.lucroLiquido / y.patrimonioLiquido) * 100;
  };

  // Formatação Monetária Inteligente
  const formatValue = (val: number | null | undefined, moeda: string) => {
    if (val === null || val === undefined) return "N/D";
    const absolute = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    
    // Simplificar exibição
    return `${sign}${moeda.split(" ")[0]} ${absolute.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // Preparação de Dados para Gráficos
  const getChartPerformanceData = () => {
    if (!data || !data.anos) return [];
    // Ordenar cronologicamente para os gráficos ficarem coerentes da esquerda para a direita
    return [...data.anos].sort((a, b) => Number(a.ano) - Number(b.ano)).map(y => ({
      name: y.ano,
      "Receita Líquida": y.receitaLiquida,
      "Custos": Math.abs(y.custos),
      "Lucro Líquido": y.lucroLiquido,
      "Margem Líquida (%)": parseFloat(calculateMargemLiquida(y).toFixed(2)),
    }));
  };

  const getChartStructureData = () => {
    if (!activeData) return [];
    return [
      {
        name: "Ativos",
        "Circulante (Curto Prazo)": activeData.ativoCirculante,
        "Não Circulante (Longo Prazo)": activeData.ativoNaoCirculante || (activeData.ativoTotal - activeData.ativoCirculante),
      },
      {
        name: "Passivos & PL",
        "Circulante (Obrigações)": activeData.passivoCirculante,
        "Não Circulante (Longo Prazo)": activeData.passivoNaoCirculante || 0,
        "Patrimônio Líquido (Capital Próprio)": activeData.patrimonioLiquido,
      }
    ];
  };

  const getChartCashFlowData = () => {
    if (!data || !data.anos) return [];
    return [...data.anos].sort((a, b) => Number(a.ano) - Number(b.ano)).map(y => ({
      name: y.ano,
      "Operacional (FCO)": y.fco || 0,
      "Investimento (FCI)": y.fci || 0,
      "Financiamento (FCF)": y.fcf || 0,
    }));
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900" id="app_root">
      
      {/* Top Header Barra Fina */}
      <div className="bg-slate-900 text-slate-300 py-2.5 px-4 text-xs font-mono flex flex-wrap justify-between items-center border-b border-slate-800" id="top_info_bar">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SISTEMA DE AUDITORIA CONTÁBIL INTELIGENTE v1.2</span>
        </div>
        <div className="flex items-center gap-4">
          <span>AMB: AI STUDIO PREVIEW</span>
          <span className="text-slate-400">|</span>
          <span>LIMITE DE GRATUIDADE: 15 RPM / 1M TPM</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main_layout_container">
        
        {/* Header de Prestígio */}
        <header className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4" id="app_header">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm tracking-wider uppercase mb-1">
              <Activity className="w-4 h-4" />
              <span>Diagnóstico Avançado de Demonstrações</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight" id="app_title">
              Analista Contábil Inteligente
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Faça o upload do conjunto de demonstrações contábeis (Balanço, DRE, DFC, DMPL e Notas) em PDF ou Planilha Excel (.xls, .xlsx) para gerar automaticamente um relatório de indicadores, gráficos comparativos e diagnóstico executivo direcionado a gestores.
            </p>
          </div>
          
          <div className="flex gap-2.5">
            {data && (
              <button 
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 bg-white hover:bg-slate-50 rounded-md transition text-xs font-medium cursor-pointer"
                id="btn_reset_analysis"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Analisar Outro Arquivo
              </button>
            )}
            <button
              onClick={handleLoadDemo}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50 rounded-md transition text-xs font-medium cursor-pointer"
              id="btn_load_demo"
            >
              <FileCheck className="w-4 h-4" />
              Carregar Empresa Exemplo
            </button>
          </div>
        </header>

        {/* Guia de Limites de Gratuidade */}
        <div className="mb-8 bg-amber-50/70 border border-amber-200/80 rounded-lg p-4" id="quota_guideline_panel">
          <div className="flex gap-3">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded">
              <Info className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900 font-sans">
                Atenção aos limites de uso gratuito da API do Google AI Studio (Gemini 3.5 Flash)
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Nossa ferramenta está programada para analisar PDFs ou Planilhas Excel e estruturar os dados. No entanto, por utilizarmos o modelo <strong>Gemini 3.5 Flash</strong> na sua faixa gratuita, há limites de taxa de <strong>15 chamadas por minuto (RPM)</strong>.
              </p>
              <ul className="list-disc pl-5 text-xs text-amber-800 mt-1.5 space-y-1">
                <li>Evite enviar múltiplos arquivos em sequência rápida. Aguarde cerca de 1 minuto entre as análises.</li>
                <li>Se houver erro de "Too Many Requests" (429), apenas aguarde 60 segundos para reiniciar as requisições.</li>
                <li>Os valores extraídos respeitam a moeda contábil apresentada originalmente no arquivo.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Estado: Sem Dados - Painel de Upload de Arquivo */}
        {!data && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="empty_state_grid">
            
            {/* Caixa de Upload */}
            <div className="lg:col-span-8">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragOver 
                    ? "border-emerald-500 bg-emerald-50/50" 
                    : "border-slate-300 hover:border-slate-400 bg-white"
                }`}
                id="drag_drop_zone"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf,.xls,.xlsx" 
                  className="hidden" 
                />
                
                <div className="w-16 h-16 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                  <Upload className="w-8 h-8" />
                </div>
                
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  Arraste e solte o arquivo PDF ou Planilha Excel aqui
                </h3>
                <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                  Ou se preferir, clique em qualquer área deste campo para navegar pelos arquivos do seu computador.
                </p>
                
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Suporta arquivos PDF (.pdf) ou Planilhas Excel (.xls, .xlsx)</span>
                </div>
              </div>
            </div>

            {/* Explicação Teórica de Auxílio ao Profissional Contábil */}
            <div className="lg:col-span-4 flex flex-col justify-between">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  Como Funciona a Análise?
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">Leitura Inteligente</h4>
                      <p className="text-xs text-slate-500 mt-0.5">O Gemini lê e extrai os blocos de tabelas contidos no arquivo (PDF ou Excel), superando variações de layout de diferentes softwares contábeis.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">Cálculo de Indicadores</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Nossa aplicação pega as contas primárias estruturadas e calcula matematicamente as relações de liquidez, margens e rentabilidade de forma padronizada.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">Formulação do Parecer</h4>
                      <p className="text-xs text-slate-500 mt-0.5">A inteligência atua como um controller sênior redigindo um diagnóstico interpretativo, com sugestões de melhorias de gestão e alertas de riscos.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-5">
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    * Nota de Privacidade: Os dados contábeis são enviados de forma segura para processamento temporário pela API do Google AI Studio e não são retidos ou compartilhados.
                  </p>
                </div>
              </div>

              {/* Dica Rápida */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 mt-4">
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                  💡 <strong>Sem arquivo em mãos agora?</strong> Clique no botão <strong>"Carregar Empresa Exemplo"</strong> no canto superior direito para ver um relatório contábil interativo e completo imediatamente!
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Estado: Carregando / Processando */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm" id="loading_state">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
            </div>
            
            <h3 className="text-lg font-serif font-semibold text-slate-900 mb-2">
              Auditando e Extraindo Informações...
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
              O Gemini está realizando a leitura profunda do arquivo contábil carregado. Esta operação localiza e padroniza as contas do Balanço Patrimonial e da DRE para gerar o diagnóstico e os indicadores automaticamente.
            </p>
            <div className="inline-block px-3 py-1 bg-slate-50 text-slate-500 text-xs font-mono rounded">
              Pode levar de 15 a 45 segundos dependendo do tamanho do arquivo
            </div>
          </div>
        )}

        {/* Estado: Erro de Processamento */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-5 mb-8" id="error_state_panel">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-rose-900">Falha ao Analisar Demonstrações</h3>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">{error}</p>
                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-medium rounded transition cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                  <button 
                    onClick={handleLoadDemo}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium rounded transition cursor-pointer"
                  >
                    Usar Dados Exemplo para Testar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado: Dados Carregados - Exibição do Dashboard */}
        {data && !loading && activeData && (
          <div className="space-y-8 animate-fade-in" id="dashboard_view">
            
            {/* Cartão de Identificação da Empresa Analisada */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="company_profile_card">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block mb-1">Empresa sob Auditoria</span>
                <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="text-emerald-700 w-5.5 h-5.5" />
                  {data.empresa || "Nome da Empresa Não Identificado"}
                </h2>
                <div className="flex flex-wrap gap-2.5 mt-2 text-xs text-slate-500">
                  <span>Moeda de Apresentação: <strong>{data.moeda || "R$"}</strong></span>
                  <span>•</span>
                  <span>Exercícios Identificados: <strong>{data.anos.map(y => y.ano).join(", ")}</strong></span>
                </div>
              </div>

              {/* Seletor de Ano Ativo para Indicadores Estáticos */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200 rounded-lg">
                <span className="text-xs font-medium text-slate-500 pl-1">Exibindo dados de:</span>
                <div className="flex gap-1">
                  {data.anos.map(y => (
                    <button
                      key={y.ano}
                      onClick={() => setSelectedYear(y.ano)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                        selectedYear === y.ano 
                          ? "bg-slate-950 text-white shadow-sm" 
                          : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {y.ano}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grade de Principais Indicadores Financeiros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="indicators_grid">
              
              {/* Liquidez Corrente */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between" id="card_liquidez">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Liquidez Corrente</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      calculateLiquidezCorrente(activeData) >= 1.5 
                        ? "bg-emerald-50 text-emerald-800" 
                        : calculateLiquidezCorrente(activeData) >= 1.0 
                          ? "bg-amber-50 text-amber-800" 
                          : "bg-rose-50 text-rose-800"
                    }`}>
                      {calculateLiquidezCorrente(activeData) >= 1.5 
                        ? "Excelente" 
                        : calculateLiquidezCorrente(activeData) >= 1.0 
                          ? "Aceitável" 
                          : "Crítico"
                      }
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-serif font-bold text-slate-900">
                      {calculateLiquidezCorrente(activeData).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400">fator</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Capacidade de pagar dívidas de curto prazo. Valores maiores que 1,0 indicam folga.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>Ativo Circ. / Passivo Circ.</span>
                  <span className="text-slate-600">
                    {formatValue(activeData.ativoCirculante, data.moeda)} / {formatValue(activeData.passivoCirculante, data.moeda)}
                  </span>
                </div>
              </div>

              {/* Margem Líquida */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between" id="card_margem_liquida">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Margem Líquida</span>
                    <Percent className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-serif font-bold text-slate-900">
                      {calculateMargemLiquida(activeData).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Conversão de receita bruta em lucro líquido. Mede a rentabilidade e eficiência das vendas.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>Lucro Líq. / Rec. Líq.</span>
                  <span className="text-slate-600">
                    {formatValue(activeData.lucroLiquido, data.moeda)} / {formatValue(activeData.receitaLiquida, data.moeda)}
                  </span>
                </div>
              </div>

              {/* Grau de Endividamento */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between" id="card_endividamento">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grau de Endividamento</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      calculateEndividamento(activeData) <= 60 
                        ? "bg-emerald-50 text-emerald-800" 
                        : calculateEndividamento(activeData) <= 80 
                          ? "bg-amber-50 text-amber-800" 
                          : "bg-rose-50 text-rose-800"
                    }`}>
                      {calculateEndividamento(activeData) <= 60 
                        ? "Saudável" 
                        : calculateEndividamento(activeData) <= 80 
                          ? "Moderado" 
                          : "Elevado"
                      }
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-serif font-bold text-slate-900">
                      {calculateEndividamento(activeData).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Participação de terceiros no financiamento do ativo total. Menor é mais seguro.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>Passivo Exigível / Ativo Total</span>
                  <span className="text-slate-600">
                    {formatValue(((activeData.passivoCirculante || 0) + (activeData.passivoNaoCirculante || 0)), data.moeda)} / {formatValue(activeData.ativoTotal, data.moeda)}
                  </span>
                </div>
              </div>

              {/* ROE */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between" id="card_roe">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ROE (Retorno s/ PL)</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-serif font-bold text-slate-900">
                      {calculateROE(activeData).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Retorno financeiro gerado em relação ao capital investido diretamente pelos sócios.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>Lucro Líq. / Patr. Líq.</span>
                  <span className="text-slate-600">
                    {formatValue(activeData.lucroLiquido, data.moeda)} / {formatValue(activeData.patrimonioLiquido, data.moeda)}
                  </span>
                </div>
              </div>

            </div>

            {/* Seção de Gráficos e Estrutura Financeira */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="charts_section">
              
              {/* Gráfico 1: Performance Histórica */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 font-serif tracking-tight flex items-center gap-1.5">
                    Desempenho Comercial & Lucratividade
                  </h3>
                  <p className="text-xs text-slate-500">Comparação cronológica das receitas, custos agregados e lucro líquido.</p>
                </div>
                
                <div className="h-72 w-full" id="chart_performance_container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getChartPerformanceData()}
                      margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                        labelStyle={{ fontWeight: "bold", color: "#f1f5f9", fontSize: "12px" }}
                        itemStyle={{ fontSize: "11px", color: "#94a3b8" }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="Receita Líquida" fill="#0f172a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Custos" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Lucro Líquido" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Estrutura Patrimonial de Curto e Longo Prazo */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900 font-serif tracking-tight">
                      Composição do Balanço ({selectedYear})
                    </h3>
                    <p className="text-xs text-slate-500">Distribuição estrutural de ativos e exigibilidades.</p>
                  </div>

                  <div className="h-60 w-full" id="chart_structure_container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getChartStructureData()}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                        />
                        <Legend verticalAlign="bottom" iconType="square" wrapperStyle={{ fontSize: "10px" }} />
                        <Bar dataKey="Circulante (Curto Prazo)" stackId="a" fill="#334155" />
                        <Bar dataKey="Circulante (Obrigações)" stackId="a" fill="#e2e8f0" />
                        <Bar dataKey="Não Circulante (Longo Prazo)" stackId="a" fill="#475569" />
                        <Bar dataKey="Patrimônio Líquido (Capital Próprio)" stackId="a" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 mt-4 border border-slate-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Ativo Total:</span>
                    <strong className="text-slate-900">{formatValue(activeData.ativoTotal, data.moeda)}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Patrimônio Líquido:</span>
                    <strong className="text-slate-900">{formatValue(activeData.patrimonioLiquido, data.moeda)}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Gráfico 3: Geração de Caixa (DFC) se disponível */}
            {data.anos.some(y => y.fco !== undefined) && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm" id="dfc_chart_panel">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 font-serif tracking-tight flex items-center gap-1.5">
                    Demonstração do Fluxo de Caixa (DFC)
                  </h3>
                  <p className="text-xs text-slate-500">Geração líquida de recursos segregados por atividade Operacional, de Investimento e Financiamento.</p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getChartCashFlowData()}
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="Operacional (FCO)" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Investimento (FCI)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Financiamento (FCF)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Relatório Executivo Markdown e Destaques Contábeis */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="executive_report_section">
              
              {/* Relatório Executivo Completo */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
                  <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="text-slate-700 w-5 h-5" />
                    Relatório Executivo para o Gestor
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    FORMATO PRESTÍGIO MÓDULO INTELIGENTE
                  </span>
                </div>
                
                <div className="prose prose-slate max-w-none prose-sm leading-relaxed prose-headings:font-serif prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-emerald-700 prose-strong:text-slate-900" id="markdown_report_content">
                  <ReactMarkdown>
                    {data.resumoExecutivo || "Nenhum relatório descritivo foi gerado."}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Diagnósticos Rápidos (Pontos Fortes, Atenção, Recomendações e Notas Explicativas) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Pontos Fortes */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm" id="strengths_card">
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Pontos Fortes Identificados
                  </h3>
                  <ul className="space-y-3" id="list_strengths">
                    {data.pontosFortes && data.pontosFortes.map((p, index) => (
                      <li key={index} className="text-xs text-slate-600 flex gap-2.5 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pontos de Atenção */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-pulse-subtle" id="alerts_card">
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Pontos de Atenção e Riscos
                  </h3>
                  <ul className="space-y-3" id="list_alerts">
                    {data.pontosAtencao && data.pontosAtencao.map((p, index) => (
                      <li key={index} className="text-xs text-slate-600 flex gap-2.5 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recomendações Estratégicas */}
                <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-sm" id="recommendations_card">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Diretrizes Estratégicas para a Diretoria
                  </h3>
                  <ul className="space-y-3" id="list_recommendations">
                    {data.recomendacoes && data.recomendacoes.map((p, index) => (
                      <li key={index} className="text-xs text-slate-300 flex gap-2.5 items-start">
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Notas Explicativas - Destaques */}
                {data.notasExplicativasDestaques && data.notasExplicativasDestaques.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm" id="footnotes_card">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-600" />
                      Auditoria de Notas Explicativas
                    </h3>
                    <ul className="space-y-3" id="list_footnotes">
                      {data.notasExplicativasDestaques.map((p, index) => (
                        <li key={index} className="text-xs text-slate-600 flex gap-2.5 items-start">
                          <span className="text-slate-400 font-mono text-[10px] shrink-0 mt-0.5">[{index + 1}]</span>
                          <span className="leading-relaxed">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </div>

      {/* Footer elegante e formal */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-10 text-center" id="app_footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-slate-400">
            © 2026 Analista Contábil Inteligente. Desenvolvido para auxílio a profissionais de contabilidade e controladoria.
          </p>
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
            As análises e indicadores gerados por este sistema são baseados em algoritmos generativos avançados aplicados ao documento carregado.
            Recomendamos que o responsável técnico contábil homologue formalmente os relatórios antes do envio final aos órgãos estatutários.
          </p>
        </div>
      </footer>

    </div>
  );
}
