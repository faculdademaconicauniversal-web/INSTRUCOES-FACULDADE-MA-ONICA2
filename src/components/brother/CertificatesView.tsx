import React, { useState, useRef } from 'react';
import {
  Award,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  Lock,
  QrCode,
  ShieldCheck,
  Building,
  Calendar,
  Eye,
  FileCheck,
  Copy,
  Layers,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { Certificate, Degree } from '../../types';
import { FACULDADE_SEAL_IMG } from '../../assets/logo';

interface CertificatesViewProps {
  onNavigate: (view: string, payload?: any) => void;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({ onNavigate }) => {
  const { userProfile, isAdmin, isInstructor } = useAuth();
  if (!userProfile) return null;

  const degrees = dataStore.getDegrees();
  const certificates = dataStore.getCertificatesByUser(userProfile.id);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [certTheme, setCertTheme] = useState<'parchment' | 'dark'>('parchment');
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const certPrintRef = useRef<HTMLDivElement>(null);

  const handleIssueCertificate = (deg: Degree) => {
    const newCert = dataStore.issueCertificate({
      userId: userProfile.id,
      userName: userProfile.fullName,
      userCim: userProfile.cimNumber,
      userLodge: userProfile.lodge,
      userGrandLodge: userProfile.grandLodge || 'Grande Oriente Maçônico Universal GOMAU',
      degreeNumber: deg.degreeNumber,
      degreeName: deg.name,
      issueDate: new Date().toISOString(),
      qrCodeVerificationUrl: `https://faculdademaconica.org/verify/${userProfile.id}_deg_${deg.degreeNumber}`,
      institutionName: 'Faculdade Maçônica Universal de Estudos Tradicionais',
      grandMasterName: "S.'.G.'.M.'. DARLAN MARTINS",
      grandMasterRole: 'Soberano Grão-Mestre',
      inspectorName: 'GRANDE INSPETOR GERAL / INSTRUTOR JANDERSON CAMARGOS',
      inspectorRole: 'Grande Inspetor Geral / Instrutor Docente',
    });

    setSelectedCert(newCert);

    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#d4af37', '#f59e0b', '#dc2626', '#ffffff', '#1e3a8a'],
      });
    } catch (e) {
      // ignore
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  // High-Resolution 300 DPI Canvas Certificate Downloader
  const handleDownloadHighRes = async (cert: Certificate) => {
    setIsDownloading(true);

    try {
      const width = 2480;
      const height = 1754;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsDownloading(false);
        return;
      }

      // Load official seal image
      const sealImg = new Image();
      sealImg.crossOrigin = 'anonymous';
      sealImg.src = FACULDADE_SEAL_IMG;
      await new Promise((resolve) => {
        sealImg.onload = resolve;
        sealImg.onerror = resolve;
      });

      // Background - Royal Parchment / Noble Classic
      const isDark = certTheme === 'dark';

      if (isDark) {
        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, width);
        bgGrad.addColorStop(0, '#151b2a');
        bgGrad.addColorStop(0.6, '#0f1422');
        bgGrad.addColorStop(1, '#080b12');
        ctx.fillStyle = bgGrad;
      } else {
        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 200, width / 2, height / 2, width);
        bgGrad.addColorStop(0, '#fdfcf9');
        bgGrad.addColorStop(0.7, '#f7f2e7');
        bgGrad.addColorStop(1, '#ede3cf');
        ctx.fillStyle = bgGrad;
      }
      ctx.fillRect(0, 0, width, height);

      // Outer Decorative Frame (Gold Foil)
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#c89d30';
      ctx.strokeRect(60, 60, width - 120, height - 120);

      // Inner Fine Double Line
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#d4af37';
      ctx.strokeRect(84, 84, width - 168, height - 168);

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isDark ? 'rgba(212, 175, 55, 0.4)' : 'rgba(180, 130, 40, 0.4)';
      ctx.strokeRect(96, 96, width - 192, height - 192);

      // Ornamental Corner Crosses / Fleurons
      const drawCorner = (x: number, y: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = '#c89d30';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(25, 0);
        ctx.moveTo(0, -25);
        ctx.lineTo(0, 25);
        ctx.stroke();

        ctx.fillStyle = '#c89d30';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawCorner(96, 96);
      drawCorner(width - 96, 96);
      drawCorner(96, height - 96);
      drawCorner(width - 96, height - 96);

      // Center Watermark / Background Masonic Emblem with Official Seal
      if (sealImg.complete && sealImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = isDark ? 0.08 : 0.06;
        const wmSize = 750;
        ctx.drawImage(sealImg, width / 2 - wmSize / 2, height / 2 - wmSize / 2 - 30, wmSize, wmSize);
        ctx.restore();
      }

      // Top Sacred Invocations
      ctx.textAlign = 'center';
      ctx.fillStyle = isDark ? '#fcd34d' : '#854d0e';
      ctx.font = 'bold 28px serif';
      ctx.letterSpacing = '6px';
      ctx.fillText('A.·. G.·. D.·. G.·. A.·. D.·. U.·.', width / 2, 175);

      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = 'bold 22px serif';
      ctx.fillText('À GLÓRIA DO GRANDE ARQUITETO DO UNIVERSO', width / 2, 215);

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '18px serif';
      ctx.fillText('LIBERDADE  •  IGUALDADE  •  FRATERNIDADE', width / 2, 250);

      // Top Official Seal Medallion
      if (sealImg.complete && sealImg.naturalWidth > 0) {
        ctx.save();
        const topSealSize = 140;
        const topSealY = 270;
        ctx.beginPath();
        ctx.arc(width / 2, topSealY + topSealSize / 2, topSealSize / 2 + 4, 0, Math.PI * 2);
        ctx.fillStyle = '#c89d30';
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, topSealY + topSealSize / 2, topSealSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(sealImg, width / 2 - topSealSize / 2, topSealY, topSealSize, topSealSize);
        ctx.restore();
        ctx.restore();
      }

      // Institution & Obedience
      ctx.fillStyle = isDark ? '#f8fafc' : '#1e293b';
      ctx.font = 'bold 42px serif';
      ctx.fillText('FACULDADE MAÇÔNICA UNIVERSAL', width / 2, 455);

      ctx.fillStyle = isDark ? '#e2e8f0' : '#334155';
      ctx.font = '22px serif';
      ctx.fillText('GRANDE ORIENTE MAÇÔNICO UNIVERSAL — GOMAU', width / 2, 495);

      // Gold Divider
      const gradDiv = ctx.createLinearGradient(width / 2 - 300, 0, width / 2 + 300, 0);
      gradDiv.addColorStop(0, 'rgba(212, 175, 55, 0)');
      gradDiv.addColorStop(0.5, '#c89d30');
      gradDiv.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = gradDiv;
      ctx.fillRect(width / 2 - 300, 520, 600, 3);

      // Main Title
      ctx.fillStyle = isDark ? '#fde047' : '#92400e';
      ctx.font = 'bold 48px serif';
      ctx.fillText('CERTIFICADO DE CONCLUSÃO DE GRAU', width / 2, 590);

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'italic 26px serif';
      ctx.fillText('Certificamos com júbilo fraternal e para os devidos fins que o Ilustre Irmão', width / 2, 655);

      // Brother Name (Prominent & Elegant)
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 56px serif';
      ctx.fillText(`Ir.·. ${cert.userName}`, width / 2, 735);

      // Brother Credentials
      ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
      ctx.font = '24px serif';
      ctx.fillText(
        `Membro regular e ativo da ${cert.userLodge || 'ARLS Luz e Sabedoria nº 33'}`,
        width / 2,
        800
      );
      ctx.fillText(
        `Jurisdicionada ao ${cert.userGrandLodge || 'Grande Oriente Maçônico Universal GOMAU'} • CIM nº ${cert.userCim || '102938'}`,
        width / 2,
        840
      );

      ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
      ctx.font = 'italic 25px serif';
      ctx.fillText(
        'concluiu com êxito todas as instruções doutrinárias, avaliações litúrgicas e Pranchas de Arquitetura do:',
        width / 2,
        915
      );

      // Degree Badge in Canvas
      const degY = 975;
      const degText = `${cert.degreeName.toUpperCase()} — (GRAU 0${cert.degreeNumber})`;
      ctx.font = 'bold 38px serif';
      const textWidth = ctx.measureText(degText).width;

      ctx.fillStyle = isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.2)';
      ctx.strokeStyle = '#c89d30';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(width / 2 - textWidth / 2 - 40, degY - 45, textWidth + 80, 70, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark ? '#fef08a' : '#78350f';
      ctx.fillText(degText, width / 2, degY + 2);

      // Masonic Decree & Recognition
      ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
      ctx.font = '22px serif';
      ctx.fillText(
        'fazendo jus a todas as prerrogativas, honrarias e direitos assegurados pelas Tradições da Ordem.',
        width / 2,
        1075
      );

      // BOTTOM SECTION: SIGNATURES & OFFICIAL SEALS
      const bottomY = 1430;

      // 1. Signature Left: S.'.G.'.M.'. DARLAN MARTINS
      const sigLeftX = width * 0.25;
      ctx.save();
      // Artistic Calligraphic Signature Flourish
      ctx.strokeStyle = isDark ? '#fcd34d' : '#1e3a8a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(sigLeftX - 140, bottomY - 80);
      ctx.bezierCurveTo(sigLeftX - 70, bottomY - 140, sigLeftX - 20, bottomY - 50, sigLeftX + 30, bottomY - 100);
      ctx.bezierCurveTo(sigLeftX + 60, bottomY - 140, sigLeftX + 100, bottomY - 60, sigLeftX + 140, bottomY - 85);
      ctx.stroke();

      // Masonic 3 Dots (.·.) on signature
      ctx.fillStyle = isDark ? '#fcd34d' : '#1e3a8a';
      ctx.beginPath();
      ctx.arc(sigLeftX + 160, bottomY - 95, 3.5, 0, Math.PI * 2);
      ctx.arc(sigLeftX + 172, bottomY - 95, 3.5, 0, Math.PI * 2);
      ctx.arc(sigLeftX + 166, bottomY - 85, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Signature line
      ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sigLeftX - 220, bottomY - 30);
      ctx.lineTo(sigLeftX + 220, bottomY - 30);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 25px serif';
      ctx.fillText("S.·. G.·. M.·. DARLAN MARTINS", sigLeftX, bottomY + 10);

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 18px serif';
      ctx.fillText('Soberano Grão-Mestre Geral', sigLeftX, bottomY + 40);

      // 2. Center Solene Official Seal Image
      const sealCenterX = width / 2;
      const sealCenterY = bottomY - 20;
      const sealRadius = 100;

      ctx.save();
      // Outer Gold Shadow & Ring
      ctx.beginPath();
      ctx.arc(sealCenterX, sealCenterY, sealRadius + 8, 0, Math.PI * 2);
      ctx.fillStyle = '#b45309';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sealCenterX, sealCenterY, sealRadius + 5, 0, Math.PI * 2);
      ctx.fillStyle = '#d4af37';
      ctx.fill();

      if (sealImg.complete && sealImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sealCenterX, sealCenterY, sealRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(sealImg, sealCenterX - sealRadius, sealCenterY - sealRadius, sealRadius * 2, sealRadius * 2);
        ctx.restore();
      }

      ctx.restore();

      // 3. Signature Right: GRANDE INSPETOR GERAL / INSTRUTOR JANDERSON CAMARGOS
      const sigRightX = width * 0.75;
      ctx.save();
      ctx.strokeStyle = isDark ? '#fcd34d' : '#1e3a8a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(sigRightX - 130, bottomY - 75);
      ctx.bezierCurveTo(sigRightX - 60, bottomY - 130, sigRightX, bottomY - 45, sigRightX + 50, bottomY - 110);
      ctx.bezierCurveTo(sigRightX + 90, bottomY - 135, sigRightX + 120, bottomY - 65, sigRightX + 150, bottomY - 80);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#fcd34d' : '#1e3a8a';
      ctx.beginPath();
      ctx.arc(sigRightX + 170, bottomY - 90, 3.5, 0, Math.PI * 2);
      ctx.arc(sigRightX + 182, bottomY - 90, 3.5, 0, Math.PI * 2);
      ctx.arc(sigRightX + 176, bottomY - 80, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Signature line
      ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sigRightX - 240, bottomY - 30);
      ctx.lineTo(sigRightX + 240, bottomY - 30);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 22px serif';
      ctx.fillText('GRANDE INSPETOR GERAL / INSTRUTOR JANDERSON CAMARGOS', sigRightX, bottomY + 10);

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 18px serif';
      ctx.fillText('Grande Inspetor Geral / Instrutor Docente', sigRightX, bottomY + 40);

      // Certificate Registration & Footer Info
      ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.font = '18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Registro Digital: ${cert.certificateNumber}`, 110, height - 90);

      const dateStr = new Date(cert.issueDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      ctx.textAlign = 'right';
      ctx.fillText(`Emitido no Oriente em ${dateStr}`, width - 110, height - 90);

      // Export as PNG and trigger download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const sanitizedName = cert.userName.replace(/\s+/g, '_');
      link.download = `Certificado_Grau_0${cert.degreeNumber}_${sanitizedName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsDownloading(false);
    } catch (err) {
      console.error('Error generating high res certificate download:', err);
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121622] via-[#0e121a] to-black border border-amber-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <Award className="w-4 h-4" />
            <span>Certificação Iniciática Oficial • GOMAU</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Certificados Oficiais de Conclusão de Grau
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Diplomas e certificados emitidos no formato padrão para impressão e download em alta resolução (300 DPI A4 Paisagem), chancelados pelo Soberano Grão-Mestre e pelo Grande Inspetor Geral / Instrutor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase block">Certificados Emitidos</span>
            <span className="text-xl font-bold font-masonic text-amber-300">
              {certificates.length}
            </span>
          </div>
        </div>
      </div>

      {/* Degree Certifications Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {degrees.map((deg) => {
          const progress = dataStore.getUserProgress(userProfile.id, deg.degreeNumber);
          const existingCert = certificates.find((c) => c.degreeNumber === deg.degreeNumber);
          const isEligible = progress.isDegreeCompleted || isAdmin || isInstructor;

          return (
            <div
              key={deg.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                existingCert
                  ? 'bg-gradient-to-b from-[#181f2f] to-[#0f141f] border-amber-500/50 shadow-xl'
                  : isEligible
                  ? 'bg-[#0f131d] border-amber-500/30'
                  : 'bg-[#0a0d14]/70 border-slate-900 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-md">
                      <img
                        src={FACULDADE_SEAL_IMG}
                        alt="Selo Oficial"
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 font-masonic">
                      Grau 0{deg.degreeNumber}
                    </span>
                  </div>

                  {existingCert ? (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Emitido & Chancelado</span>
                    </span>
                  ) : isEligible ? (
                    <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1">
                      <Sparkles className="w-4 h-4" />
                      <span>Elegível para Emissão</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Em Progresso</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold font-masonic text-slate-100 mb-1">
                  Certificado de {deg.name}
                </h3>
                <p className="text-xs text-slate-400 mb-4">{deg.description}</p>

                {/* Progress Indicators */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Instruções Concluídas:</span>
                    <span className="font-bold text-slate-200">
                      {progress.completedLessons} / {progress.totalLessons}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Progresso no Grau:</span>
                    <span className="font-bold text-amber-300">{progress.progressPercent}%</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">Chancela Oficial:</span>
                    <span className="font-semibold text-slate-300">S.·.G.·.M.·. DARLAN MARTINS</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {existingCert ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCert(existingCert)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
                    >
                      <Award className="w-4 h-4" />
                      <span>Abrir Certificado para Impressão / Download</span>
                    </button>
                    <button
                      onClick={() => handleDownloadHighRes(existingCert)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Direto em Alta Resolução</span>
                    </button>
                  </div>
                ) : isEligible ? (
                  <button
                    onClick={() => handleIssueCertificate(deg)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Emitir Certificado Digital com Assinaturas</span>
                  </button>
                ) : (
                  <div className="text-center py-2.5 text-xs text-slate-500 font-medium bg-slate-900/40 rounded-xl border border-slate-800">
                    Conclua todas as instruções e pranchas do grau
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Solene Interactive Certificate Modal & Print Preview */}
      {selectedCert && (
        <div className="certificate-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="certificate-modal-content relative w-full max-w-5xl bg-[#0d1017] border-2 border-amber-500/60 rounded-3xl shadow-2xl overflow-visible my-4 p-4 sm:p-6 space-y-4">
            {/* Top Toolbar (Hidden during actual print) */}
            <div className="flex flex-wrap items-center justify-between no-print border-b border-slate-800 pb-4 gap-3">
              <div className="flex items-center space-x-2 text-amber-300 font-masonic text-sm font-bold">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Modelo Oficial de Certificação para Impressão & Download</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Zoom Scale Controls */}
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setZoomScale((prev) => Math.max(60, prev - 10))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all"
                    title="Diminuir Zoom"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono text-[11px] font-bold text-amber-300 min-w-[42px] text-center">
                    {zoomScale}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale((prev) => Math.min(130, prev + 10))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all"
                    title="Aumentar Zoom"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomScale(100)}
                    className="ml-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center space-x-1"
                    title="Redefinir Zoom para 100%"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">100%</span>
                  </button>
                </div>

                {/* Theme Switcher */}
                <div className="flex rounded-xl bg-slate-900 border border-slate-700 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setCertTheme('parchment')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      certTheme === 'parchment'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📜 Pergaminho Real (Impressão)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertTheme('dark')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      certTheme === 'dark'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🏛️ Templo Noturno
                  </button>
                </div>

                {/* Print Button */}
                <button
                  id="btn-print-certificate"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all hover:scale-105"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF (A4 Paisagem)</span>
                </button>

                {/* Download High Res Button */}
                <button
                  id="btn-download-highres"
                  disabled={isDownloading}
                  onClick={() => handleDownloadHighRes(selectedCert)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all hover:scale-105 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'Gerando...' : 'Baixar Imagem (300 DPI)'}</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  title="Fechar visualização"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Actions & Code bar (Hidden on print) */}
            <div className="no-print flex flex-wrap items-center justify-between text-xs bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl gap-2">
              <div className="flex items-center space-x-2 text-slate-300">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Registro Oficial: <strong className="font-mono text-amber-300">{selectedCert.certificateNumber}</strong>
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedCert.certificateNumber)}
                  className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copyFeedback ? '✓ Código Copiado!' : 'Copiar Código de Registro'}</span>
                </button>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">
                  Data: {new Date(selectedCert.issueDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* THE OFFICIAL MASONIC CERTIFICATE PARCHMENT (LANDSCAPE A4 LAYOUT) */}
            <div className="w-full overflow-x-auto overflow-y-visible flex justify-center py-2">
              <div
                ref={certPrintRef}
                className={`certificate-print-area relative rounded-2xl p-5 sm:p-8 md:p-10 text-center shadow-2xl transition-all w-full ${
                  certTheme === 'parchment'
                    ? 'bg-gradient-to-br from-[#fffdfa] via-[#fbf5e8] to-[#f3ebd9] text-slate-900 border-4 border-double border-[#b45309]'
                    : 'bg-gradient-to-br from-[#121622] via-[#0f121a] to-[#090b10] text-slate-100 border-4 border-double border-amber-500/70'
                }`}
                style={{
                  transform: zoomScale !== 100 ? `scale(${zoomScale / 100})` : undefined,
                  transformOrigin: 'top center',
                }}
              >
                {/* Corner Ornamental Flourishes */}
                <div className="absolute top-2.5 left-2.5 text-amber-600 opacity-60 text-base font-serif">✦</div>
                <div className="absolute top-2.5 right-2.5 text-amber-600 opacity-60 text-base font-serif">✦</div>
                <div className="absolute bottom-2.5 left-2.5 text-amber-600 opacity-60 text-base font-serif">✦</div>
                <div className="absolute bottom-2.5 right-2.5 text-amber-600 opacity-60 text-base font-serif">✦</div>

                {/* Background Watermark Emblem */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img
                    src={FACULDADE_SEAL_IMG}
                    alt="Marca d'Água Oficial"
                    className="w-[360px] h-[360px] object-contain opacity-[0.06] pointer-events-none select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Certificate Inner Content */}
                <div className="relative z-10 flex flex-col justify-between h-full space-y-3 sm:space-y-4">
                  {/* Header Invocations */}
                  <div className="space-y-0.5">
                    <div
                      className={`text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] font-masonic ${
                        certTheme === 'parchment' ? 'text-amber-800' : 'text-amber-400'
                      }`}
                    >
                      A.·. G.·. D.·. G.·. A.·. D.·. U.·.
                    </div>
                    <div
                      className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] font-masonic ${
                        certTheme === 'parchment' ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      À GLÓRIA DO GRANDE ARQUITETO DO UNIVERSO
                    </div>
                    <div
                      className={`text-[9px] sm:text-[10px] uppercase tracking-widest ${
                        certTheme === 'parchment' ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      LIBERDADE • IGUALDADE • FRATERNIDADE
                    </div>
                  </div>

                  {/* Institution Heading & Official Seal */}
                  <div className="space-y-1.5">
                    <div className="flex justify-center">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-md">
                        <img
                          src={FACULDADE_SEAL_IMG}
                          alt="Brasão Oficial Faculdade Maçônica"
                          className="w-full h-full object-cover rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    <h2
                      className={`text-lg sm:text-2xl md:text-3xl font-black font-masonic tracking-wide uppercase ${
                        certTheme === 'parchment' ? 'text-slate-900' : 'gold-gradient-text'
                      }`}
                    >
                      FACULDADE MAÇÔNICA UNIVERSAL
                    </h2>
                    <div
                      className={`text-[11px] sm:text-xs uppercase tracking-widest font-masonic font-bold ${
                        certTheme === 'parchment' ? 'text-amber-900' : 'text-slate-300'
                      }`}
                    >
                      GRANDE ORIENTE MAÇÔNICO UNIVERSAL — GOMAU
                    </div>
                    <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto my-0.5" />
                  </div>

                  {/* Title */}
                  <div>
                    <h3
                      className={`text-base sm:text-xl md:text-2xl font-bold font-masonic uppercase tracking-wider ${
                        certTheme === 'parchment' ? 'text-amber-950' : 'text-amber-300'
                      }`}
                    >
                      CERTIFICADO DE CONCLUSÃO DE GRAU
                    </h3>
                    <p
                      className={`text-[11px] sm:text-xs italic pt-0.5 ${
                        certTheme === 'parchment' ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    >
                      Certificamos com júbilo fraternal e para os devidos fins que o Ilustre e Respeitável Irmão
                    </p>
                  </div>

                  {/* Brother Name */}
                  <div className="py-0.5">
                    <div
                      className={`text-xl sm:text-3xl md:text-4xl font-bold font-masonic inline-block px-6 pb-1 border-b-2 ${
                        certTheme === 'parchment'
                          ? 'text-slate-950 border-amber-600'
                          : 'text-amber-200 border-amber-500/50'
                      }`}
                    >
                      Ir.·. {selectedCert.userName}
                    </div>
                  </div>

                  {/* Masonic Credentials */}
                  <div
                    className={`text-[11px] sm:text-xs space-y-0.5 ${
                      certTheme === 'parchment' ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      Membro regular e ativo da <strong>{selectedCert.userLodge || 'ARLS Luz e Sabedoria nº 33'}</strong>
                    </div>
                    <div>
                      Jurisdicionada ao <strong>{selectedCert.userGrandLodge || 'Grande Oriente Maçônico Universal GOMAU'}</strong> • CIM nº{' '}
                      <strong className="font-mono text-amber-700">{selectedCert.userCim || '102938'}</strong>
                    </div>
                    <div className="italic pt-0.5">
                      concluiu com êxito todas as instruções doutrinárias, questionários avaliativos e Pranchas de Arquitetura do:
                    </div>
                  </div>

                  {/* Degree Highlight Box */}
                  <div className="py-0.5">
                    <span
                      className={`px-5 py-1.5 sm:px-6 sm:py-2 rounded-xl text-sm sm:text-lg font-bold font-masonic uppercase tracking-wider inline-block border-2 ${
                        certTheme === 'parchment'
                          ? 'bg-amber-100/80 border-amber-600 text-amber-950 shadow-sm'
                          : 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md'
                      }`}
                    >
                      {selectedCert.degreeName} (Grau 0{selectedCert.degreeNumber})
                    </span>
                  </div>

                  {/* Prerogatives statement */}
                  <p
                    className={`text-[10px] sm:text-[11px] italic ${
                      certTheme === 'parchment' ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    fazendo jus a todas as prerrogativas, honrarias e direitos assegurados pelas Tradições da Ordem.
                  </p>

                  {/* SIGNATURES & OFFICIAL SEALS (EXACTLY AS REQUESTED) */}
                  <div className="pt-4 sm:pt-6 grid grid-cols-3 gap-2 sm:gap-4 items-end text-center">
                    {/* Left: S.'.G.'.M.'. DARLAN MARTINS */}
                    <div className="space-y-0.5">
                      {/* Stylized Masonic Signature Graphic */}
                      <div className="h-8 flex items-center justify-center">
                        <span className="font-serif italic text-base sm:text-lg text-blue-900 font-bold opacity-80 select-none">
                          Darlan Martins .·.
                        </span>
                      </div>
                      <div
                        className={`w-36 sm:w-48 h-0.5 mx-auto mb-1 ${
                          certTheme === 'parchment' ? 'bg-slate-700' : 'bg-slate-500'
                        }`}
                      />
                      <div
                        className={`text-[11px] sm:text-xs font-bold font-masonic leading-tight ${
                          certTheme === 'parchment' ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        S.·. G.·. M.·. DARLAN MARTINS
                      </div>
                      <div
                        className={`text-[9px] sm:text-[10px] font-semibold ${
                          certTheme === 'parchment' ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        Soberano Grão-Mestre
                      </div>
                    </div>

                    {/* Center: Solene Official Seal Image Stamp */}
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-lg flex items-center justify-center">
                        <img
                          src={FACULDADE_SEAL_IMG}
                          alt="Selo Oficial Faculdade Maçônica"
                          className="w-full h-full object-cover rounded-full border border-amber-300/40"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span
                        className={`font-mono text-[9px] mt-0.5 font-bold ${
                          certTheme === 'parchment' ? 'text-amber-900' : 'text-amber-400/90'
                        }`}
                      >
                        {selectedCert.certificateNumber}
                      </span>
                    </div>

                    {/* Right: GRANDE INSPETOR GERAL / INSTRUTOR JANDERSON CAMARGOS */}
                    <div className="space-y-0.5">
                      {/* Stylized Masonic Signature Graphic */}
                      <div className="h-8 flex items-center justify-center">
                        <span className="font-serif italic text-base sm:text-lg text-blue-900 font-bold opacity-80 select-none">
                          Janderson Camargos .·.
                        </span>
                      </div>
                      <div
                        className={`w-36 sm:w-48 h-0.5 mx-auto mb-1 ${
                          certTheme === 'parchment' ? 'bg-slate-700' : 'bg-slate-500'
                        }`}
                      />
                      <div
                        className={`text-[11px] sm:text-xs font-bold font-masonic leading-tight ${
                          certTheme === 'parchment' ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        GRANDE INSPETOR GERAL / INSTRUTOR JANDERSON CAMARGOS
                      </div>
                      <div
                        className={`text-[9px] sm:text-[10px] font-semibold ${
                          certTheme === 'parchment' ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        Grande Inspetor Geral / Instrutor Docente
                      </div>
                    </div>
                  </div>

                  {/* Certificate Footer Stamp */}
                  <div
                    className={`pt-3 text-[9px] sm:text-[10px] border-t flex flex-col sm:flex-row items-center justify-between ${
                      certTheme === 'parchment'
                        ? 'border-slate-300 text-slate-500'
                        : 'border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <span>
                      Emitido no Oriente em{' '}
                      {new Date(selectedCert.issueDate).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="font-mono">Chancela Digital: {selectedCert.certificateNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
