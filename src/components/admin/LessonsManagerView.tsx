import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  FolderPlus,
  Layers,
  Clock,
  Headphones,
  Video,
  FileText,
  Search,
  Filter,
  AlertTriangle,
  X,
  Paperclip,
  UploadCloud,
  Download,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { Lesson, Module, LessonAttachment } from '../../types';

export const LessonsManagerView: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>(() => dataStore.getLessons(99, true));
  const [modules, setModules] = useState<Module[]>(() => dataStore.getModules());
  const [degrees] = useState(() => dataStore.getDegrees());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDegree, setSelectedDegree] = useState<number | 'all'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<{ id: string; title: string; degreeNumber: number } | null>(null);

  // Lesson Edit/Create Modal State
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [degreeNumber, setDegreeNumber] = useState<number>(1);
  const [moduleId, setModuleId] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15);
  const [audioUrl, setAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [essayPrompt, setEssayPrompt] = useState('');
  const [minimumPassingGrade, setMinimumPassingGrade] = useState<number>(70);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Add Module Modal State
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [modTitle, setModTitle] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modDegree, setModDegree] = useState<number>(1);
  const [modOrder, setModOrder] = useState<number>(1);

  const refreshData = () => {
    setLessons(dataStore.getLessons(99, true));
    setModules(dataStore.getModules());
  };

  const handleFileUploadAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newAtt: LessonAttachment = {
        name: file.name,
        url: dataUrl,
        type: file.type || 'application/pdf',
        size: sizeInMb,
      };
      setAttachments((prev) => [...prev, newAtt]);
      setUploadingFile(false);
    };
    reader.onerror = () => {
      setUploadingFile(false);
      setFeedback('Erro ao processar o arquivo anexado.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const openNewLesson = () => {
    setEditingLessonId(null);
    setTitle('');
    setSummary('');
    setContent('### 1. Fundamentos & Simbolismo\n\nTexto reflexivo da instrução...\n\n> "Citação ou máxima maçônica para reflexão."\n\n### 2. Aplicação Moral no Templo Interior\n\nDesenvolvimento dos conceitos morais e éticos...');
    
    // Default to currently selected degree if not 'all', otherwise default to 1
    const targetDeg = selectedDegree !== 'all' ? selectedDegree : 1;
    setDegreeNumber(targetDeg);
    const targetMod = modules.find((m) => m.degreeNumber === targetDeg);
    setModuleId(targetMod?.id || `mod_${targetDeg}_1`);
    setOrder(lessons.filter((l) => l.degreeNumber === targetDeg).length + 1);
    setEstimatedMinutes(15);
    setAudioUrl('https://example.com/audio-masonic.mp3');
    setVideoUrl('');
    setStatus('published');
    setAttachments([]);
    setEssayPrompt('Elabore uma Prancha de Arquitetura (1 a 3 páginas) dissertando sobre os ensinamentos práticos desta instrução na vida profana e em Loja.');
    setMinimumPassingGrade(70);
    setIsEditingLesson(true);
  };

  const openEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setTitle(lesson.title);
    setSummary(lesson.summary || lesson.subtitle || '');
    setContent(lesson.content);
    setDegreeNumber(lesson.degreeNumber);
    setModuleId(lesson.moduleId);
    setOrder(lesson.order || 1);
    setEstimatedMinutes(lesson.estimatedMinutes || 20);
    setAudioUrl(lesson.audioUrl || '');
    setVideoUrl(lesson.videoUrl || '');
    setStatus(lesson.status);
    setAttachments(lesson.attachments || []);
    setEssayPrompt(lesson.essayPrompt || '');
    setMinimumPassingGrade(lesson.minimumPassingGrade || 70);
    setIsEditingLesson(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const mod = modules.find((m) => m.id === moduleId && m.degreeNumber === degreeNumber) ||
      modules.find((m) => m.degreeNumber === degreeNumber);
    const effectiveModuleId = mod ? mod.id : `mod_${degreeNumber}_1`;
    const modTitle = mod ? mod.title : `Módulo Grau ${degreeNumber}`;
    const existingLesson = editingLessonId ? lessons.find((l) => l.id === editingLessonId) : null;

    const lessonObj: Lesson = {
      id: editingLessonId || `inst_${degreeNumber}_${Date.now()}`,
      degreeNumber,
      degreeId: `grau_${degreeNumber}`,
      moduleId: effectiveModuleId,
      moduleTitle: modTitle,
      order: order || existingLesson?.order || 1,
      number: existingLesson?.number || order || 1,
      title,
      summary: summary || title,
      subtitle: summary || title,
      objective: existingLesson?.objective || summary || title,
      content,
      estimatedMinutes: estimatedMinutes || 15,
      audioUrl: audioUrl || undefined,
      videoUrl: videoUrl || undefined,
      status,
      attachments: attachments.length > 0 ? attachments : (existingLesson?.attachments || []),
      essayPrompt: essayPrompt || existingLesson?.essayPrompt,
      minimumPassingGrade: minimumPassingGrade || existingLesson?.minimumPassingGrade || 70,
      author: existingLesson?.author || currentAdmin?.fullName || 'Faculdade Maçônica',
      createdAt: existingLesson?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dataStore.saveLesson(lessonObj, currentAdmin?.fullName || 'Administrador');
    setFeedback(`Instrução "${title}" salva com sucesso com todos os anexos e uploads preservados!`);
    setTimeout(() => setFeedback(null), 4000);
    setIsEditingLesson(false);

    // Auto-adjust degree filter so the user immediately sees the saved instruction
    if (selectedDegree !== 'all' && selectedDegree !== degreeNumber) {
      setSelectedDegree(degreeNumber);
    }
    refreshData();
  };

  const handleDeleteLesson = (id: string, title: string, degreeNumber: number) => {
    setDeletingLesson({ id, title, degreeNumber });
  };

  const confirmDeleteLesson = () => {
    if (!deletingLesson) return;
    const success = dataStore.deleteLesson(deletingLesson.id, currentAdmin?.fullName || 'Administrador');
    if (success) {
      setFeedback(`Instrução "${deletingLesson.title}" excluída com sucesso.`);
    } else {
      setFeedback(`Não foi possível excluir a instrução.`);
    }
    setTimeout(() => setFeedback(null), 3000);
    setDeletingLesson(null);
    refreshData();
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    dataStore.addModule(
      {
        degreeNumber: modDegree,
        title: modTitle,
        description: modDesc,
        order: modOrder,
      },
      currentAdmin?.fullName || 'Administrador'
    );
    setFeedback(`Módulo "${modTitle}" cadastrado com sucesso!`);
    setTimeout(() => setFeedback(null), 3000);
    setIsAddingModule(false);
    setModTitle('');
    setModDesc('');
    refreshData();
  };

  const filteredLessons = lessons.filter((l) => {
    if (selectedDegree !== 'all' && l.degreeNumber !== selectedDegree) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!l.title.toLowerCase().includes(q) && !l.summary.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1418] via-[#141018] to-black border border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Matriz Curricular de Instruções</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Gerenciar Módulos & Instruções
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Cadastre novas instruções, formate o texto filosófico, adicione áudios de palestras e estruture os módulos por grau maçônico.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddingModule(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>Novo Módulo</span>
          </button>
          <button
            onClick={openNewLesson}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Instrução</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por título ou resumo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Quick Degree Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setSelectedDegree('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDegree === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({lessons.length})
          </button>
          {[1, 2, 3].map((degNum) => {
            const count = lessons.filter((l) => l.degreeNumber === degNum).length;
            const degName = degNum === 1 ? 'Grau 01' : degNum === 2 ? 'Grau 02' : 'Grau 03';
            return (
              <button
                key={degNum}
                type="button"
                onClick={() => setSelectedDegree(degNum)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  selectedDegree === degNum
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{degName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedDegree === degNum ? 'bg-slate-950/30 text-slate-900 font-black' : 'bg-slate-800 text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lessons List Table */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Instrução</th>
                <th className="py-3 px-4">Grau / Módulo</th>
                <th className="py-3 px-4">Recursos</th>
                <th className="py-3 px-4">Tempo Estudo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLessons.map((l) => (
                <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-100 text-xs line-clamp-1">{l.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{l.summary}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Grau 0{l.degreeNumber}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">{l.moduleTitle}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      {l.audioUrl && (
                        <span title="Áudio Anexado" className="p-1 rounded bg-slate-800 text-amber-400">
                          <Headphones className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {l.videoUrl && (
                        <span title="Vídeo Anexado" className="p-1 rounded bg-slate-800 text-rose-400">
                          <Video className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span title="Texto" className="p-1 rounded bg-slate-800 text-slate-300">
                        <FileText className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {l.estimatedMinutes} min
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        l.status === 'published'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {l.status === 'published' ? 'Publicada' : 'Rascunho'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditLesson(l)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-amber-400 transition-colors"
                        title="Editar Instrução"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(l.id, l.title, l.degreeNumber)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 transition-colors"
                        title="Excluir Instrução"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Lesson Modal */}
      {isEditingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/90 backdrop-blur-md overflow-hidden animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0e121a] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-6 shrink-0 bg-[#0d1017]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 font-masonic">
                    Matriz Curricular • Doutrinação
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-masonic text-slate-100">
                    {editingLessonId ? 'Editar Peça de Instrução' : 'Cadastrar Nova Peça de Instrução'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingLesson(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveLesson} className="flex flex-col flex-1 overflow-hidden text-xs">
              <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
                {/* TÍTULO DA INSTRUÇÃO - FULL WIDTH & PROMINENT */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 shadow-inner">
                  <label className="text-xs sm:text-sm font-bold text-slate-100 flex flex-wrap items-center justify-between gap-1">
                    <span className="flex items-center space-x-1.5 text-amber-300">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Título da Instrução *</span>
                    </span>
                    <span className="text-[11px] font-normal text-amber-400/90 font-masonic">
                      (Tema / Peça de Arquitetura ministrada)
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Instrução 01: O Desbaste da Pedra Bruta e os Primeiros Instrumentos..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
                  />
                </div>

                {/* GRAU MAÇÔNICO & MÓDULO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-200">Grau Maçônico Vinculado *</label>
                    <select
                      value={degreeNumber}
                      onChange={(e) => {
                        const deg = Number(e.target.value);
                        setDegreeNumber(deg);
                        const mod = modules.find((m) => m.degreeNumber === deg);
                        if (mod) setModuleId(mod.id);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-bold focus:outline-none focus:border-amber-400 text-xs"
                    >
                      {degrees.map((d) => (
                        <option key={d.id} value={d.degreeNumber}>
                          Grau 0{d.degreeNumber} ({d.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-200">Módulo Temático *</label>
                    <select
                      value={moduleId}
                      onChange={(e) => setModuleId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400 text-xs"
                    >
                      {modules
                        .filter((m) => m.degreeNumber === degreeNumber)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* ORDEM, TEMPO DE ESTUDO & STATUS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-200">Ordem na Matriz</label>
                    <input
                      type="number"
                      min={1}
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-200">Tempo Estimado (Minutos)</label>
                    <input
                      type="number"
                      min={1}
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-200">Status de Publicação</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold focus:outline-none focus:border-amber-400 text-xs"
                    >
                      <option value="published">Publicada (Disponível aos Irmãos)</option>
                      <option value="draft">Rascunho (Oculta)</option>
                    </select>
                  </div>
                </div>

                {/* RESUMO / EMENTA */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-200">Resumo / Ementa Pedagógica *</label>
                  <textarea
                    rows={2}
                    required
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Síntese dos ensinamentos que serão desenvolvidos nesta instrução..."
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400 text-xs placeholder:text-slate-500 leading-relaxed"
                  />
                </div>

                {/* TEXTO FILOSÓFICO INTEGRAL */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="font-bold text-slate-200">
                      Texto Filosófico Integral da Instrução *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Suporta Markdown: ### Títulos, **Negrito**, &gt; Citações
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Insira o texto completo da instrução..."
                    className="w-full p-3.5 font-mono text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400 leading-relaxed shadow-inner"
                  />
                </div>

                {/* MULTIMÍDIA: ÁUDIO & VÍDEO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-200">URL do Áudio / Podcast (Opcional)</label>
                    <input
                      type="url"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="https://exemplo.com/audio-instrucao.mp3"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400 text-xs placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-200">URL do Vídeo / YouTube / Vimeo (Opcional)</label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400 text-xs placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* UPLOADS & ANEXOS DA INSTRUÇÃO */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-300 font-masonic flex items-center space-x-2">
                      <Paperclip className="w-4 h-4 text-amber-400" />
                      <span>Anexos, Pranchas & Uploads da Instrução ({attachments.length})</span>
                    </label>
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all flex items-center space-x-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                      <span>{uploadingFile ? 'Carregando...' : 'Fazer Upload de Anexo'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
                        onChange={handleFileUploadAttachment}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {attachments.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                      Nenhum anexo adicionado a esta instrução. Clique em "Fazer Upload de Anexo" para anexar PDFs, pranchas ou apostilas.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-slate-200 truncate">{att.name}</p>
                              <p className="text-[10px] text-slate-400">{att.size || 'Anexo'} • {att.type || 'Documento'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            {att.url && att.url !== '#' && (
                              <a
                                href={att.url}
                                download={att.name}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="Baixar / Visualizar"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(idx)}
                              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition-colors"
                              title="Remover Anexo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PRANCHA DE TRABALHO & NOTA MÍNIMA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block font-bold text-slate-200">
                      Tema da Prancha de Arquitetura Exigida (Redação)
                    </label>
                    <textarea
                      rows={2}
                      value={essayPrompt}
                      onChange={(e) => setEssayPrompt(e.target.value)}
                      placeholder="Tema ou pergunta para o irmão dissertar em sua Prancha..."
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-200">Nota Mínima (%)</label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={minimumPassingGrade}
                      onChange={(e) => setMinimumPassingGrade(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[10px] text-slate-500 block">Padrão institucional: 70%</span>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex flex-wrap items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-800 shrink-0 bg-[#0d1017]">
                <button
                  type="button"
                  onClick={() => setIsEditingLesson(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs shadow-xl transition-all hover:scale-105 flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Salvar Instrução</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {isAddingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#111520] border border-amber-500/35 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-masonic text-amber-200">Novo Módulo</h3>
              </div>
              <button onClick={() => setIsAddingModule(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Título do Módulo *</label>
                <input
                  type="text"
                  required
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  placeholder="Ex: Simbolismo dos Instrumentos"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Grau Vinculado *</label>
                <select
                  value={modDegree}
                  onChange={(e) => setModDegree(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-bold"
                >
                  {degrees.map((d) => (
                    <option key={d.id} value={d.degreeNumber}>
                      Grau 0{d.degreeNumber} ({d.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={modDesc}
                  onChange={(e) => setModDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingModule(false)}
                  className="px-4 py-2 font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Criar Módulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Lesson */}
      {deletingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#121016] border border-rose-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
              <div className="flex items-center space-x-2.5 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold font-masonic text-rose-200">
                  Excluir Peça de Instrução
                </h3>
              </div>
              <button
                onClick={() => setDeletingLesson(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Tem certeza de que deseja excluir permanentemente a instrução:
              </p>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-medium text-amber-200 text-sm">
                "{deletingLesson.title}"
              </div>
              <p className="text-[11px] text-rose-300/80 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/30">
                ⚠️ <strong>Atenção:</strong> Esta ação removerá a instrução e desvinculará todas as questões avaliativas e registros de leitura associados.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingLesson(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteLesson}
                className="px-5 py-2 text-xs rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-950/50 flex items-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Instrução</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
