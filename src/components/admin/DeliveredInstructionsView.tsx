import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  Building2,
  UserCheck,
  Award,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Printer,
  FileText,
  Users,
  CheckCircle,
  Clock,
  MapPin,
  Shield,
  Layers,
  ChevronRight,
  Download,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { DeliveredInstruction } from '../../types';
import { FACULDADE_SEAL_IMG } from '../../assets/logo';

interface DeliveredInstructionsViewProps {
  onNavigate?: (view: string) => void;
}

export const DeliveredInstructionsView: React.FC<DeliveredInstructionsViewProps> = ({
  onNavigate,
}) => {
  const { userProfile, isAdmin, isInstructor } = useAuth();
  const [instructions, setInstructions] = useState<DeliveredInstruction[]>(() =>
    dataStore.getDeliveredInstructions()
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<'all' | 'by-lodge' | 'by-degree' | 'instructors' | 'new'>('all');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLodgeFilter, setSelectedLodgeFilter] = useState('all');
  const [selectedDegreeFilter, setSelectedDegreeFilter] = useState<number | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'concluida' | 'agendada'>('all');

  // Modal States
  const [selectedInstruction, setSelectedInstruction] = useState<DeliveredInstruction | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveredInstruction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State for New/Edit
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    lodgeName: userProfile?.lodge || 'ARLS Luz e Sabedoria nº 33',
    orientCity: 'Oriente de Belo Horizonte - MG',
    grandLodge: userProfile?.grandLodge || 'Grande Oriente Maçônico Universal (GOMAU)',
    instructorName: userProfile?.fullName || '',
    instructorRole: isInstructor ? 'Grande Inspetor Geral / Instrutor Docente' : '1º Vigilante',
    instructorCim: userProfile?.cimNumber || '',
    degreeNumber: 1,
    degreeName: 'Grau 01 • Aprendiz Maçom',
    sessionType: 'Sessão Magna de Instrução',
    attendeesCount: 20,
    summaryNotes: '',
    practicalExercises: '',
    attachmentsUrl: '',
    status: 'concluida' as 'concluida' | 'agendada',
  });

  const refreshList = () => {
    setInstructions(dataStore.getDeliveredInstructions());
  };

  // Distinct Lodges and Instructors for Filters
  const distinctLodges = useMemo(() => {
    const lodges = new Set<string>();
    instructions.forEach((i) => {
      if (i.lodgeName) lodges.add(i.lodgeName);
    });
    return Array.from(lodges).sort();
  }, [instructions]);

  const distinctInstructors = useMemo(() => {
    const instMap = new Map<string, { name: string; role: string; count: number; lodges: Set<string> }>();
    instructions.forEach((i) => {
      const existing = instMap.get(i.instructorName) || {
        name: i.instructorName,
        role: i.instructorRole,
        count: 0,
        lodges: new Set<string>(),
      };
      existing.count += 1;
      if (i.lodgeName) existing.lodges.add(i.lodgeName);
      instMap.set(i.instructorName, existing);
    });
    return Array.from(instMap.values()).sort((a, b) => b.count - a.count);
  }, [instructions]);

  // Filtered List
  const filteredInstructions = useMemo(() => {
    return instructions.filter((item) => {
      // Search query matches Title, Lodge, Instructor, or Role
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.lodgeName.toLowerCase().includes(q) ||
        item.instructorName.toLowerCase().includes(q) ||
        item.instructorRole.toLowerCase().includes(q) ||
        (item.orientCity && item.orientCity.toLowerCase().includes(q)) ||
        (item.summaryNotes && item.summaryNotes.toLowerCase().includes(q));

      // Lodge Filter
      const matchesLodge =
        selectedLodgeFilter === 'all' || item.lodgeName === selectedLodgeFilter;

      // Degree Filter
      const matchesDegree =
        selectedDegreeFilter === 'all' || item.degreeNumber === selectedDegreeFilter;

      // Status Filter
      const matchesStatus =
        selectedStatusFilter === 'all' || item.status === selectedStatusFilter;

      return matchesQuery && matchesLodge && matchesDegree && matchesStatus;
    });
  }, [instructions, searchQuery, selectedLodgeFilter, selectedDegreeFilter, selectedStatusFilter]);

  // Lodges Aggregation for "By Lodge" Tab
  const lodgeStats = useMemo(() => {
    const map = new Map<
      string,
      {
        lodgeName: string;
        orientCity?: string;
        grandLodge?: string;
        total: number;
        completed: number;
        scheduled: number;
        instructors: Set<string>;
        lastDate: string;
        instructions: DeliveredInstruction[];
      }
    >();

    instructions.forEach((item) => {
      const key = item.lodgeName || 'Loja Não Especificada';
      const existing = map.get(key) || {
        lodgeName: key,
        orientCity: item.orientCity,
        grandLodge: item.grandLodge,
        total: 0,
        completed: 0,
        scheduled: 0,
        instructors: new Set<string>(),
        lastDate: item.date,
        instructions: [],
      };

      existing.total += 1;
      if (item.status === 'concluida') existing.completed += 1;
      if (item.status === 'agendada') existing.scheduled += 1;
      existing.instructors.add(`${item.instructorName} (${item.instructorRole})`);
      if (new Date(item.date) > new Date(existing.lastDate)) {
        existing.lastDate = item.date;
      }
      existing.instructions.push(item);
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [instructions]);

  // Overall Stats
  const totalCompleted = instructions.filter((i) => i.status === 'concluida').length;
  const totalAttendees = instructions.reduce((acc, curr) => acc + (curr.attendeesCount || 0), 0);

  // Handle Open Create Form
  const handleOpenCreate = () => {
    setEditingItem(null);
    const defaultDeg = selectedDegreeFilter !== 'all' ? selectedDegreeFilter : 1;
    const defaultDegName =
      defaultDeg === 1
        ? 'Grau 01 • Aprendiz Maçom'
        : defaultDeg === 2
        ? 'Grau 02 • Companheiro Maçom'
        : 'Grau 03 • Mestre Maçom';

    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      lodgeName: userProfile?.lodge || 'ARLS Luz e Sabedoria nº 33',
      orientCity: 'Oriente de Belo Horizonte - MG',
      grandLodge: userProfile?.grandLodge || 'Grande Oriente Maçônico Universal (GOMAU)',
      instructorName: userProfile?.fullName || '',
      instructorRole: isInstructor ? 'Grande Inspetor Geral / Instrutor Docente' : '1º Vigilante',
      instructorCim: userProfile?.cimNumber || '',
      degreeNumber: defaultDeg,
      degreeName: defaultDegName,
      sessionType: defaultDeg === 2 ? 'Sessão Magna de Elevação e Instrução' : 'Sessão Magna de Instrução',
      attendeesCount: 24,
      summaryNotes: '',
      practicalExercises: '',
      status: 'concluida',
    });
    setIsEditingModalOpen(true);
  };

  // Handle Open Edit Form
  const handleOpenEdit = (item: DeliveredInstruction) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      date: item.date,
      lodgeName: item.lodgeName,
      orientCity: item.orientCity || '',
      grandLodge: item.grandLodge || '',
      instructorName: item.instructorName,
      instructorRole: item.instructorRole,
      instructorCim: item.instructorCim || '',
      degreeNumber: item.degreeNumber,
      degreeName: item.degreeName || `Grau 0${item.degreeNumber}`,
      sessionType: item.sessionType || 'Sessão Ordinária',
      attendeesCount: item.attendeesCount || 0,
      summaryNotes: item.summaryNotes || '',
      practicalExercises: item.practicalExercises || '',
      attachmentsUrl: item.attachmentsUrl || '',
      status: item.status,
    });
    setIsEditingModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.lodgeName || !formData.instructorName || !formData.instructorRole) {
      alert('Por favor, preencha todos os campos obrigatórios: Título, Data, Nome da Loja, Nome do Aplicador e Cargo.');
      return;
    }

    const degName =
      formData.degreeNumber === 1
        ? 'Grau 01 • Aprendiz Maçom'
        : formData.degreeNumber === 2
        ? 'Grau 02 • Companheiro Maçom'
        : formData.degreeNumber === 3
        ? 'Grau 03 • Mestre Maçom'
        : `Grau 0${formData.degreeNumber}`;

    if (editingItem) {
      dataStore.updateDeliveredInstruction(editingItem.id, {
        ...formData,
        degreeName: degName,
      });
      setSuccessMessage('Instrução ministrada atualizada com sucesso no Livro de Atas!');
    } else {
      dataStore.createDeliveredInstruction({
        ...formData,
        degreeName: degName,
        registeredById: userProfile?.id,
        registeredByName: userProfile?.fullName,
      });
      setSuccessMessage('Nova instrução ministrada registrada com sucesso!');
    }

    refreshList();
    setIsEditingModalOpen(false);
    setEditingItem(null);

    // If saving from inline new tab, redirect to list so the saved instruction is immediately visible
    if (activeTab === 'new') {
      setActiveTab('all');
    }
    // If degree filter is active and different from saved degree, update to the saved degree
    if (selectedDegreeFilter !== 'all' && selectedDegreeFilter !== formData.degreeNumber) {
      setSelectedDegreeFilter(formData.degreeNumber);
    }

    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    dataStore.deleteDeliveredInstruction(id);
    refreshList();
    setDeleteConfirmId(null);
    if (selectedInstruction?.id === id) {
      setSelectedInstruction(null);
    }
    setSuccessMessage('Registro de instrução excluído com sucesso.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#121622] via-[#0d1017] to-[#080a0f] border border-amber-500/30 shadow-2xl overflow-hidden">
        {/* Background Emblem */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none pr-6">
          <img
            src={FACULDADE_SEAL_IMG}
            alt="Selo Faculdade Maçônica"
            className="w-80 h-80 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-amber-400 font-masonic">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Faculdade Maçônica Universal • GOMAU</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-masonic text-slate-100 gold-gradient-text">
                Controle de Instruções Ministradas
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Registro histórico e doutrinário das instruções aplicadas nas Lojas Maçônicas, com detalhes de
                título da instrução, data de aplicação, loja receptora e o nome e cargo de quem aplicou.
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs shadow-md transition-all flex items-center space-x-2 no-print"
                title="Imprimir Relatório de Instruções"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Imprimir Relatório</span>
              </button>

              <button
                type="button"
                id="btn-register-new-instruction"
                onClick={handleOpenCreate}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs shadow-xl transition-all hover:scale-105 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Registrar Nova Instrução</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-amber-500/20 shadow-inner flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-masonic">
                  Total de Instruções
                </span>
                <span className="text-xl font-black text-amber-300 font-masonic">{instructions.length}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-amber-500/20 shadow-inner flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-masonic">
                  Lojas Atendidas
                </span>
                <span className="text-xl font-black text-blue-300 font-masonic">{distinctLodges.length}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-amber-500/20 shadow-inner flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-masonic">
                  Instrutores & Oficiais
                </span>
                <span className="text-xl font-black text-emerald-300 font-masonic">{distinctInstructors.length}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-amber-500/20 shadow-inner flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-masonic">
                  Irmãos Instruídos
                </span>
                <span className="text-xl font-black text-purple-300 font-masonic">{totalAttendees}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-amber-500/20 pb-2 gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-masonic transition-all flex items-center space-x-2 ${
              activeTab === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Todas as Instruções ({instructions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('by-lodge')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-masonic transition-all flex items-center space-x-2 ${
              activeTab === 'by-lodge'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Por Loja Maçônica ({distinctLodges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('by-degree')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-masonic transition-all flex items-center space-x-2 ${
              activeTab === 'by-degree'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Por Grau Simbólico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instructors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-masonic transition-all flex items-center space-x-2 ${
              activeTab === 'instructors'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Quadro de Instrutores ({distinctInstructors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleOpenCreate();
              setActiveTab('new');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-masonic transition-all flex items-center space-x-2 ${
              activeTab === 'new'
                ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/30 text-amber-300 border border-amber-500/60 shadow-sm'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Registrar Instrução (Formulário)</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Exibindo <strong>{filteredInstructions.length}</strong> de {instructions.length} registros
        </div>
      </div>

      {/* TAB 1: ALL INSTRUCTIONS WITH SEARCH & FILTERS */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-[#0d1017] border border-amber-500/20 shadow-md space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por título, loja, aplicador, cargo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
                />
              </div>

              {/* Lodge Filter */}
              <div>
                <select
                  value={selectedLodgeFilter}
                  onChange={(e) => setSelectedLodgeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                >
                  <option value="all">Todas as Lojas ({distinctLodges.length})</option>
                  {distinctLodges.map((lodge) => (
                    <option key={lodge} value={lodge}>
                      {lodge}
                    </option>
                  ))}
                </select>
              </div>

              {/* Degree Filter */}
              <div>
                <select
                  value={selectedDegreeFilter}
                  onChange={(e) =>
                    setSelectedDegreeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                >
                  <option value="all">Todos os Graus</option>
                  <option value={1}>Grau 01 • Aprendiz Maçom</option>
                  <option value={2}>Grau 02 • Companheiro Maçom</option>
                  <option value={3}>Grau 03 • Mestre Maçom</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                >
                  <option value="all">Todos os Status</option>
                  <option value="concluida">Concluída (Realizada)</option>
                  <option value="agendada">Agendada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Instructions Table / Cards */}
          {filteredInstructions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0d1017] border border-slate-800 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300 font-masonic">Nenhuma instrução encontrada</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não foram localizadas instruções com os filtros selecionados. Tente ajustar os termos de busca ou registre uma nova instrução.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Nova Instrução</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-amber-500/20 bg-[#0d1017] shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-amber-500/20 bg-slate-900/80 text-amber-400 font-masonic uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Título da Instrução & Grau</th>
                    <th className="py-3.5 px-4">Data de Aplicação</th>
                    <th className="py-3.5 px-4">Nome da Loja Receptora</th>
                    <th className="py-3.5 px-4">Nome e Cargo de Quem Aplicou</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredInstructions.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-900/50 transition-colors group"
                    >
                      {/* TÍTULO DA INSTRUÇÃO */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-sm">
                          <div className="font-bold text-slate-100 text-xs sm:text-sm group-hover:text-amber-300 transition-colors flex items-start space-x-1.5">
                            <BookOpen className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>{item.title}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span
                              className={`px-2 py-0.5 rounded font-bold font-masonic ${
                                item.degreeNumber === 1
                                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                                  : item.degreeNumber === 2
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {item.degreeName || `Grau 0${item.degreeNumber}`}
                            </span>
                            {item.sessionType && (
                              <span className="text-slate-400 font-mono">
                                • {item.sessionType}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* DATA DE APLICAÇÃO */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-slate-200">
                          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <div className="font-bold font-mono">
                              {new Date(item.date + 'T12:00:00Z').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(item.date + 'T12:00:00Z').toLocaleDateString('pt-BR', {
                                weekday: 'short',
                              })}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* NOME DA LOJA QUE FOI APLICADA */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate">{item.lodgeName}</span>
                          </div>
                          {item.orientCity && (
                            <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{item.orientCity}</span>
                            </div>
                          )}
                          {item.grandLodge && (
                            <div className="text-[9px] text-amber-400/80 font-masonic uppercase">
                              {item.grandLodge}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* NOME E CARGO DE QUEM APLICOU */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-bold text-amber-200 flex items-center space-x-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{item.instructorName}</span>
                          </div>
                          <div className="inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-semibold text-slate-300">
                            {item.instructorRole}
                          </div>
                          {item.instructorCim && (
                            <div className="text-[9px] font-mono text-slate-400">
                              CIM: {item.instructorCim}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'concluida'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {item.status === 'concluida' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Realizada</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Agendada</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* AÇÕES */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInstruction(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all"
                            title="Ver Ata e Ficha da Instrução"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-slate-800 transition-all"
                            title="Editar Registro"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {deleteConfirmId === item.id ? (
                            <div className="flex items-center space-x-1 bg-red-950/80 border border-red-500 p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold"
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1 text-slate-400 text-[10px]"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
                              title="Excluir Registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POR LOJA MAÇÔNICA */}
      {activeTab === 'by-lodge' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lodgeStats.map((lodge) => (
            <div
              key={lodge.lodgeName}
              className="p-5 rounded-2xl bg-[#0d1017] border border-amber-500/20 shadow-xl space-y-4 hover:border-amber-500/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-masonic font-bold text-amber-400 uppercase tracking-widest block">
                    Oficina Regular
                  </span>
                  <h3 className="text-base font-black text-slate-100 font-masonic">{lodge.lodgeName}</h3>
                  {lodge.orientCity && (
                    <div className="text-xs text-slate-400 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{lodge.orientCity}</span>
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total Instruções</span>
                  <span className="text-base font-bold text-amber-300 font-masonic">{lodge.total}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Última Aplicação</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {new Date(lodge.lastDate + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Instructors who delivered in this lodge */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-masonic block">
                  Aplicadores / Oficiais Registrados:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(lodge.instructors).map((inst) => (
                    <span
                      key={inst}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-amber-200 font-semibold"
                    >
                      {inst}
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructions list inside this lodge */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-500/80 font-masonic block">
                  Instruções Ministradas nesta Loja:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {lodge.instructions.map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => setSelectedInstruction(inst)}
                      className="w-full text-left p-2 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-xs transition-all flex items-center justify-between group"
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold text-slate-200 group-hover:text-amber-300 truncate">
                          {inst.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(inst.date + 'T12:00:00Z').toLocaleDateString('pt-BR')} • {inst.instructorName}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: POR GRAU SIMBÓLICO */}
      {activeTab === 'by-degree' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((deg) => {
            const degTitle =
              deg === 1
                ? 'Grau 01 • Aprendiz Maçom'
                : deg === 2
                ? 'Grau 02 • Companheiro Maçom'
                : 'Grau 03 • Mestre Maçom';
            const degColor =
              deg === 1 ? 'border-blue-500/30' : deg === 2 ? 'border-emerald-500/30' : 'border-amber-500/30';
            const degBadge =
              deg === 1
                ? 'bg-blue-500/20 text-blue-300'
                : deg === 2
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/20 text-amber-300';
            const degInstructions = instructions.filter((i) => i.degreeNumber === deg);

            return (
              <div
                key={deg}
                className={`p-5 rounded-2xl bg-[#0d1017] border ${degColor} shadow-xl space-y-4`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-masonic ${degBadge}`}>
                      {degTitle}
                    </span>
                    <p className="text-[11px] text-slate-400 pt-1">
                      {degInstructions.length} instruções registradas
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {degInstructions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Nenhuma instrução cadastrada para este grau.
                    </div>
                  ) : (
                    degInstructions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedInstruction(item)}
                        className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs space-y-1.5 cursor-pointer transition-all hover:border-amber-500/40"
                      >
                        <div className="font-bold text-slate-100 hover:text-amber-300">{item.title}</div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span className="font-mono">
                            📅 {new Date(item.date + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-amber-300 font-semibold truncate max-w-[140px]">
                            🏛️ {item.lodgeName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 pt-0.5 border-t border-slate-800/80 flex items-center justify-between">
                          <span>{item.instructorName}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{item.instructorRole}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: QUADRO DE INSTRUTORES & OFICIAIS */}
      {activeTab === 'instructors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {distinctInstructors.map((inst) => (
            <div
              key={inst.name}
              className="p-5 rounded-2xl bg-[#0d1017] border border-amber-500/20 shadow-xl space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-masonic font-bold text-lg">
                  {inst.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{inst.name}</h3>
                  <p className="text-xs text-amber-400 font-semibold">{inst.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Instruções Aplicadas</span>
                  <span className="text-base font-bold text-amber-300 font-masonic">{inst.count}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Lojas Atendidas</span>
                  <span className="text-base font-bold text-blue-300 font-masonic">{inst.lodges.size}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-masonic block">
                  Lojas Visitadas:
                </span>
                <div className="flex flex-wrap gap-1">
                  {Array.from(inst.lodges).map((lodge) => (
                    <span
                      key={lodge}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300"
                    >
                      {lodge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: FORMULÁRIO DE REGISTRO DIRETO NA PÁGINA */}
      {activeTab === 'new' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0d1017] border-2 border-amber-500/40 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-amber-400 font-masonic text-xs font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Livro de Atas de Instrução Doutrinária</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-masonic text-slate-100 gold-gradient-text">
                {editingItem ? 'Editar Instrução Ministrada' : 'Registrar Nova Instrução Ministrada'}
              </h2>
              <p className="text-xs text-slate-400">
                Preencha todos os dados da instrução maçônica aplicada em Loja. Todos os registros ficam salvos no histórico oficial.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              ← Voltar para Lista
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* TÍTULO DA INSTRUÇÃO - PROMINENT & FULL WIDTH */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 shadow-inner">
              <label className="text-xs sm:text-sm font-bold text-slate-100 flex flex-wrap items-center justify-between gap-1">
                <span className="flex items-center space-x-1.5 text-amber-300">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Título da Instrução *</span>
                </span>
                <span className="text-[11px] font-normal text-amber-400/90 font-masonic">
                  (Tema / Peça de Arquitetura ministrada em Loja)
                </span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Os Instrumentos do Aprendiz: O Maço e o Cinzel no Desbaste da Pedra Bruta"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400 text-xs sm:text-sm placeholder:text-slate-500 font-medium shadow-inner focus:ring-1 focus:ring-amber-400 transition-all"
              />
            </div>

            {/* DATA DE APLICAÇÃO & GRAU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Data de Aplicação em Loja *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Grau Simbólico da Instrução *</label>
                <select
                  value={formData.degreeNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, degreeNumber: Number(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold focus:outline-none focus:border-amber-500 text-xs"
                >
                  <option value={1}>Grau 01 • Aprendiz Maçom</option>
                  <option value={2}>Grau 02 • Companheiro Maçom</option>
                  <option value={3}>Grau 03 • Mestre Maçom</option>
                </select>
              </div>
            </div>

            {/* NOME DA LOJA QUE FOI APLICADA & ORIENTE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Nome da Loja que foi Aplicada *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ARLS Luz e Sabedoria nº 33"
                  value={formData.lodgeName}
                  onChange={(e) => setFormData({ ...formData, lodgeName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Oriente / Cidade & Estado</label>
                <input
                  type="text"
                  placeholder="Ex: Oriente de Belo Horizonte - MG"
                  value={formData.orientCity}
                  onChange={(e) => setFormData({ ...formData, orientCity: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* NOME E CARGO DE QUEM APLICOU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Nome de Quem Aplicou (Instrutor / Irmão) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ir. Janderson Camargos"
                  value={formData.instructorName}
                  onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Cargo de Quem Aplicou *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Grande Inspetor Geral / Instrutor Docente, 1º Vigilante, 2º Vigilante, Venerável Mestre..."
                  value={formData.instructorRole}
                  onChange={(e) => setFormData({ ...formData, instructorRole: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* CIM, TIPO DE SESSÃO & QUÓRUM */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">CIM do Aplicador</label>
                <input
                  type="text"
                  placeholder="Ex: CIM-102938"
                  value={formData.instructorCim}
                  onChange={(e) => setFormData({ ...formData, instructorCim: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Tipo de Sessão Realizada</label>
                <input
                  type="text"
                  placeholder="Ex: Sessão Magna de Instrução"
                  value={formData.sessionType}
                  onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Irmãos Presentes (Quórum)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.attendeesCount}
                  onChange={(e) =>
                    setFormData({ ...formData, attendeesCount: Number(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>
            </div>

            {/* RESUMO & PAUTA */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-200">Resumo da Instrução / Pontos Doutrinários Abordados</label>
              <textarea
                rows={3}
                placeholder="Descreva os conceitos maçônicos, pranchas lidas, referências ritualísticas e conclusões do debate..."
                value={formData.summaryNotes}
                onChange={(e) => setFormData({ ...formData, summaryNotes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
              />
            </div>

            {/* DINÂMICA OU PRÁTICA */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-200">Trabalho Prático / Dinâmica Realizada em Templo</label>
              <input
                type="text"
                placeholder="Ex: Treinamento ritualístico de passos e toques, leitura no átrio, exegese dos símbolos..."
                value={formData.practicalExercises}
                onChange={(e) => setFormData({ ...formData, practicalExercises: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
              />
            </div>

            {/* STATUS */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <label className="font-bold text-slate-200 block">Status da Instrução</label>
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status_tab"
                    value="concluida"
                    checked={formData.status === 'concluida'}
                    onChange={() => setFormData({ ...formData, status: 'concluida' })}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-slate-200 font-semibold">Concluída (Realizada no Templo)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status_tab"
                    value="agendada"
                    checked={formData.status === 'agendada'}
                    onChange={() => setFormData({ ...formData, status: 'agendada' })}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-slate-200 font-semibold">Agendada / Programada</span>
                </label>
              </div>
            </div>

            {/* Form Footer Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancelar e Voltar
              </button>
              <button
                type="submit"
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs shadow-xl hover:scale-105 transition-all flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4 text-slate-950" />
                <span>{editingItem ? 'Salvar Alterações' : 'Confirmar e Registrar Instrução'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: FICHA / ATA DA INSTRUÇÃO MINISTRADA */}
      {selectedInstruction && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0e121a] border-2 border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-6 shrink-0 bg-[#0d1017]">
              <div className="flex items-center space-x-2 text-amber-400 font-masonic text-xs font-bold uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>Ata Oficial de Instrução Ministrada</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 flex items-center space-x-1 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInstruction(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Solene Parchment Look) with smooth internal scroll */}
            <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-6">
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#121624] to-[#090c12] border border-amber-500/40 text-center space-y-6 shadow-inner relative">
                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-md mx-auto">
                  <img
                    src={FACULDADE_SEAL_IMG}
                    alt="Brasão Faculdade Maçônica"
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-400 font-masonic">
                    A.·. G.·. D.·. G.·. A.·. D.·. U.·.
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-masonic text-slate-100 gold-gradient-text uppercase">
                    FACULDADE MAÇÔNICA UNIVERSAL
                  </h2>
                  <div className="text-xs font-bold uppercase tracking-widest text-amber-200/90 font-masonic">
                    {selectedInstruction.grandLodge || 'GRANDE ORIENTE MAÇÔNICO UNIVERSAL — GOMAU'}
                  </div>
                </div>

                <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />

                {/* Title & Degree */}
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black font-masonic bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block">
                    {selectedInstruction.degreeName || `Grau 0${selectedInstruction.degreeNumber}`}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold font-masonic text-slate-100">
                    {selectedInstruction.title}
                  </h3>
                </div>

                {/* Core Information Grid (Highlighting Required Fields) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      🏛️ Nome da Loja que foi aplicada:
                    </span>
                    <span className="text-sm font-black text-amber-300 font-masonic block">
                      {selectedInstruction.lodgeName}
                    </span>
                    {selectedInstruction.orientCity && (
                      <span className="text-slate-400 block pt-0.5">{selectedInstruction.orientCity}</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      📅 Data de Aplicação:
                    </span>
                    <span className="text-sm font-black text-slate-100 font-mono block">
                      {new Date(selectedInstruction.date + 'T12:00:00Z').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-slate-400 block pt-0.5">{selectedInstruction.sessionType}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      👤 Nome de Quem Aplicou:
                    </span>
                    <span className="text-sm font-black text-amber-200 font-masonic block">
                      {selectedInstruction.instructorName}
                    </span>
                    {selectedInstruction.instructorCim && (
                      <span className="text-slate-400 font-mono text-[10px] block">
                        CIM: {selectedInstruction.instructorCim}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      ⚖️ Cargo de Quem Aplicou:
                    </span>
                    <span className="text-sm font-black text-blue-300 font-masonic block">
                      {selectedInstruction.instructorRole}
                    </span>
                    {selectedInstruction.attendeesCount ? (
                      <span className="text-slate-400 text-[10px] block pt-0.5">
                        Irmãos Presentes / Quórum: {selectedInstruction.attendeesCount}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Summary Notes & Content */}
                {selectedInstruction.summaryNotes && (
                  <div className="text-left p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-masonic block">
                      Resumo e Pauta da Instrução Doutrinária:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{selectedInstruction.summaryNotes}"
                    </p>
                  </div>
                )}

                {selectedInstruction.practicalExercises && (
                  <div className="text-left p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-masonic block">
                      Trabalhos Práticos / Dinâmica em Templo:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedInstruction.practicalExercises}
                    </p>
                  </div>
                )}

                {/* Signature Block */}
                <div className="pt-6 grid grid-cols-2 gap-6 items-end text-center">
                  <div className="space-y-1">
                    <div className="font-serif italic text-blue-300 text-sm font-bold select-none">
                      {selectedInstruction.instructorName} .·.
                    </div>
                    <div className="w-36 h-0.5 bg-slate-600 mx-auto" />
                    <div className="text-xs font-bold text-slate-200 font-masonic">
                      {selectedInstruction.instructorName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">
                      {selectedInstruction.instructorRole}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-serif italic text-amber-300 text-sm font-bold select-none">
                      Darlan Martins .·.
                    </div>
                    <div className="w-36 h-0.5 bg-slate-600 mx-auto" />
                    <div className="text-xs font-bold text-slate-200 font-masonic">
                      S.·. G.·. M.·. Darlan Martins
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">
                      Soberano Grão-Mestre / Chanceler
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FORMULÁRIO DE REGISTRO / EDIÇÃO */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/90 backdrop-blur-md p-3 sm:p-5 md:p-6 flex items-center justify-center animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0e121a] border-2 border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-6 shrink-0 bg-[#0d1017]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 font-masonic">
                    Livro de Atas & Instruções
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-masonic text-slate-100">
                    {editingItem ? 'Editar Instrução Ministrada' : 'Registrar Nova Instrução Ministrada'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form with internal scroll */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden text-xs">
              <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
                {/* TÍTULO DA INSTRUÇÃO - PROMINENT & FULL WIDTH */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 shadow-inner">
                  <label className="text-xs sm:text-sm font-bold text-slate-100 flex flex-wrap items-center justify-between gap-1">
                    <span className="flex items-center space-x-1.5 text-amber-300">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Título da Instrução *</span>
                    </span>
                    <span className="text-[11px] font-normal text-amber-400/90 font-masonic">
                      (Tema abordado em Loja / Peça Ministrada)
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Os Instrumentos do Aprendiz: O Maço e o Cinzel no Desbaste da Pedra Bruta"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400 text-xs sm:text-sm placeholder:text-slate-500 font-medium shadow-inner focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>

                {/* DATA DE APLICAÇÃO & GRAU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-200">Data de Aplicação em Loja *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-200">Grau Simbólico da Instrução *</label>
                    <select
                      value={formData.degreeNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, degreeNumber: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold focus:outline-none focus:border-amber-400 text-xs"
                    >
                      <option value={1}>Grau 01 • Aprendiz Maçom</option>
                      <option value={2}>Grau 02 • Companheiro Maçom</option>
                      <option value={3}>Grau 03 • Mestre Maçom</option>
                    </select>
                  </div>
                </div>

                {/* NOME DA LOJA QUE FOI APLICADA & ORIENTE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">Nome da Loja que foi Aplicada *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: ARLS Luz e Sabedoria nº 33"
                      value={formData.lodgeName}
                      onChange={(e) => setFormData({ ...formData, lodgeName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">Oriente / Cidade</label>
                    <input
                      type="text"
                      placeholder="Ex: Oriente de Belo Horizonte - MG"
                      value={formData.orientCity}
                      onChange={(e) => setFormData({ ...formData, orientCity: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* NOME E CARGO DE QUEM APLICOU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">Nome de Quem Aplicou *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ir. Janderson Camargos"
                      value={formData.instructorName}
                      onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">Cargo de Quem Aplicou *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Grande Inspetor Geral / Instrutor Docente, 1º Vigilante, 2º Vigilante, Venerável Mestre..."
                      value={formData.instructorRole}
                      onChange={(e) => setFormData({ ...formData, instructorRole: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* CIM, TIPO DE SESSÃO & QUÓRUM */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">CIM do Aplicador</label>
                    <input
                      type="text"
                      placeholder="Ex: CIM-102938"
                      value={formData.instructorCim}
                      onChange={(e) => setFormData({ ...formData, instructorCim: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">Tipo de Sessão</label>
                    <input
                      type="text"
                      placeholder="Ex: Sessão Magna de Instrução"
                      value={formData.sessionType}
                      onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-200">Irmãos Presentes</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.attendeesCount}
                      onChange={(e) =>
                        setFormData({ ...formData, attendeesCount: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>

                {/* RESUMO & PAUTA */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Resumo da Instrução / Pontos Abordados</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva os conceitos maçônicos, pranchas lidas e conclusões do debate..."
                    value={formData.summaryNotes}
                    onChange={(e) => setFormData({ ...formData, summaryNotes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
                  />
                </div>

                {/* DINÂMICA OU PRÁTICA */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Trabalho Prático / Dinâmica Realizada</label>
                  <input
                    type="text"
                    placeholder="Ex: Treinamento ritualístico de passos e toques, leitura no átrio..."
                    value={formData.practicalExercises}
                    onChange={(e) => setFormData({ ...formData, practicalExercises: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs placeholder:text-slate-500"
                  />
                </div>

                {/* STATUS */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">Status da Instrução</label>
                  <div className="flex items-center space-x-4 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="concluida"
                        checked={formData.status === 'concluida'}
                        onChange={() => setFormData({ ...formData, status: 'concluida' })}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-slate-200">Concluída (Realizada)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="agendada"
                        checked={formData.status === 'agendada'}
                        onChange={() => setFormData({ ...formData, status: 'agendada' })}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-slate-200">Agendada / Programada</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-slate-800 shrink-0 bg-[#0a0d13]">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic shadow-lg hover:scale-105 transition-all"
                >
                  {editingItem ? 'Salvar Alterações' : 'Confirmar e Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
