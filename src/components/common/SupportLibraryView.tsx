import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FolderDown,
  Video,
  FileText,
  Headphones,
  UploadCloud,
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  Download,
  Eye,
  Trash2,
  Edit,
  ExternalLink,
  BookOpen,
  Music,
  CheckCircle,
  X,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Calendar,
  User,
  Tag,
  Volume2,
  VolumeX,
  Clock,
  Shield,
  HelpCircle,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { SupportMaterial, SupportMediaType } from '../../types';
import { FACULDADE_SEAL_IMG } from '../../assets/logo';

interface SupportLibraryViewProps {
  onNavigate?: (view: string, payload?: any) => void;
}

const CATEGORIES = [
  'Todos',
  'Rituais & Liturgia',
  'Simbologia & Filosofia',
  'História & Tradição',
  'Música Harmônica',
  'Pranchas de Arquitetura',
  'Landmarks & Legislação',
];

export const SupportLibraryView: React.FC<SupportLibraryViewProps> = ({ onNavigate }) => {
  const { userProfile, isAdmin, isInstructor } = useAuth();
  const canManage = isAdmin || isInstructor;

  const [materials, setMaterials] = useState<SupportMaterial[]>([]);
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'video' | 'pdf' | 'audio'>('all');
  const [selectedDegree, setSelectedDegree] = useState<number>(-1); // -1 = all, 0 = general, 1, 2, 3
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<SupportMaterial | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<SupportMaterial | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Audio Player State in Modal
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Upload Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaType: 'pdf' as SupportMediaType,
    degreeNumber: 1,
    category: 'Rituais & Liturgia',
    author: '',
    externalUrl: '',
    duration: '',
    pagesCount: 1,
    tags: '',
    featured: false,
    fileName: '',
    fileSize: '',
    fileUrl: '',
  });

  const [uploadedFilePreview, setUploadedFilePreview] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);

  // Load materials
  const loadMaterials = () => {
    const data = dataStore.getSupportMaterials();
    setMaterials(data);
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      // Type Filter
      if (activeTypeTab !== 'all' && item.mediaType !== activeTypeTab) {
        return false;
      }
      // Degree Filter
      if (selectedDegree !== -1) {
        if (selectedDegree === 0 && item.degreeNumber !== 0) return false;
        if (selectedDegree > 0 && item.degreeNumber !== selectedDegree && item.degreeNumber !== 0) {
          return false;
        }
      }
      // Category Filter
      if (selectedCategory !== 'Todos' && item.category !== selectedCategory) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(q);
        const inDesc = item.description.toLowerCase().includes(q);
        const inAuthor = item.author?.toLowerCase().includes(q) || false;
        const inTags = item.tags?.some((t) => t.toLowerCase().includes(q)) || false;
        const inFileName = item.fileName?.toLowerCase().includes(q) || false;
        if (!inTitle && !inDesc && !inAuthor && !inTags && !inFileName) {
          return false;
        }
      }
      return true;
    });
  }, [materials, activeTypeTab, selectedDegree, selectedCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = materials.length;
    const pdfs = materials.filter((m) => m.mediaType === 'pdf' || m.mediaType === 'document').length;
    const videos = materials.filter((m) => m.mediaType === 'video').length;
    const audios = materials.filter((m) => m.mediaType === 'audio').length;
    const totalDownloads = materials.reduce((acc, curr) => acc + (curr.downloadsCount || 0), 0);
    const totalViews = materials.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);

    return { total, pdfs, videos, audios, totalDownloads, totalViews };
  }, [materials]);

  // Handle File Upload from Input (PDF, Audio, Video)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    let detectedType: SupportMediaType = formData.mediaType;

    if (file.type.includes('pdf')) {
      detectedType = 'pdf';
    } else if (file.type.includes('video') || file.name.endsWith('.mp4') || file.name.endsWith('.webm')) {
      detectedType = 'video';
    } else if (file.type.includes('audio') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
      detectedType = 'audio';
    }

    setUploadedFilePreview({
      name: file.name,
      size: sizeInMb,
      type: file.type || detectedType,
    });

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeInMb,
        fileUrl: result,
        mediaType: detectedType,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenNewModal = () => {
    setEditingMaterial(null);
    setUploadedFilePreview(null);
    setFormData({
      title: '',
      description: '',
      mediaType: activeTypeTab !== 'all' ? activeTypeTab : 'pdf',
      degreeNumber: selectedDegree > 0 ? selectedDegree : 1,
      category: selectedCategory !== 'Todos' ? selectedCategory : 'Rituais & Liturgia',
      author: userProfile?.fullName ? `Ir. ${userProfile.fullName}` : '',
      externalUrl: '',
      duration: '',
      pagesCount: 1,
      tags: '',
      featured: false,
      fileName: '',
      fileSize: '',
      fileUrl: '',
    });
    setIsUploadModalOpen(true);
  };

  const handleOpenEditModal = (item: SupportMaterial) => {
    setEditingMaterial(item);
    setUploadedFilePreview(
      item.fileName ? { name: item.fileName, size: item.fileSize || 'N/A', type: item.mediaType } : null
    );
    setFormData({
      title: item.title,
      description: item.description,
      mediaType: item.mediaType,
      degreeNumber: item.degreeNumber,
      category: item.category,
      author: item.author || '',
      externalUrl: item.externalUrl || '',
      duration: item.duration || '',
      pagesCount: item.pagesCount || 1,
      tags: item.tags ? item.tags.join(', ') : '',
      featured: item.featured || false,
      fileName: item.fileName || '',
      fileSize: item.fileSize || '',
      fileUrl: item.fileUrl || '',
    });
    setIsUploadModalOpen(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Por favor, informe o título do material de apoio.');
      return;
    }

    let embedUrl = '';
    if (formData.externalUrl) {
      if (formData.externalUrl.includes('youtube.com/watch?v=')) {
        const videoId = formData.externalUrl.split('v=')[1]?.split('&')[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (formData.externalUrl.includes('youtu.be/')) {
        const videoId = formData.externalUrl.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (formData.externalUrl.includes('vimeo.com/')) {
        const videoId = formData.externalUrl.split('vimeo.com/')[1]?.split('?')[0];
        if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
      } else {
        embedUrl = formData.externalUrl;
      }
    }

    const degreeNames: Record<number, string> = {
      0: 'Geral • Todos os Graus',
      1: 'Grau 01 • Aprendiz Maçom',
      2: 'Grau 02 • Companheiro Maçom',
      3: 'Grau 03 • Mestre Maçom',
    };

    const tagsArray = formData.tags
      ? formData.tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];

    if (editingMaterial) {
      dataStore.updateSupportMaterial(
        editingMaterial.id,
        {
          title: formData.title,
          description: formData.description,
          mediaType: formData.mediaType,
          degreeNumber: formData.degreeNumber,
          degreeName: degreeNames[formData.degreeNumber] || 'Geral',
          category: formData.category,
          author: formData.author,
          externalUrl: formData.externalUrl,
          embedUrl: embedUrl || editingMaterial.embedUrl,
          duration: formData.duration,
          pagesCount: Number(formData.pagesCount) || undefined,
          tags: tagsArray,
          featured: formData.featured,
          fileName: formData.fileName || editingMaterial.fileName,
          fileSize: formData.fileSize || editingMaterial.fileSize,
          fileUrl: formData.fileUrl || editingMaterial.fileUrl,
        },
        userProfile?.fullName
      );
    } else {
      dataStore.addSupportMaterial(
        {
          title: formData.title,
          description: formData.description,
          mediaType: formData.mediaType,
          degreeNumber: formData.degreeNumber,
          degreeName: degreeNames[formData.degreeNumber] || 'Geral',
          category: formData.category,
          author: formData.author || (userProfile ? `Ir. ${userProfile.fullName}` : 'Faculdade Maçônica'),
          externalUrl: formData.externalUrl,
          embedUrl,
          duration: formData.duration,
          pagesCount: Number(formData.pagesCount) || undefined,
          tags: tagsArray,
          featured: formData.featured,
          fileName: formData.fileName,
          fileSize: formData.fileSize || '3.5 MB',
          fileUrl: formData.fileUrl,
          uploaderId: userProfile?.id,
          uploaderName: userProfile?.fullName,
          uploaderRole: userProfile?.role,
        },
        userProfile?.fullName
      );
    }

    setIsUploadModalOpen(false);
    loadMaterials();
  };

  const handleDeleteMaterial = (id: string) => {
    dataStore.deleteSupportMaterial(id, userProfile?.fullName);
    setDeleteConfirmId(null);
    if (viewingMaterial?.id === id) {
      setViewingMaterial(null);
    }
    loadMaterials();
  };

  const handleOpenView = (item: SupportMaterial) => {
    dataStore.incrementMaterialView(item.id);
    setViewingMaterial(item);
    setIsPlayingAudio(false);
    setAudioProgress(0);
    loadMaterials();
  };

  const handleDownload = (item: SupportMaterial, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dataStore.incrementMaterialDownload(item.id);
    loadMaterials();

    if (item.fileUrl) {
      const link = document.createElement('a');
      link.href = item.fileUrl;
      link.download = item.fileName || `${item.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (item.externalUrl) {
      window.open(item.externalUrl, '_blank');
    } else {
      // Create a virtual text blob as sample download for seeded documents
      const sampleText = `FACULDADE MAÇÔNICA UNIVERSAL
===========================================
LIVRO DE APOIO & INSTRUÇÃO DOUTRINÁRIA
===========================================
Título: ${item.title}
Grau: ${item.degreeName || `Grau 0${item.degreeNumber}`}
Categoria: ${item.category}
Autor: ${item.author || 'Faculdade Maçônica Universal'}
Data: ${new Date(item.createdAt).toLocaleDateString('pt-BR')}

RESUMO DOUTRINÁRIO:
${item.description}

ORIENTAÇÕES DE ESTUDO:
1. Analise os símbolos com ponderação e discrição.
2. Desbaste sua Pedra Bruta diariamente através da reflexão moral.
3. Consulte seus Mestres e Vigilantes para aprofundamento litúrgico.

A.·. G.·. D.·. G.·. A.·. D.·. U.·.
`;
      const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.fileName || `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Helper icons and styles for media types
  const getMediaBadge = (type: SupportMediaType) => {
    switch (type) {
      case 'video':
        return {
          label: 'Vídeo Doutrinário',
          icon: Video,
          colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          iconColor: 'text-rose-400',
        };
      case 'audio':
        return {
          label: 'Áudio & Harmonia',
          icon: Headphones,
          colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          iconColor: 'text-emerald-400',
        };
      case 'pdf':
      case 'document':
      default:
        return {
          label: 'Documento / PDF',
          icon: FileText,
          colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          iconColor: 'text-blue-400',
        };
    }
  };

  const getDegreeBadge = (degree: number) => {
    switch (degree) {
      case 1:
        return {
          label: 'Grau 01 • Aprendiz',
          bg: 'bg-blue-900/60 text-blue-300 border-blue-600/40',
        };
      case 2:
        return {
          label: 'Grau 02 • Companheiro',
          bg: 'bg-emerald-900/60 text-emerald-300 border-emerald-600/40',
        };
      case 3:
        return {
          label: 'Grau 03 • Mestre',
          bg: 'bg-amber-900/60 text-amber-300 border-amber-500/40',
        };
      default:
        return {
          label: 'Geral • Todos os Graus',
          bg: 'bg-purple-900/60 text-purple-300 border-purple-500/40',
        };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* HEADER PRINCIPAL */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c0f17] via-[#121624] to-[#0a0d14] border-2 border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-xl shrink-0 flex items-center justify-center">
              <img
                src={FACULDADE_SEAL_IMG}
                alt="Brasão Oficial Faculdade Maçônica"
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black font-masonic uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Acervo Oficial de Estudos
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  Vídeos • PDFs • Áudios
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-masonic text-slate-100 gold-gradient-text tracking-wide">
                Biblioteca de Apoio
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Repositório maçônico com manuais doutrinários, pranchas de arquitetura, rituais em PDF, aulas em vídeo e peças de harmonia para o desenvolvimento nos Graus Simbólicos.
              </p>
            </div>
          </div>

          {/* Botão de Upload de Material */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleOpenNewModal}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs sm:text-sm uppercase tracking-wider shadow-xl hover:scale-105 transition-all flex items-center justify-center space-x-2.5 border border-amber-400/50"
            >
              <UploadCloud className="w-5 h-5 text-slate-950" />
              <span>Fazer Upload de Material</span>
            </button>
          </div>
        </div>

        {/* ESTATÍSTICAS RÁPIDAS DO ACERVO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 mt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total no Acervo</span>
            <span className="text-lg sm:text-xl font-black text-amber-400 font-masonic">{stats.total}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">PDFs & Manuais</span>
            <span className="text-lg sm:text-xl font-black text-blue-300 font-masonic">{stats.pdfs}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Vídeos Aulas</span>
            <span className="text-lg sm:text-xl font-black text-rose-300 font-masonic">{stats.videos}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Áudios & Sons</span>
            <span className="text-lg sm:text-xl font-black text-emerald-300 font-masonic">{stats.audios}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">Downloads Feitos</span>
            <span className="text-lg sm:text-xl font-black text-amber-200 font-masonic">{stats.totalDownloads}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Acessos em Loja</span>
            <span className="text-lg sm:text-xl font-black text-purple-300 font-masonic">{stats.totalViews}</span>
          </div>
        </div>
      </div>

      {/* ABAS POR TIPO DE MÍDIA */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#0c0f17] border border-amber-500/20 shadow-lg">
        <button
          onClick={() => setActiveTypeTab('all')}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-masonic text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
            activeTypeTab === 'all'
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Todos ({materials.length})</span>
        </button>

        <button
          onClick={() => setActiveTypeTab('pdf')}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-masonic text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
            activeTypeTab === 'pdf'
              ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-blue-300 hover:bg-slate-900/60'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>PDFs & Manuais ({stats.pdfs})</span>
        </button>

        <button
          onClick={() => setActiveTypeTab('video')}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-masonic text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
            activeTypeTab === 'video'
              ? 'bg-rose-600 text-white shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900/60'
          }`}
        >
          <Video className="w-4 h-4 text-rose-400" />
          <span>Vídeos Doutrinários ({stats.videos})</span>
        </button>

        <button
          onClick={() => setActiveTypeTab('audio')}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-masonic text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
            activeTypeTab === 'audio'
              ? 'bg-emerald-600 text-white shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900/60'
          }`}
        >
          <Headphones className="w-4 h-4 text-emerald-400" />
          <span>Áudios & Harmonia ({stats.audios})</span>
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0d111a] border border-slate-800 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Barra de Busca */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, autor, prancha, ritual, tema (#tag)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por Grau */}
          <div className="md:col-span-3">
            <select
              value={selectedDegree}
              onChange={(e) => setSelectedDegree(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
            >
              <option value={-1}>🏛️ Todos os Graus Simbólicos</option>
              <option value={1}>Grau 01 • Aprendiz Maçom</option>
              <option value={2}>Grau 02 • Companheiro Maçom</option>
              <option value={3}>Grau 03 • Mestre Maçom</option>
              <option value={0}>Geral • Doutrina & Landmarks</option>
            </select>
          </div>

          {/* Filtro por Categoria */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Todos' ? '📂 Todas as Categorias' : `📁 ${cat}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags Rápidas de Filtro */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] text-slate-400 font-bold flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Filtro Rápido:</span>
          </span>
          {['Todos', 'Grau 1', 'Grau 2', 'Grau 3', 'Rituais', 'Música Harmônica', 'Landmarks'].map((tag) => {
            let isActive = false;
            if (tag === 'Todos') isActive = selectedDegree === -1 && selectedCategory === 'Todos';
            if (tag === 'Grau 1') isActive = selectedDegree === 1;
            if (tag === 'Grau 2') isActive = selectedDegree === 2;
            if (tag === 'Grau 3') isActive = selectedDegree === 3;
            if (tag === 'Rituais') isActive = selectedCategory === 'Rituais & Liturgia';
            if (tag === 'Música Harmônica') isActive = selectedCategory === 'Música Harmônica';
            if (tag === 'Landmarks') isActive = selectedCategory === 'Landmarks & Legislação';

            return (
              <button
                key={tag}
                onClick={() => {
                  if (tag === 'Todos') {
                    setSelectedDegree(-1);
                    setSelectedCategory('Todos');
                    setSearchQuery('');
                  } else if (tag === 'Grau 1') setSelectedDegree(1);
                  else if (tag === 'Grau 2') setSelectedDegree(2);
                  else if (tag === 'Grau 3') setSelectedDegree(3);
                  else if (tag === 'Rituais') setSelectedCategory('Rituais & Liturgia');
                  else if (tag === 'Música Harmônica') setSelectedCategory('Música Harmônica');
                  else if (tag === 'Landmarks') setSelectedCategory('Landmarks & Legislação');
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* GRADE DE MATERIAIS DE APOIO */}
      {filteredMaterials.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0d1017] border border-slate-800 space-y-4">
          <BookOpen className="w-12 h-12 text-amber-500/40 mx-auto" />
          <h3 className="text-lg font-bold font-masonic text-slate-200">
            Nenhum material de apoio encontrado
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Não há documentos, vídeos ou áudios que correspondam aos filtros selecionados. Tente ajustar os termos de busca ou faça o upload de um novo material.
          </p>
          <button
            onClick={() => {
              setActiveTypeTab('all');
              setSelectedDegree(-1);
              setSelectedCategory('Todos');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold border border-slate-700 transition-all"
          >
            Limpar Filtros de Busca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((item) => {
            const mediaBadge = getMediaBadge(item.mediaType);
            const degreeBadge = getDegreeBadge(item.degreeNumber);
            const MediaIcon = mediaBadge.icon;

            return (
              <div
                key={item.id}
                onClick={() => handleOpenView(item)}
                className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-[#0e121a] to-[#0a0d14] border border-slate-800 hover:border-amber-500/60 p-5 shadow-lg hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-1"
              >
                {/* Destaque Tag */}
                {item.featured && (
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black font-masonic tracking-wider uppercase shadow-md flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-slate-950" />
                    <span>Destaque</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center space-x-1.5 ${mediaBadge.colorClass}`}
                    >
                      <MediaIcon className={`w-3.5 h-3.5 ${mediaBadge.iconColor}`} />
                      <span>{mediaBadge.label}</span>
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black font-masonic border ${degreeBadge.bg}`}
                    >
                      {degreeBadge.label}
                    </span>
                  </div>

                  {/* Title & Category */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-400 font-masonic font-bold uppercase tracking-widest block">
                      📁 {item.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Metadata Chips: Duration, Pages, Size, Author */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    {item.duration && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{item.duration}</span>
                      </span>
                    )}

                    {item.pagesCount && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                        <FileText className="w-3 h-3 text-blue-400" />
                        <span>{item.pagesCount} pgs</span>
                      </span>
                    )}

                    {item.fileSize && (
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px]">
                        {item.fileSize}
                      </span>
                    )}

                    {item.author && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[180px] block">
                        Por: <strong className="text-slate-300">{item.author}</strong>
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1" title="Visualizações">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.viewsCount || 0}</span>
                    </span>
                    <span className="flex items-center space-x-1" title="Downloads">
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.downloadsCount || 0}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(item);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-700 transition-colors"
                          title="Editar Material"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(item.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                          title="Excluir Material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDownload(item, e)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-300 font-masonic text-[11px] font-bold border border-amber-500/30 flex items-center space-x-1.5 hover:border-amber-400 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE VISUALIZAÇÃO / PLAYER / LEITOR DO MATERIAL */}
      {/* ========================================================= */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0e121a] border-2 border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-6 shrink-0 bg-[#0d1017]">
              <div className="flex items-center space-x-2 text-amber-400 font-masonic text-xs font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Biblioteca de Apoio • Visualização Oficial</span>
              </div>
              <button
                onClick={() => setViewingMaterial(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with internal scroll */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 text-slate-100">
              {/* Media Player Area */}
              {viewingMaterial.mediaType === 'video' && (
                <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center relative shadow-2xl">
                  {viewingMaterial.embedUrl ? (
                    <iframe
                      src={viewingMaterial.embedUrl}
                      title={viewingMaterial.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : viewingMaterial.fileUrl ? (
                    <video
                      src={viewingMaterial.fileUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <Video className="w-12 h-12 text-rose-500/60 mx-auto animate-pulse" />
                      <p className="text-sm font-bold text-slate-300">Vídeo Doutrinário em Alta Resolução</p>
                      <p className="text-xs text-slate-500">
                        {viewingMaterial.externalUrl || 'Vídeo disponível na íntegra para o Templo'}
                      </p>
                      {viewingMaterial.externalUrl && (
                        <a
                          href={viewingMaterial.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Abrir no Player Externo</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {viewingMaterial.mediaType === 'audio' && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#131926] to-[#0b0e14] border border-emerald-500/40 space-y-5 shadow-xl text-center">
                  <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-emerald-600 via-emerald-400 to-amber-500 shadow-xl mx-auto flex items-center justify-center">
                    <Headphones className="w-10 h-10 text-slate-950" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black font-masonic text-emerald-400 uppercase tracking-widest block">
                      Player de Harmonia & Instrução Sonora
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold font-masonic text-slate-100">
                      {viewingMaterial.title}
                    </h3>
                    <p className="text-xs text-slate-400">{viewingMaterial.author || 'Faculdade Maçônica Universal'}</p>
                  </div>

                  {/* Simulated Audio Track / Controls */}
                  <div className="space-y-2 max-w-md mx-auto pt-2">
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative cursor-pointer">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${isPlayingAudio ? audioProgress || 45 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{isPlayingAudio ? '04:12' : '00:00'}</span>
                      <span>{viewingMaterial.duration || '18:45'}</span>
                    </div>

                    <div className="flex items-center justify-center space-x-4 pt-2">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 transition-all"
                      >
                        {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>

                      <button
                        onClick={() => handleDownload(viewingMaterial)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700"
                        title="Baixar Faixa de Áudio"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(viewingMaterial.mediaType === 'pdf' || viewingMaterial.mediaType === 'document') && (
                <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#121624] to-[#090c12] border border-blue-500/40 space-y-5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 font-masonic">
                          {viewingMaterial.fileName || `${viewingMaterial.title}.pdf`}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {viewingMaterial.pagesCount ? `${viewingMaterial.pagesCount} páginas • ` : ''}
                          {viewingMaterial.fileSize || '3.8 MB'} • Formato PDF / Prancha
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(viewingMaterial)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar PDF</span>
                    </button>
                  </div>

                  {/* Leitor Solene de Trecho de Prancha */}
                  <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 font-serif leading-relaxed space-y-3 shadow-inner">
                    <div className="text-[10px] font-sans font-bold text-amber-400 uppercase tracking-widest text-center">
                      A.·. G.·. D.·. G.·. A.·. D.·. U.·.
                    </div>
                    <h5 className="font-masonic text-slate-100 text-center text-sm font-bold">
                      {viewingMaterial.title}
                    </h5>
                    <p className="italic text-slate-300 indent-4">
                      "{viewingMaterial.description}"
                    </p>
                    <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 text-right">
                      Corpo Docente da Faculdade Maçônica Universal • GOMAU
                    </p>
                  </div>
                </div>
              )}

              {/* Informações Detalhadas */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Categoria</span>
                    <span className="text-sm font-bold text-amber-300 font-masonic">{viewingMaterial.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Grau Recomendado</span>
                    <span className="text-sm font-bold text-slate-200">{viewingMaterial.degreeName || `Grau 0${viewingMaterial.degreeNumber}`}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Autor / Instrutor</span>
                    <span className="text-sm font-bold text-slate-200">{viewingMaterial.author || 'Faculdade Maçônica'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Data de Cadastro</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {new Date(viewingMaterial.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {viewingMaterial.tags && viewingMaterial.tags.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Palavras-chave:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingMaterial.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px] font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 p-4 sm:p-6 shrink-0 bg-[#0d1017]">
              <div className="text-xs text-slate-400">
                Visualizado {viewingMaterial.viewsCount || 1} vezes • {viewingMaterial.downloadsCount || 0} downloads
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewingMaterial(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleDownload(viewingMaterial)}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs shadow-lg flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Fazer Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE UPLOAD / CADASTRO / EDIÇÃO DE MATERIAL */}
      {/* ========================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0e121a] border-2 border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-6 shrink-0 bg-[#0d1017]">
              <div className="flex items-center space-x-2 text-amber-400 font-masonic text-sm font-bold">
                <UploadCloud className="w-5 h-5 text-amber-400" />
                <span>
                  {editingMaterial ? 'Editar Material de Apoio' : 'Upload de Novo Material de Apoio'}
                </span>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form with internal scroll */}
            <form onSubmit={handleSaveMaterial} className="flex flex-col flex-1 overflow-hidden text-xs">
              <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
                {/* TIPO DE MÍDIA SELETOR */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200">Tipo de Mídia / Arquivo *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mediaType: 'pdf' })}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                        formData.mediaType === 'pdf'
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-[11px]">PDF / Prancha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mediaType: 'video' })}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                        formData.mediaType === 'video'
                          ? 'bg-rose-600/30 border-rose-500 text-rose-300 font-bold shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Video className="w-5 h-5" />
                      <span className="text-[11px]">Vídeo / Aula</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mediaType: 'audio' })}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                        formData.mediaType === 'audio'
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Headphones className="w-5 h-5" />
                      <span className="text-[11px]">Áudio / Harmonia</span>
                    </button>
                  </div>
                </div>

                {/* ÁREA DE DRAG & DROP / FILE INPUT */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200 flex items-center justify-between">
                    <span>Arquivo para Upload (PDF, MP3, MP4, WAV)</span>
                    <span className="text-[10px] text-amber-400 font-normal">Máx: 50MB</span>
                  </label>
                  <label className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition-all text-center group">
                    <UploadCloud className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform mb-2" />
                    <span className="text-xs font-bold text-slate-200">
                      {uploadedFilePreview ? uploadedFilePreview.name : 'Clique ou arraste o arquivo aqui'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {uploadedFilePreview
                        ? `Tamanho: ${uploadedFilePreview.size} • Pronto para salvar`
                        : 'Suporta arquivos PDF, MP3, WAV, MP4, WebM'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.mp3,.wav,.mp4,.webm,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* TÍTULO DO MATERIAL */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Título do Material *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Manual de Instrução do Aprendiz Maçom (R.E.A.A.)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                {/* GRAU & CATEGORIA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">Grau Simbólico *</label>
                    <select
                      value={formData.degreeNumber}
                      onChange={(e) => setFormData({ ...formData, degreeNumber: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold focus:outline-none focus:border-amber-500 text-xs"
                    >
                      <option value={1}>Grau 01 • Aprendiz Maçom</option>
                      <option value={2}>Grau 02 • Companheiro Maçom</option>
                      <option value={3}>Grau 03 • Mestre Maçom</option>
                      <option value={0}>Geral • Todos os Graus</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">Categoria Doutrinária *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                    >
                      {CATEGORIES.filter((c) => c !== 'Todos').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* LINK EXTERNO / EMBED (YouTube, Vimeo, Drive, Spotify) */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-200 flex items-center justify-between">
                    <span>Link Externo (Opcional - YouTube, Vimeo, Google Drive)</span>
                    <span className="text-[10px] text-slate-400">Embed Automático</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... ou https://drive.google.com/..."
                    value={formData.externalUrl}
                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                {/* AUTOR & DURAÇÃO / PÁGINAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">Autor / Instrutor / Potência</label>
                    <input
                      type="text"
                      placeholder="Ex: Ir. Janderson Camargos / GOMAU"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">
                      {formData.mediaType === 'pdf' ? 'Número de Páginas' : 'Duração (ex: 25:30)'}
                    </label>
                    <input
                      type="text"
                      placeholder={formData.mediaType === 'pdf' ? 'Ex: 48' : 'Ex: 24:15 ou 45 min'}
                      value={formData.mediaType === 'pdf' ? formData.pagesCount : formData.duration}
                      onChange={(e) => {
                        if (formData.mediaType === 'pdf') {
                          setFormData({ ...formData, pagesCount: Number(e.target.value) });
                        } else {
                          setFormData({ ...formData, duration: e.target.value });
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>

                {/* DESCRIÇÃO / RESUMO DOUTRINÁRIO */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Descrição / Resumo do Material</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva os temas abordados, a relevância iniciática e as orientações para estudo..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                {/* TAGS & DESTAQUE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">Tags / Palavras-chave</label>
                    <input
                      type="text"
                      placeholder="Ex: aprendiz, ritual, pedra bruta, silêncio"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs font-mono"
                    />
                  </div>

                  <div className="pt-4">
                    <label className="flex items-center space-x-2 cursor-pointer p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-slate-200 font-bold text-xs">Destacar na Biblioteca de Apoio</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-slate-800 shrink-0 bg-[#0d1017]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs shadow-lg flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4 text-slate-950" />
                  <span>{editingMaterial ? 'Salvar Alterações' : 'Confirmar e Publicar Material'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ========================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0e121a] border border-rose-500/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold font-masonic">Confirmar Exclusão de Material</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja remover este material da Biblioteca de Apoio? Esta ação é irreversível e removerá o arquivo do acervo de estudos.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteMaterial(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg"
              >
                Sim, Excluir Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
