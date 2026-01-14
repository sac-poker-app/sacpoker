import { useState, useEffect } from 'react';
import { Share2, Image as ImageIcon, Filter, Check, Copy, ExternalLink, Loader2, FileText } from 'lucide-react';
import { Tournament } from '@/shared/types';
import { useApi } from '@/react-app/hooks/useApi';

interface ShareTabProps {
  tournament: Tournament;
  onTournamentChange: (tournament: Tournament) => void;
}

export default function ShareTab({ tournament, onTournamentChange }: ShareTabProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPNG, setGeneratingPNG] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);
  const { apiCall } = useApi();
  
  const shareUrl = `${window.location.origin}/share/${tournament.id}`;
  
  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await apiCall('/api/tournaments');
      if (response.success) {
        setTournaments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };
  
  const openInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  const generatePNG = async () => {
    setGeneratingPNG(true);
    
    try {
      // Open the share page in a new window optimized for mobile
      const imgWindow = window.open(shareUrl, '_blank', 'width=1200,height=1200');
      
      if (!imgWindow) {
        alert('Por favor, permita pop-ups para gerar a imagem.');
        setGeneratingPNG(false);
        return;
      }

      // Wait for the window to load
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          try {
            if (imgWindow.document.readyState === 'complete') {
              clearInterval(checkInterval);
              setTimeout(resolve, 4000);
            }
          } catch (e) {
            // Cross-origin error, window still loading
          }
        }, 100);
        
        // Timeout after 15 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 15000);
      });

      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      // Get the document from the popup window
      const imgDocument = imgWindow.document;
      
      // Hide header/footer
      const header = imgDocument.querySelector('header');
      const footer = imgDocument.querySelector('footer');
      if (header) (header as HTMLElement).style.display = 'none';
      if (footer) (footer as HTMLElement).style.display = 'none';

      // Get main content
      const mainContent = imgDocument.querySelector('main');
      if (!mainContent) {
        imgWindow.close();
        throw new Error('Não foi possível encontrar o conteúdo da página');
      }

      // Set main content styling for mobile
      (mainContent as HTMLElement).style.margin = '0';
      (mainContent as HTMLElement).style.padding = '16px';
      (mainContent as HTMLElement).style.maxWidth = '100%';
      
      // Remove ALL overflow restrictions to ensure full content is visible
      const allElements = imgDocument.querySelectorAll('*');
      allElements.forEach((el) => {
        const element = el as HTMLElement;
        if (element.style) {
          element.style.overflow = 'visible';
          element.style.overflowX = 'visible';
          element.style.overflowY = 'visible';
          element.style.maxHeight = 'none';
        }
      });
      
      // Force all tables to display fully without scroll
      const tables = imgDocument.querySelectorAll('table');
      tables.forEach(table => {
        (table as HTMLElement).style.width = 'auto';
        (table as HTMLElement).style.minWidth = '100%';
        (table as HTMLElement).style.tableLayout = 'auto';
        const parent = table.parentElement;
        if (parent) {
          parent.style.overflow = 'visible';
          parent.style.maxHeight = 'none';
        }
      });
      
      // Wait for layout
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Force a final layout recalculation
      imgDocument.body.style.height = 'auto';
      imgDocument.documentElement.style.height = 'auto';
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get dimensions - use actual height without arbitrary limits
      const contentWidth = 1200;
      const actualHeight = Math.max(
        (mainContent as HTMLElement).scrollHeight,
        (mainContent as HTMLElement).offsetHeight,
        imgDocument.body.scrollHeight,
        imgDocument.documentElement.scrollHeight
      );
      
      console.log('PNG Height Calculation:', {
        mainScrollHeight: (mainContent as HTMLElement).scrollHeight,
        mainOffsetHeight: (mainContent as HTMLElement).offsetHeight,
        bodyScrollHeight: imgDocument.body.scrollHeight,
        documentScrollHeight: imgDocument.documentElement.scrollHeight,
        actualHeight: actualHeight
      });
      
      // Add generous padding and limit to 15000px (increased from 8000px)
      const contentHeight = Math.min(actualHeight + 500, 15000);
      
      // Calculate appropriate scale to fit within 8000px height
      const maxScale = Math.floor(8000 / contentHeight);
      const scale = Math.min(3, Math.max(1, maxScale));

      // Capture at optimized quality
      const canvas = await html2canvas(mainContent as HTMLElement, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0f',
        logging: false,
        width: contentWidth,
        height: contentHeight,
        windowWidth: contentWidth,
        windowHeight: contentHeight
      });

      // Close the popup
      imgWindow.close();

      // Convert to PNG and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_ranking_${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Error generating PNG:', error);
      alert('Erro ao gerar imagem PNG. Por favor, tente novamente.');
    } finally {
      setGeneratingPNG(false);
    }
  };

  const generatePDF = async () => {
    setGeneratingPDF(true);
    
    try {
      // Open the share page in a new window (use same approach as PNG)
      const pdfWindow = window.open(shareUrl, '_blank', 'width=1200,height=1200');
      
      if (!pdfWindow) {
        alert('Por favor, permita pop-ups para gerar o PDF.');
        setGeneratingPDF(false);
        return;
      }

      // Wait for the window to load (same as PNG)
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          try {
            if (pdfWindow.document.readyState === 'complete') {
              clearInterval(checkInterval);
              setTimeout(resolve, 4000);
            }
          } catch (e) {
            // Cross-origin error, window still loading
          }
        }, 100);
        
        // Timeout after 15 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 15000);
      });

      // Dynamically import the libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Get the document from the popup window
      const pdfDocument = pdfWindow.document;
      
      // Hide header/footer (same as PNG)
      const header = pdfDocument.querySelector('header');
      const footer = pdfDocument.querySelector('footer');
      if (header) (header as HTMLElement).style.display = 'none';
      if (footer) (footer as HTMLElement).style.display = 'none';

      // Get main content (same as PNG)
      const mainContent = pdfDocument.querySelector('main');
      if (!mainContent) {
        pdfWindow.close();
        throw new Error('Não foi possível encontrar o conteúdo da página');
      }

      // Set main content styling (same as PNG)
      (mainContent as HTMLElement).style.margin = '0';
      (mainContent as HTMLElement).style.padding = '16px';
      (mainContent as HTMLElement).style.maxWidth = '100%';
      
      // Remove ALL overflow restrictions (same as PNG)
      const allElements = pdfDocument.querySelectorAll('*');
      allElements.forEach((el) => {
        const element = el as HTMLElement;
        if (element.style) {
          element.style.overflow = 'visible';
          element.style.overflowX = 'visible';
          element.style.overflowY = 'visible';
          element.style.maxHeight = 'none';
        }
      });
      
      // Force all tables to display fully (same as PNG)
      const tables = pdfDocument.querySelectorAll('table');
      tables.forEach(table => {
        (table as HTMLElement).style.width = 'auto';
        (table as HTMLElement).style.minWidth = '100%';
        (table as HTMLElement).style.tableLayout = 'auto';
        const parent = table.parentElement;
        if (parent) {
          parent.style.overflow = 'visible';
          parent.style.maxHeight = 'none';
        }
      });
      
      // Wait for layout (same as PNG)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Force a final layout recalculation (same as PNG)
      pdfDocument.body.style.height = 'auto';
      pdfDocument.documentElement.style.height = 'auto';
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get dimensions using EXACT SAME calculation as PNG
      const contentWidth = 1200;
      const actualHeight = Math.max(
        (mainContent as HTMLElement).scrollHeight,
        (mainContent as HTMLElement).offsetHeight,
        pdfDocument.body.scrollHeight,
        pdfDocument.documentElement.scrollHeight
      );
      
      console.log('PDF Height Calculation (usando método PNG):', {
        mainScrollHeight: (mainContent as HTMLElement).scrollHeight,
        mainOffsetHeight: (mainContent as HTMLElement).offsetHeight,
        bodyScrollHeight: pdfDocument.body.scrollHeight,
        documentScrollHeight: pdfDocument.documentElement.scrollHeight,
        actualHeight: actualHeight
      });
      
      // Use same limit as PNG (15000px)
      const contentHeight = Math.min(actualHeight + 500, 15000);
      
      // Calculate scale (same as PNG)
      const maxScale = Math.floor(15000 / contentHeight);
      const scale = Math.min(3, Math.max(1, maxScale));

      // Capture using EXACT SAME parameters as PNG
      const canvas = await html2canvas(mainContent as HTMLElement, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0f',
        logging: false,
        width: contentWidth,
        height: contentHeight,
        windowWidth: contentWidth,
        windowHeight: contentHeight
      });

      // Close the popup
      pdfWindow.close();

      // Convert canvas to PDF
      const pixelsToMm = 0.264583;
      const pdfWidth = canvas.width * pixelsToMm;
      const pdfHeight = canvas.height * pixelsToMm;

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        'FAST'
      );

      // Save
      const fileName = `${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_ranking_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Por favor, tente novamente.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded-lg w-1/3 mx-auto"></div>
            <div className="h-64 bg-white/10 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-sac-gold to-sac-yellow p-4 rounded-full">
              <Share2 className="w-8 h-8 text-black" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Compartilhar Ranking
          </h2>
          <p className="text-sac-yellow">
            Otimizado para celular - Link ou imagem PNG
          </p>
        </div>

        {/* Tournament Selector */}
        {tournaments.length > 1 && (
          <div className="mb-6">
            <button
              onClick={() => setShowTournamentSelector(!showTournamentSelector)}
              className="flex items-center space-x-3 w-full md:w-auto bg-white/10 backdrop-blur-sm border border-sac-gold/30 rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-200"
            >
              <Filter className="w-5 h-5 text-sac-gold" />
              <div className="text-left flex-1">
                <div className="text-xs text-sac-yellow">Torneio Selecionado</div>
                <div className="text-sm font-medium text-white truncate">{tournament.name}</div>
              </div>
            </button>
            
            {showTournamentSelector && (
              <div className="mt-3 space-y-2">
                {tournaments.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onTournamentChange(t);
                      setShowTournamentSelector(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                      t.id === tournament.id
                        ? 'bg-sac-gold/20 border border-sac-gold/50 text-white'
                        : 'bg-white/5 border border-white/10 text-sac-green hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t.name}</div>
                        {t.year && (
                          <div className="text-xs text-sac-yellow mt-1">{t.year}</div>
                        )}
                      </div>
                      {t.id === tournament.id && (
                        <Check className="w-5 h-5 text-sac-gold" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Share Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-sac-gold/30 p-6 md:p-8">
          <div className="space-y-6">
            {/* Tournament Info */}
            <div className="bg-sac-gold/20 backdrop-blur-sm rounded-xl p-4 border border-sac-gold/40">
              <h3 className="text-lg font-semibold text-white mb-2">Torneio Selecionado</h3>
              <p className="text-sac-yellow font-medium text-xl">{tournament.name}</p>
              {tournament.description && (
                <p className="text-white/70 text-sm mt-1">{tournament.description}</p>
              )}
            </div>

            {/* Share URL Section - Priority 1 */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-sac-gold" />
                <span>Link Mobile (Prioridade Máxima)</span>
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-black/40 rounded-lg border border-sac-gold/30 p-3">
                  <code className="text-sac-yellow text-sm break-all">
                    {shareUrl}
                  </code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </button>
                  <button
                    onClick={openInNewTab}
                    className="flex items-center justify-center px-4 py-3 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-all duration-200 border border-sac-gold/30"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-white/60 text-sm mt-2">
                ✓ Otimizado para celular • ✓ Textos grandes e legíveis • ✓ Rolagem vertical
              </p>
            </div>

            {/* Generate PNG Button - Priority 2 */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-sac-gold" />
                <span>Exportar como Imagem PNG (Recomendado)</span>
              </h3>
              <button
                onClick={generatePNG}
                disabled={generatingPNG}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-sac-gold to-sac-yellow text-black font-bold rounded-xl hover:shadow-2xl hover:shadow-sac-gold/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {generatingPNG ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Gerando Imagem...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6" />
                    <span>Baixar PNG</span>
                  </>
                )}
              </button>
              <p className="text-white/60 text-sm mt-2 text-center">
                Imagem vertical longa • Perfeita para WhatsApp • Alta resolução (máx 15000px altura)
              </p>
            </div>

            {/* Generate PDF Button - Optional */}
            <div>
              <h3 className="text-white/60 font-medium mb-3 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-white/40" />
                <span>Exportar como PDF (Opcional)</span>
              </h3>
              <button
                onClick={generatePDF}
                disabled={generatingPDF}
                className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
              >
                {generatingPDF ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Gerando PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>Baixar PDF</span>
                  </>
                )}
              </button>
              <p className="text-white/40 text-xs mt-2 text-center">
                Largura: 1200px • Altura: Automática (idêntico ao PNG, máx 15000px)
              </p>
            </div>

            {/* Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">📱 Link Mobile</h4>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Visualização otimizada para celular</li>
                  <li>• Textos grandes sem zoom necessário</li>
                  <li>• Rolagem apenas vertical</li>
                  <li>• Dados sempre atualizados</li>
                </ul>
              </div>
              <div className="bg-sac-gold/20 border border-sac-gold/40 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">🖼️ Imagem PNG</h4>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Infográfico vertical completo</li>
                  <li>• Alta resolução (máx 8000px altura)</li>
                  <li>• Ideal para compartilhar</li>
                  <li>• Layout idêntico ao link</li>
                </ul>
              </div>
            </div>

            {/* Note */}
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">✨ Mobile-First</h4>
              <p className="text-white/80 text-sm">
                Este sistema foi redesenhado priorizando a experiência mobile. O link e a imagem 
                PNG são otimizados para visualização perfeita no celular, com textos grandes e 
                legíveis sem necessidade de zoom. Rolagem exclusivamente vertical.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
