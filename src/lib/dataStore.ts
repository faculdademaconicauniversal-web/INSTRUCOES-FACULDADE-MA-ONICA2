import {
  Degree,
  Module,
  Lesson,
  Question,
  QuizQuestion,
  QuizAttempt,
  Submission,
  AppNotification,
  Certificate,
  AuditLog,
  AppSetting,
  UserProfile,
  UserRole,
  UserStatus,
  MemberAuthorization,
  SalaryIncreaseRequest,
  SalaryRequestStatus,
  DeliveredInstruction,
  SupportMaterial,
} from '../types';
import {
  INITIAL_DEGREES,
  INITIAL_MODULES,
  INITIAL_LESSONS,
  INITIAL_QUESTIONS,
  INITIAL_SETTINGS,
  DEMO_PROFILES,
  INITIAL_DELIVERED_INSTRUCTIONS,
  INITIAL_SUPPORT_MATERIALS,
} from './seedData';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) cleaned[key] = cleanForFirestore(value);
    }
    return cleaned;
  }
  return obj;
}

function syncDocToCloud(collectionName: string, id: string, data: any) {
  try {
    setDoc(doc(db, collectionName, id), cleanForFirestore(data)).catch((err) => {
      console.warn(`[Firestore Realtime Sync Notice] ${collectionName}/${id}:`, err?.message || err);
    });
  } catch (e) {
    // Ignore offline errors
  }
}

function deleteDocFromCloud(collectionName: string, id: string) {
  try {
    deleteDoc(doc(db, collectionName, id)).catch((err) => {
      console.warn(`[Firestore Realtime Delete Notice] ${collectionName}/${id}:`, err?.message || err);
    });
  } catch (e) {
    // Ignore offline errors
  }
}

class DataStore {
  private degrees: Degree[] = [];
  private modules: Module[] = [];
  private lessons: Lesson[] = [];
  private questions: Question[] = [];
  private quizAttempts: QuizAttempt[] = [];
  private submissions: Submission[] = [];
  private notifications: AppNotification[] = [];
  private certificates: Certificate[] = [];
  private auditLogs: AuditLog[] = [];
  private salaryRequests: SalaryIncreaseRequest[] = [];
  private authorizations: MemberAuthorization[] = [];
  private deliveredInstructions: DeliveredInstruction[] = [];
  private supportMaterials: SupportMaterial[] = [];
  private settings: AppSetting = {
    ...INITIAL_SETTINGS,
    grandLodgeAffiliation: 'Grande Oriente / Grandes Lojas Regulares',
    allowRegistration: true,
    autoApproveUsers: false,
    enableEmailAlerts: true,
  };
  private users: UserProfile[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notifyListeners() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error('Error notifying dataStore listener:', e);
      }
    });
  }

  public syncFromCloud(data: {
    degrees?: Degree[];
    modules?: Module[];
    lessons?: Lesson[];
    deliveredInstructions?: DeliveredInstruction[];
    supportMaterials?: SupportMaterial[];
    questions?: Question[];
    settings?: AppSetting;
    users?: UserProfile[];
    authorizations?: MemberAuthorization[];
  }) {
    if (data.degrees && data.degrees.length > 0) {
      this.degrees = data.degrees;
    }
    if (data.modules && data.modules.length > 0) {
      this.modules = data.modules;
    }
    if (data.lessons && data.lessons.length > 0) {
      const lessonsMap = new Map<string, Lesson>();
      INITIAL_LESSONS.forEach((l) => lessonsMap.set(l.id, l));
      this.lessons.forEach((l) => lessonsMap.set(l.id, l));
      data.lessons.forEach((l) => lessonsMap.set(l.id, l));
      this.lessons = Array.from(lessonsMap.values());
    }
    if (data.deliveredInstructions && data.deliveredInstructions.length > 0) {
      const deliveredMap = new Map<string, DeliveredInstruction>();
      INITIAL_DELIVERED_INSTRUCTIONS.forEach((d) => deliveredMap.set(d.id, d));
      this.deliveredInstructions.forEach((d) => deliveredMap.set(d.id, d));
      data.deliveredInstructions.forEach((d) => deliveredMap.set(d.id, d));
      this.deliveredInstructions = Array.from(deliveredMap.values());
    }
    if (data.supportMaterials && data.supportMaterials.length > 0) {
      const materialsMap = new Map<string, SupportMaterial>();
      INITIAL_SUPPORT_MATERIALS.forEach((m) => materialsMap.set(m.id, m));
      this.supportMaterials.forEach((m) => materialsMap.set(m.id, m));
      data.supportMaterials.forEach((m) => materialsMap.set(m.id, m));
      this.supportMaterials = Array.from(materialsMap.values());
    }
    if (data.questions && data.questions.length > 0) {
      const questionsMap = new Map<string, Question>();
      INITIAL_QUESTIONS.forEach((q) => questionsMap.set(q.id, q));
      this.questions.forEach((q) => questionsMap.set(q.id, q));
      data.questions.forEach((q) => questionsMap.set(q.id, q));
      this.questions = Array.from(questionsMap.values());
    }
    if (data.settings) {
      this.settings = { ...this.settings, ...data.settings };
    }
    if (data.users && data.users.length > 0) {
      const usersMap = new Map<string, UserProfile>();
      this.users.forEach((u) => usersMap.set(u.id, u));
      data.users.forEach((u) => usersMap.set(u.id, u));
      this.users = Array.from(usersMap.values());
    }
    if (data.authorizations && data.authorizations.length > 0) {
      const authMap = new Map<string, MemberAuthorization>();
      this.authorizations.forEach((a) => authMap.set(a.id, a));
      data.authorizations.forEach((a) => authMap.set(a.id, a));
      this.authorizations = Array.from(authMap.values());
    }
    this.saveState();
  }

  private loadState() {
    try {
      const storedDegrees = localStorage.getItem('fm_degrees');
      let loadedDegrees: Degree[] = storedDegrees ? JSON.parse(storedDegrees) : [...INITIAL_DEGREES];
      // Strictly maintain only the 3 Symbolic Degrees (Grau 1, Grau 2, Grau 3)
      this.degrees = loadedDegrees.filter((d) => d.degreeNumber <= 3 && d.id !== 'grau_4');
      if (this.degrees.length === 0) {
        this.degrees = [...INITIAL_DEGREES];
      }

      const storedModules = localStorage.getItem('fm_modules');
      this.modules = storedModules ? JSON.parse(storedModules) : [...INITIAL_MODULES];

      const storedLessons = localStorage.getItem('fm_lessons');
      let loadedLessons: Lesson[] = storedLessons ? JSON.parse(storedLessons) : [];
      const lessonsMap = new Map<string, Lesson>();
      INITIAL_LESSONS.forEach((l) => lessonsMap.set(l.id, l));
      loadedLessons.forEach((l) => lessonsMap.set(l.id, l));
      this.lessons = Array.from(lessonsMap.values());

      const storedQuestions = localStorage.getItem('fm_questions');
      let loadedQuestions: Question[] = storedQuestions ? JSON.parse(storedQuestions) : [];

      if (!loadedQuestions || loadedQuestions.length < INITIAL_QUESTIONS.length) {
        const questionsMap = new Map<string, Question>();
        INITIAL_QUESTIONS.forEach((q) => {
          questionsMap.set(q.id, {
            ...q,
            question: q.question || q.prompt || '',
            prompt: q.prompt || q.question || '',
          });
        });
        loadedQuestions.forEach((q) => {
          questionsMap.set(q.id, {
            ...q,
            question: q.question || q.prompt || '',
            prompt: q.prompt || q.question || '',
          });
        });
        this.questions = Array.from(questionsMap.values());
      } else {
        this.questions = loadedQuestions.map((q) => ({
          ...q,
          question: q.question || q.prompt || '',
          prompt: q.prompt || q.question || '',
        }));
      }

      const storedAttempts = localStorage.getItem('fm_quiz_attempts');
      this.quizAttempts = storedAttempts ? JSON.parse(storedAttempts) : this.getInitialAttempts();

      const storedSubmissions = localStorage.getItem('fm_submissions');
      this.submissions = storedSubmissions ? JSON.parse(storedSubmissions) : this.getInitialSubmissions();

      const storedNotifications = localStorage.getItem('fm_notifications');
      this.notifications = storedNotifications ? JSON.parse(storedNotifications) : this.getInitialNotifications();

      const storedCertificates = localStorage.getItem('fm_certificates');
      const loadedCerts: Certificate[] = storedCertificates ? JSON.parse(storedCertificates) : this.getInitialCertificates();
      this.certificates = loadedCerts.map((c) => ({
        ...c,
        grandMasterName: "S.'.G.'.M.'. DARLAN MARTINS",
        grandMasterRole: 'Soberano Grão-Mestre',
        inspectorName: 'GRANDE INSPETOR GERAL / INSTRUTOR JANDERSON CAMARGOS',
        inspectorRole: 'Grande Inspetor Geral / Instrutor Docente',
      }));

      const storedLogs = localStorage.getItem('fm_audit_logs');
      this.auditLogs = storedLogs ? JSON.parse(storedLogs) : this.getInitialLogs();

      const storedSalaryReqs = localStorage.getItem('fm_salary_requests');
      this.salaryRequests = storedSalaryReqs ? JSON.parse(storedSalaryReqs) : [];

      const storedAuths = localStorage.getItem('fm_authorizations');
      let loadedAuths: MemberAuthorization[] = storedAuths ? JSON.parse(storedAuths) : [];
      const authMap = new Map<string, MemberAuthorization>();
      this.getInitialAuthorizations().forEach((a) => authMap.set(a.id, a));
      loadedAuths.forEach((a) => authMap.set(a.id, a));
      this.authorizations = Array.from(authMap.values());

      const storedDelivered = localStorage.getItem('fm_delivered_instructions');
      let loadedDelivered: DeliveredInstruction[] = storedDelivered ? JSON.parse(storedDelivered) : [];
      const deliveredMap = new Map<string, DeliveredInstruction>();
      INITIAL_DELIVERED_INSTRUCTIONS.forEach((d) => deliveredMap.set(d.id, d));
      loadedDelivered.forEach((d) => deliveredMap.set(d.id, d));
      this.deliveredInstructions = Array.from(deliveredMap.values());

      const storedMaterials = localStorage.getItem('fm_support_materials');
      let loadedMaterials: SupportMaterial[] = storedMaterials ? JSON.parse(storedMaterials) : [];
      const materialsMap = new Map<string, SupportMaterial>();
      INITIAL_SUPPORT_MATERIALS.forEach((m) => materialsMap.set(m.id, m));
      loadedMaterials.forEach((m) => materialsMap.set(m.id, m));
      this.supportMaterials = Array.from(materialsMap.values());

      const storedSettings = localStorage.getItem('fm_settings');
      this.settings = storedSettings
        ? JSON.parse(storedSettings)
        : {
            ...INITIAL_SETTINGS,
            grandLodgeAffiliation: 'Grande Oriente / Grandes Lojas Regulares',
            allowRegistration: true,
            autoApproveUsers: false,
            enableEmailAlerts: true,
          };

      const storedUsers = localStorage.getItem('fm_users');
      let loadedUsers: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [...DEMO_PROFILES];
      this.users = loadedUsers.map((u) => {
        if (u.grandLodge === 'Grande Oriente do Brasil (GOB)') {
          return { ...u, grandLodge: 'Grande oriente Maçonico Universal GOMAU' };
        }
        if (u.email?.toLowerCase().trim() === 'faculdademaconicauniversal@gmail.com') {
          return {
            ...u,
            role: 'admin',
            status: 'approved',
            temporaryPassword: u.temporaryPassword || 'admin123',
          };
        }
        return u;
      });

      // Ensure root admin exists in this.users
      if (!this.users.some(u => u.email?.toLowerCase().trim() === 'faculdademaconicauniversal@gmail.com')) {
        this.users.push({
          id: 'demo_admin',
          fullName: 'Ir. João da Silva Guimarães',
          masonicName: 'Salomão da Fraternidade (Chanceler)',
          email: 'faculdademaconicauniversal@gmail.com',
          phone: '(11) 98765-4321',
          lodge: 'ARLS Acácia da Fraternidade nº 44',
          grandLodge: 'Grande oriente Maçonico Universal GOMAU',
          degree: 3,
          cimNumber: 'CIM-102938',
          age: 48,
          role: 'admin',
          status: 'approved',
          temporaryPassword: 'admin123',
          photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        });
      }

      // Guarantee that demo_admin and any admin profiles always have all 9 instructions, quizzes, and submissions 100% completed
      this.ensureAdminCompletedData({
        id: 'demo_admin',
        fullName: 'Ir. João da Silva Guimarães',
        email: 'faculdademaconicauniversal@gmail.com',
        cimNumber: 'CIM-102938',
        lodge: 'ARLS Luz e Sabedoria nº 33',
        grandLodge: 'Grande oriente Maçonico Universal GOMAU',
        degree: 3,
      });

      this.users.filter(u => u.role === 'admin' || u.email === 'faculdademaconicauniversal@gmail.com').forEach(u => {
        this.ensureAdminCompletedData(u);
      });
    } catch (e) {
      console.warn('Error loading state from localStorage:', e);
      this.resetToDefaults();
    }
  }

  private saveState() {
    try {
      localStorage.setItem('fm_degrees', JSON.stringify(this.degrees));
      localStorage.setItem('fm_modules', JSON.stringify(this.modules));
      localStorage.setItem('fm_lessons', JSON.stringify(this.lessons));
      localStorage.setItem('fm_questions', JSON.stringify(this.questions));
      localStorage.setItem('fm_quiz_attempts', JSON.stringify(this.quizAttempts));
      localStorage.setItem('fm_submissions', JSON.stringify(this.submissions));
      localStorage.setItem('fm_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('fm_certificates', JSON.stringify(this.certificates));
      localStorage.setItem('fm_audit_logs', JSON.stringify(this.auditLogs));
      localStorage.setItem('fm_salary_requests', JSON.stringify(this.salaryRequests));
      localStorage.setItem('fm_authorizations', JSON.stringify(this.authorizations));
      localStorage.setItem('fm_delivered_instructions', JSON.stringify(this.deliveredInstructions));
      localStorage.setItem('fm_support_materials', JSON.stringify(this.supportMaterials));
      localStorage.setItem('fm_settings', JSON.stringify(this.settings));
      localStorage.setItem('fm_users', JSON.stringify(this.users));
    } catch (e) {
      console.error('Error saving state:', e);
    }
    this.notifyListeners();
  }

  public resetToDefaults() {
    this.degrees = [...INITIAL_DEGREES];
    this.modules = [...INITIAL_MODULES];
    this.lessons = [...INITIAL_LESSONS];
    this.questions = [...INITIAL_QUESTIONS];
    this.quizAttempts = this.getInitialAttempts();
    this.submissions = this.getInitialSubmissions();
    this.notifications = this.getInitialNotifications();
    this.certificates = this.getInitialCertificates();
    this.auditLogs = this.getInitialLogs();
    this.salaryRequests = [];
    this.authorizations = this.getInitialAuthorizations();
    this.deliveredInstructions = [...INITIAL_DELIVERED_INSTRUCTIONS];
    this.supportMaterials = [...INITIAL_SUPPORT_MATERIALS];
    this.settings = {
      ...INITIAL_SETTINGS,
      grandLodgeAffiliation: 'Grande Oriente / Grandes Lojas Regulares',
      allowRegistration: true,
      autoApproveUsers: false,
      enableEmailAlerts: true,
    };
    this.users = [...DEMO_PROFILES];
    this.saveState();
  }

  private getInitialAuthorizations(): MemberAuthorization[] {
    return [
      {
        id: 'auth_init_1',
        tokenCode: 'AUTH-G1-849201',
        fullName: 'Ir. Fernando Alencar Mendonça',
        email: 'fernando.alencar@exemplo.com',
        phone: '(11) 98765-4321',
        cimNumber: 'CIM-448291',
        age: 35,
        lodge: 'ARLS Acácia Paulistana nº 102',
        grandLodge: 'Grande oriente Maçonico Universal GOMAU',
        authorizedDegree: 1,
        role: 'brother',
        status: 'pending',
        temporaryPassword: 'Iniciado@2026',
        notes: 'Iniciado em 15/01/2026. Autorização emitida para ingresso nos estudos do Grau 01.',
        createdById: 'demo_admin',
        createdByName: 'Ir. João da Silva Guimarães (Chanceler)',
        createdAt: '2026-02-01T10:00:00Z',
      },
      {
        id: 'auth_init_2',
        tokenCode: 'AUTH-G2-192837',
        fullName: 'Ir. Roberto Silveira Campos',
        email: 'roberto.campos@exemplo.com',
        phone: '(31) 99123-8844',
        cimNumber: 'CIM-293810',
        age: 42,
        lodge: 'ARLS Regeneração e Justiça nº 45',
        grandLodge: 'Grande oriente Maçonico Universal GOMAU',
        authorizedDegree: 2,
        role: 'brother',
        status: 'pending',
        temporaryPassword: 'Companheiro@2026',
        notes: 'Elevado ao Grau 2 em Loja Regular. Autorização expedida para acesso direto às instruções de Companheiro.',
        createdById: 'demo_admin',
        createdByName: 'Ir. João da Silva Guimarães (Chanceler)',
        createdAt: '2026-02-05T14:30:00Z',
      },
      {
        id: 'auth_init_3',
        tokenCode: 'AUTH-G3-581920',
        fullName: 'Ir. Dr. Marcos Vinicius Fontes',
        email: 'marcos.fontes@exemplo.com',
        phone: '(21) 98877-6655',
        cimNumber: 'CIM-119283',
        age: 50,
        lodge: 'ARLS Estrela do Oriente nº 07',
        grandLodge: 'Grande oriente Maçonico Universal GOMAU',
        authorizedDegree: 3,
        role: 'brother',
        status: 'pending',
        temporaryPassword: 'Mestrado@2026',
        notes: 'Mestre Maçom Regular e Ativo. Acesso pleno concedido pela Chancelaria para o Grau de Mestre.',
        createdById: 'demo_admin',
        createdByName: 'Ir. João da Silva Guimarães (Chanceler)',
        createdAt: '2026-02-08T18:00:00Z',
      },
    ];
  }

  private getInitialAttempts(): QuizAttempt[] {
    const defaultAttempts: QuizAttempt[] = [
      {
        id: 'attempt_demo_1',
        userId: 'demo_brother_aprendiz',
        userName: 'Ir. Pedro Henrique Santos',
        userDegree: 1,
        lessonId: 'inst_1_1',
        lessonTitle: 'Instrução 01: O Desbaste da Pedra Bruta e o Autoaperfeiçoamento',
        degreeNumber: 1,
        attemptNumber: 1,
        answers: [],
        score: 90,
        correctCount: 9,
        errorCount: 1,
        isPassed: true,
        hasPendingManualGrading: false,
        status: 'approved',
        feedback: 'Excelente compreensão dos conceitos fundamentais do Grau 1 e do desbaste moral.',
        gradedBy: 'demo_instructor',
        gradedAt: '2026-02-10T14:30:00Z',
        createdAt: '2026-02-10T14:00:00Z',
        updatedAt: '2026-02-10T14:30:00Z',
      },
    ];

    const adminAttempts = this.generateAdminCompletedQuizAttempts(
      'demo_admin',
      'Ir. João da Silva Guimarães'
    );

    return [...defaultAttempts, ...adminAttempts];
  }

  private getInitialSubmissions(): Submission[] {
    const defaultSubmissions: Submission[] = [
      {
        id: 'sub_demo_1',
        userId: 'demo_brother_aprendiz',
        userName: 'Ir. Pedro Henrique Santos',
        userDegree: 1,
        userLodge: 'ARLS Cavaleiros da Concórdia nº 88',
        lessonId: 'inst_1_1',
        lessonTitle: 'Instrução 01: O Desbaste da Pedra Bruta e o Autoaperfeiçoamento',
        degreeNumber: 1,
        title: 'Prancha de Arquitetura: O Maço e o Cinzel na Superação da Ira',
        comments: 'Trabalho desenvolvido sobre a aplicação dos instrumentos na vida profissional cotidiana.',
        fileName: 'Prancha_Pedra_Bruta_Pedro_Santos.pdf',
        fileType: 'application/pdf',
        fileSize: 1024 * 1024 * 1.2,
        status: 'aprovada',
        grade: 95,
        feedback: 'Prancha aprovada com louvor. Excelente desenvolvimento do simbolismo apresentado.',
        instructorOrientation: 'Continue com esse mesmo zelo reflexivo nas próximas instruções da Coluna do Norte.',
        evaluatedBy: 'demo_instructor',
        evaluatedByName: 'Ir. Carlos Alberto de Oliveira',
        evaluatedAt: '2026-02-12T16:00:00Z',
        createdAt: '2026-02-11T10:00:00Z',
        updatedAt: '2026-02-12T16:00:00Z',
      },
      {
        id: 'sub_demo_2',
        userId: 'demo_brother_aprendiz',
        userName: 'Ir. Pedro Henrique Santos',
        userDegree: 1,
        userLodge: 'ARLS Cavaleiros da Concórdia nº 88',
        lessonId: 'inst_1_2',
        lessonTitle: 'Instrução 02: A Estrutura do Templo e as Três Grandes Colunas',
        degreeNumber: 1,
        title: 'Prancha: A Sabedoria e a Força na Governança Ética',
        comments: 'Reflexão sobre os pilares que sustentam a administração fraterna.',
        fileName: 'Prancha_Tres_Colunas.pdf',
        fileType: 'application/pdf',
        fileSize: 1024 * 850,
        status: 'em_analise',
        createdAt: '2026-02-14T09:30:00Z',
        updatedAt: '2026-02-14T09:30:00Z',
      },
    ];

    const adminSubmissions = this.generateAdminCompletedSubmissions(
      'demo_admin',
      'Ir. João da Silva Guimarães',
      'ARLS Luz e Sabedoria nº 33'
    );

    return [...defaultSubmissions, ...adminSubmissions];
  }

  private getInitialNotifications(): AppNotification[] {
    return [
      {
        id: 'notif_1',
        userId: 'all',
        title: 'Boas-vindas ao Ano Letivo da Faculdade Maçônica',
        message: 'Prezados Irmãos, as instruções do Grau 1 ao Grau 3 já se encontram disponíveis para estudo no sistema.',
        type: 'announcement',
        isRead: false,
        createdAt: '2026-02-01T08:00:00Z',
      },
      {
        id: 'notif_2',
        userId: 'demo_brother_aprendiz',
        title: 'Prancha de Trabalho Aprovada',
        message: 'Sua Prancha de Trabalho da Instrução 01 foi corrigida e aprovada com nota 95/100.',
        type: 'submission',
        link: 'submissions',
        isRead: false,
        createdAt: '2026-02-12T16:00:00Z',
      },
      {
        id: 'notif_admin_congrats',
        userId: 'demo_admin',
        title: 'Mestria & Integralização Curricular Plena',
        message: 'Parabéns, Venerável Administrador! Todas as 9 instruções, 90 questões avaliativas e 9 Pranchas de Trabalho dos Graus 1, 2 e 3 constam integralmente concluídas com nota 100/100 e louvor.',
        type: 'degree',
        link: 'certificates',
        isRead: false,
        createdAt: '2026-02-16T18:00:00Z',
      },
    ];
  }

  public generateAdminCompletedQuizAttempts(userId: string, userName: string): QuizAttempt[] {
    const lessonsList = this.lessons.length > 0 ? this.lessons : INITIAL_LESSONS;
    const questionsList = this.questions.length > 0 ? this.questions : INITIAL_QUESTIONS;

    return lessonsList.map((lesson) => {
      const lessonQuestions = questionsList.filter((q) => q.lessonId === lesson.id);
      const listToMap: (Question | undefined)[] =
        lessonQuestions.length > 0 ? lessonQuestions : Array.from({ length: 10 }, () => undefined);

      const answers = listToMap.map((q, idx) => {
        const qId = q ? q.id : `q_${lesson.id}_${idx + 1}`;
        const qOrder = q ? q.order : idx + 1;
        const qType = q ? q.type : (idx === 9 ? 'written' : 'multiple_choice');
        const qPrompt = q ? (q.prompt || q.question || `Questão ${idx + 1}`) : `Questão ${idx + 1}`;
        const qCorrect = q?.correctAnswer || (qType === 'written' ? 'Demonstração da maturidade e rigor iniciático' : 'Opção Correta');
        const optIdx = q?.options && q?.correctAnswer ? q.options.indexOf(q.correctAnswer) : 0;

        return {
          questionId: qId,
          questionOrder: qOrder,
          questionType: qType as any,
          prompt: qPrompt,
          correctAnswer: qCorrect,
          userAnswer: qCorrect,
          selectedOption: optIdx >= 0 ? optIdx : 0,
          booleanAnswer: qCorrect === 'true',
          writtenAnswer:
            qType === 'written'
              ? 'A vivência dos ensinamentos iniciáticos, o desbaste rigoroso das imperfeições e o compromisso ético inabalável com a verdade, a caridade e a justiça guiam a conduta do maçom em todas as suas relações.'
              : undefined,
          isCorrect: true,
          awardedPoints: 10,
          instructorFeedback:
            qType === 'written'
              ? 'Parecer da Chancelaria Docente: Resposta discursiva exemplar, demonstrando maturidade moral e rigor iniciático pleno.'
              : undefined,
        };
      });

      return {
        id: `attempt_${userId}_${lesson.id}`,
        userId,
        userName,
        userDegree: 3,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        degreeNumber: lesson.degreeNumber,
        attemptNumber: 1,
        answers,
        score: 100,
        correctCount: 10,
        errorCount: 0,
        isPassed: true,
        hasPendingManualGrading: false,
        status: 'approved',
        feedback: `Parabéns, Venerável Irmão! Desempenho impecável com nota máxima (100/100) na avaliação teórica e dissertativa do Grau 0${lesson.degreeNumber}.`,
        gradedBy: 'Soberano Conselho Docente',
        gradedAt: '2026-02-15T10:00:00Z',
        createdAt: '2026-02-15T09:30:00Z',
        updatedAt: '2026-02-15T10:00:00Z',
      };
    });
  }

  public generateAdminCompletedSubmissions(userId: string, userName: string, userLodge: string): Submission[] {
    const lessonsList = this.lessons.length > 0 ? this.lessons : INITIAL_LESSONS;

    return lessonsList.map((lesson) => {
      const sanitizedTitle = lesson.title.replace(/^Instrução \d+:\s*/, '');
      return {
        id: `sub_${userId}_${lesson.id}`,
        userId,
        userName,
        userDegree: 3,
        userLodge: userLodge || 'ARLS Luz e Sabedoria nº 33',
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        degreeNumber: lesson.degreeNumber,
        title: `Prancha de Arquitetura Magistral: ${sanitizedTitle}`,
        comments: `Trabalho de investigação e aprofundamento filosófico sobre ${sanitizedTitle}, integralizando o currículo de estudos do Grau 0${lesson.degreeNumber}.`,
        fileName: `Prancha_${lesson.id}_${userName.replace(/\s+/g, '_')}.pdf`,
        fileType: 'application/pdf',
        fileSize: 1024 * 1024 * 1.6,
        status: 'aprovada',
        grade: 100,
        feedback: `Peça de arquitetura magistral avaliada e aprovada com nota 100/100 e Louvor Acadêmico pelo Soberano Conselho de Mestres.`,
        instructorOrientation: `Trabalho referencial de excelência litúrgica e pedagógica para o aprimoramento dos obreiros.`,
        evaluatedBy: 'admin_chancelaria',
        evaluatedByName: 'Soberano Conselho Docente',
        evaluatedAt: '2026-02-16T15:00:00Z',
        createdAt: '2026-02-15T11:00:00Z',
        updatedAt: '2026-02-16T15:00:00Z',
      };
    });
  }

  public generateAdminCompletedCertificates(
    userId: string,
    userName: string,
    userCim: string,
    userLodge: string,
    userGrandLodge: string
  ): Certificate[] {
    const degreeSpecs = [
      { degNum: 1, name: 'Aprendiz Maçom', certNum: 'CERT-FM-1-102938-771', date: '2026-01-20T10:00:00Z' },
      { degNum: 2, name: 'Companheiro Maçom', certNum: 'CERT-FM-2-102938-882', date: '2026-02-10T10:00:00Z' },
      { degNum: 3, name: 'Mestre Maçom', certNum: 'CERT-FM-3-102938-993', date: '2026-03-01T10:00:00Z' },
    ];

    return degreeSpecs.map((spec) => ({
      id: `cert_${userId}_deg_${spec.degNum}`,
      userId,
      userName,
      userCim: userCim || 'CIM-102938',
      userLodge: userLodge || 'ARLS Luz e Sabedoria nº 33',
      userGrandLodge: userGrandLodge || 'Grande oriente Maçonico Universal GOMAU',
      degreeNumber: spec.degNum,
      degreeName: spec.name,
      institutionName: 'Faculdade Maçônica Universal de Estudos Tradicionais',
      certificateNumber: spec.certNum,
      issueDate: spec.date,
      grandMasterName: "S.'.G.'.M.'. DARLAN MARTINS",
      grandMasterRole: 'Soberano Grão-Mestre',
      inspectorName: 'GRANDE INSPETOR GERAL / INSTRUTOR JANDERSON CAMARGOS',
      inspectorRole: 'Grande Inspetor Geral / Instrutor Docente',
      responsibleName: 'Janderson Camargos',
      responsibleRole: 'Grande Inspetor Geral / Instrutor Docente',
      qrCodeVerificationUrl: `https://faculdademaconica.org/verify/${userId}_deg_${spec.degNum}`,
      createdAt: spec.date,
    }));
  }

  public ensureAdminCompletedData(adminProfile?: Partial<UserProfile>): void {
    const targetId = adminProfile?.id || 'demo_admin';
    const targetName = adminProfile?.fullName || 'Ir. João da Silva Guimarães';
    const targetCim = adminProfile?.cimNumber || 'CIM-102938';
    const targetLodge = adminProfile?.lodge || 'ARLS Luz e Sabedoria nº 33';
    const targetGrandLodge = adminProfile?.grandLodge || 'Grande oriente Maçonico Universal GOMAU';

    // 1. Ensure Quiz Attempts (all 9 instructions completed with 100/100)
    const attempts = this.generateAdminCompletedQuizAttempts(targetId, targetName);
    attempts.forEach((att) => {
      const idx = this.quizAttempts.findIndex(
        (a) => a.userId === targetId && a.lessonId === att.lessonId
      );
      if (idx === -1) {
        this.quizAttempts.push(att);
      } else {
        this.quizAttempts[idx] = {
          ...this.quizAttempts[idx],
          score: 100,
          correctCount: 10,
          errorCount: 0,
          isPassed: true,
          status: 'approved',
          hasPendingManualGrading: false,
          answers: att.answers,
          feedback: att.feedback,
        };
      }
    });

    // 2. Ensure Submissions / Pranchas (all 9 instructions approved with 100/100)
    const subs = this.generateAdminCompletedSubmissions(targetId, targetName, targetLodge);
    subs.forEach((sub) => {
      const idx = this.submissions.findIndex(
        (s) => s.userId === targetId && s.lessonId === sub.lessonId
      );
      if (idx === -1) {
        this.submissions.push(sub);
      } else {
        this.submissions[idx] = {
          ...this.submissions[idx],
          status: 'aprovada',
          grade: 100,
          evaluatedByName: 'Soberano Conselho Docente',
          feedback: sub.feedback,
        };
      }
    });

    // 3. Ensure Certificates for Degrees 1, 2, 3
    const certs = this.generateAdminCompletedCertificates(
      targetId,
      targetName,
      targetCim,
      targetLodge,
      targetGrandLodge
    );
    certs.forEach((cert) => {
      const idx = this.certificates.findIndex(
        (c) => c.userId === targetId && c.degreeNumber === cert.degreeNumber
      );
      if (idx === -1) {
        this.certificates.push(cert);
      }
    });

    // If target is not demo_admin, also ensure demo_admin has it
    if (targetId !== 'demo_admin') {
      const demoAttempts = this.generateAdminCompletedQuizAttempts('demo_admin', 'Ir. João da Silva Guimarães');
      demoAttempts.forEach((att) => {
        const idx = this.quizAttempts.findIndex((a) => a.userId === 'demo_admin' && a.lessonId === att.lessonId);
        if (idx === -1) this.quizAttempts.push(att);
        else {
          this.quizAttempts[idx] = { ...this.quizAttempts[idx], score: 100, correctCount: 10, errorCount: 0, isPassed: true, status: 'approved', hasPendingManualGrading: false };
        }
      });
      const demoSubs = this.generateAdminCompletedSubmissions('demo_admin', 'Ir. João da Silva Guimarães', 'ARLS Luz e Sabedoria nº 33');
      demoSubs.forEach((sub) => {
        const idx = this.submissions.findIndex((s) => s.userId === 'demo_admin' && s.lessonId === sub.lessonId);
        if (idx === -1) this.submissions.push(sub);
        else {
          this.submissions[idx] = { ...this.submissions[idx], status: 'aprovada', grade: 100, evaluatedByName: 'Soberano Conselho Docente' };
        }
      });
      const demoCerts = this.generateAdminCompletedCertificates('demo_admin', 'Ir. João da Silva Guimarães', 'CIM-102938', 'ARLS Luz e Sabedoria nº 33', 'Grande oriente Maçonico Universal GOMAU');
      demoCerts.forEach((cert) => {
        const idx = this.certificates.findIndex((c) => c.userId === 'demo_admin' && c.degreeNumber === cert.degreeNumber);
        if (idx === -1) this.certificates.push(cert);
      });
    }

    this.saveState();
  }

  private getInitialCertificates(): Certificate[] {
    return this.generateAdminCompletedCertificates(
      'demo_admin',
      'Ir. João da Silva Guimarães',
      'CIM-102938',
      'ARLS Luz e Sabedoria nº 33',
      'Grande oriente Maçonico Universal GOMAU'
    );
  }

  private getInitialLogs(): AuditLog[] {
    return [
      {
        id: 'log_1',
        userId: 'demo_admin',
        userName: 'Ir. João da Silva Guimarães',
        action: 'Sistema Inicializado',
        details: 'Configurações globais e instruções do Grau 1 ao 3 cadastradas com sucesso.',
        timestamp: '2026-01-01T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
  }

  // --- USERS MANAGEMENT ---
  public getUsers(): UserProfile[] {
    return [...this.users];
  }

  public getUserById(id: string): UserProfile | undefined {
    return this.users.find((u) => u.id === id);
  }

  public updateUser(id: string, updates: Partial<UserProfile>, adminName?: string): UserProfile | null {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveState();
    syncDocToCloud('users', id, this.users[idx]);
    this.logAction(
      adminName || 'Admin',
      'Usuário Atualizado',
      `Perfil ${this.users[idx].fullName} (${this.users[idx].email}) atualizado.`,
      id,
      'user'
    );
    return this.users[idx];
  }

  public addUser(user: UserProfile): void {
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      this.users[idx] = user;
    } else {
      this.users.push(user);
    }
    this.saveState();
    syncDocToCloud('users', user.id, user);
  }

  // --- MEMBER AUTHORIZATION & PRE-REGISTRATION CONTROLS ---
  public getAuthorizations(filter?: {
    degree?: number;
    status?: 'pending' | 'used' | 'revoked';
    search?: string;
  }): MemberAuthorization[] {
    let list = [...this.authorizations];

    if (filter) {
      if (filter.degree !== undefined) {
        list = list.filter((a) => a.authorizedDegree === filter.degree);
      }
      if (filter.status) {
        list = list.filter((a) => a.status === filter.status);
      }
      if (filter.search && filter.search.trim()) {
        const q = filter.search.toLowerCase();
        list = list.filter(
          (a) =>
            a.fullName.toLowerCase().includes(q) ||
            a.email.toLowerCase().includes(q) ||
            a.tokenCode.toLowerCase().includes(q) ||
            a.cimNumber.toLowerCase().includes(q) ||
            a.lodge.toLowerCase().includes(q)
        );
      }
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getAuthorizationById(id: string): MemberAuthorization | undefined {
    return this.authorizations.find((a) => a.id === id);
  }

  public getAuthorizationByCode(code: string): MemberAuthorization | undefined {
    if (!code) return undefined;
    const clean = code.trim().toUpperCase();
    return this.authorizations.find((a) => a.tokenCode.toUpperCase() === clean);
  }

  public getAuthorizationByEmail(email: string): MemberAuthorization | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    return this.authorizations.find((a) => a.email.toLowerCase() === clean);
  }

  /**
   * Procura o registro previamente cadastrado pelo Gestor para conferência das Travas de Acesso (E-mail, Nome Completo, CIM e Idade)
   */
  public findAccessLocksRecord(email: string): {
    found: boolean;
    expectedFullName?: string;
    expectedCim?: string;
    expectedAge?: number;
    user?: UserProfile;
    authorization?: MemberAuthorization;
    isRootAdmin?: boolean;
  } {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return { found: false };

    // Root administrator
    if (cleanEmail === 'faculdademaconicauniversal@gmail.com') {
      const rootUser = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
      return {
        found: true,
        expectedFullName: rootUser?.fullName || 'Ir. João da Silva Guimarães (Chanceler)',
        expectedCim: rootUser?.cimNumber || 'CIM-102938',
        expectedAge: rootUser?.age || 48,
        user: rootUser,
        isRootAdmin: true,
      };
    }

    // Direct users registered by gestor
    const directUser = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (directUser) {
      return {
        found: true,
        expectedFullName: directUser.fullName,
        expectedCim: directUser.cimNumber,
        expectedAge: directUser.age,
        user: directUser,
      };
    }

    // Pre-authorizations registered by gestor
    const preAuth = this.authorizations.find((a) => a.email.toLowerCase() === cleanEmail);
    if (preAuth) {
      return {
        found: true,
        expectedFullName: preAuth.fullName,
        expectedCim: preAuth.cimNumber,
        expectedAge: preAuth.age,
        authorization: preAuth,
      };
    }

    return { found: false };
  }

  public createMemberAuthorization(data: {
    fullName: string;
    email: string;
    phone?: string;
    age?: number;
    cimNumber: string;
    lodge: string;
    grandLodge?: string;
    authorizedDegree: number;
    role?: UserRole;
    temporaryPassword?: string;
    notes?: string;
    createdById: string;
    createdByName: string;
  }): MemberAuthorization {
    const degreeNumber = Math.min(Math.max(data.authorizedDegree, 1), 3);
    const degreePrefix = `G${degreeNumber}`;
    const randomHex = Math.floor(100000 + Math.random() * 900000);
    const tokenCode = `AUTH-${degreePrefix}-${randomHex}`;

    const newAuth: MemberAuthorization = {
      id: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tokenCode,
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || undefined,
      age: data.age ? Number(data.age) : undefined,
      cimNumber: data.cimNumber.trim(),
      lodge: data.lodge.trim(),
      grandLodge: data.grandLodge?.trim() || 'Grande oriente Maçonico Universal GOMAU',
      authorizedDegree: degreeNumber,
      role: data.role || 'brother',
      status: 'pending',
      temporaryPassword: data.temporaryPassword || `Macom@${Math.floor(1000 + Math.random() * 9000)}`,
      notes: data.notes?.trim() || undefined,
      createdById: data.createdById,
      createdByName: data.createdByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.authorizations.unshift(newAuth);

    this.logAction(
      data.createdByName,
      'Autorização de Cadastro Emitida',
      `Autorização ${tokenCode} gerada para ${data.fullName} no Grau 0${degreeNumber} (${data.lodge}).`,
      newAuth.id,
      'authorization'
    );

    this.saveState();
    syncDocToCloud('member_authorizations', newAuth.id, newAuth);
    return newAuth;
  }

  public revokeMemberAuthorization(id: string, adminName: string): boolean {
    const auth = this.authorizations.find((a) => a.id === id);
    if (!auth) return false;

    auth.status = 'revoked';
    auth.updatedAt = new Date().toISOString();

    this.logAction(
      adminName,
      'Autorização Revogada',
      `Autorização ${auth.tokenCode} de ${auth.fullName} foi revogada.`,
      auth.id,
      'authorization'
    );

    this.saveState();
    syncDocToCloud('member_authorizations', auth.id, auth);
    return true;
  }

  public consumeMemberAuthorization(
    tokenCodeOrEmail: string,
    userId: string
  ): { success: boolean; authorization?: MemberAuthorization; message: string } {
    if (!tokenCodeOrEmail) {
      return { success: false, message: 'Código de autorização não fornecido.' };
    }

    const clean = tokenCodeOrEmail.trim();
    const auth =
      this.authorizations.find(
        (a) =>
          a.status === 'pending' &&
          (a.tokenCode.toUpperCase() === clean.toUpperCase() ||
            a.email.toLowerCase() === clean.toLowerCase())
      );

    if (!auth) {
      return {
        success: false,
        message: 'Nenhuma autorização ativa encontrada para o código ou e-mail informado.',
      };
    }

    auth.status = 'used';
    auth.usedByUserId = userId;
    auth.usedAt = new Date().toISOString();
    auth.updatedAt = new Date().toISOString();

    this.saveState();
    syncDocToCloud('member_authorizations', auth.id, auth);
    return {
      success: true,
      authorization: auth,
      message: `Autorização ${auth.tokenCode} consumida com sucesso no Grau 0${auth.authorizedDegree}!`,
    };
  }

  public createDirectAuthorizedBrother(
    data: {
      fullName: string;
      masonicName?: string;
      email: string;
      temporaryPassword?: string;
      phone?: string;
      age?: number;
      cimNumber: string;
      lodge: string;
      grandLodge?: string;
      degree: number;
      role?: UserRole;
      status?: UserStatus;
      notes?: string;
      sendWelcomeNotification?: boolean;
    },
    adminName: string
  ): {
    success: boolean;
    user?: UserProfile;
    message: string;
    generatedPassword?: string;
    authorization?: MemberAuthorization;
  } {
    const emailClean = data.email.trim().toLowerCase();

    // Check if user already exists
    const existing = this.users.find((u) => u.email.toLowerCase() === emailClean);
    if (existing) {
      return {
        success: false,
        message: `Já existe um membro cadastrado com o e-mail "${emailClean}".`,
      };
    }

    const targetDegree = Math.min(Math.max(data.degree || 1, 1), 3);
    const newUserId = `brother_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const tempPass = data.temporaryPassword || `Macom@${Math.floor(1000 + Math.random() * 9000)}`;

    const newProfile: UserProfile = {
      id: newUserId,
      fullName: data.fullName.trim(),
      masonicName: data.masonicName?.trim() || undefined,
      email: emailClean,
      phone: data.phone?.trim() || undefined,
      age: data.age ? Number(data.age) : undefined,
      cimNumber: data.cimNumber.trim(),
      lodge: data.lodge.trim(),
      grandLodge: data.grandLodge?.trim() || 'Grande oriente Maçonico Universal GOMAU',
      degree: targetDegree,
      role: data.role || 'brother',
      status: data.status || 'approved',
      temporaryPassword: tempPass,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.unshift(newProfile);

    // Also register corresponding completed authorization record for tracking
    const degreePrefix = `G${targetDegree}`;
    const tokenCode = `AUTH-${degreePrefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    const authRecord: MemberAuthorization = {
      id: `auth_${Date.now()}`,
      tokenCode,
      fullName: newProfile.fullName,
      email: newProfile.email,
      phone: newProfile.phone,
      age: newProfile.age,
      cimNumber: newProfile.cimNumber,
      lodge: newProfile.lodge,
      grandLodge: newProfile.grandLodge,
      authorizedDegree: targetDegree,
      role: newProfile.role,
      status: 'used',
      temporaryPassword: tempPass,
      notes: data.notes || `Cadastro direto autorizado pela Chancelaria no Grau 0${targetDegree}.`,
      createdById: 'admin',
      createdByName: adminName,
      usedByUserId: newProfile.id,
      usedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.authorizations.unshift(authRecord);

    // Welcome Notification
    if (data.sendWelcomeNotification !== false) {
      const degreeNames = ['Aprendiz Maçom', 'Companheiro Maçom', 'Mestre Maçom'];
      this.addNotification({
        userId: newProfile.id,
        title: `🏛️ Bem-vindo à Faculdade Maçônica Universal!`,
        message: `Venerável Irmão ${newProfile.fullName}, seu cadastro foi efetuado e autorizado no Grau 0${targetDegree} (${degreeNames[targetDegree - 1]}). Bons estudos em seus trabalhos litúrgicos e filosóficos!`,
        type: 'approval',
        isRead: false,
      });
    }

    this.logAction(
      adminName,
      'Irmão Cadastrado e Autorizado',
      `O Ir.'. ${newProfile.fullName} (${newProfile.email}) foi cadastrado diretamente e autorizado no Grau 0${targetDegree} (${newProfile.lodge}).`,
      newProfile.id,
      'user'
    );

    this.saveState();
    syncDocToCloud('users', newProfile.id, newProfile);
    syncDocToCloud('member_authorizations', authRecord.id, authRecord);

    return {
      success: true,
      user: newProfile,
      generatedPassword: tempPass,
      authorization: authRecord,
      message: `Irmão ${newProfile.fullName} cadastrado e autorizado com sucesso no Grau 0${targetDegree}!`,
    };
  }

  public authorizePendingUser(
    userId: string,
    targetDegree: number,
    adminName: string,
    role?: UserRole
  ): { success: boolean; user?: UserProfile; message: string } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'Irmão não encontrado.' };
    }

    const deg = Math.min(Math.max(targetDegree, 1), 3);
    const degreeNames = ['Aprendiz Maçom', 'Companheiro Maçom', 'Mestre Maçom'];

    user.degree = deg;
    user.status = 'approved';
    if (role) {
      user.role = role;
    }
    user.updatedAt = new Date().toISOString();

    this.addNotification({
      userId: user.id,
      title: '🏛️ Cadastro Aprovado e Autorizado!',
      message: `Venerável Irmão ${user.fullName}, seu registro foi homologado pela Chancelaria com autorização para o Grau 0${deg} (${degreeNames[deg - 1]}).`,
      type: 'approval',
      isRead: false,
    });

    this.logAction(
      adminName,
      'Cadastro Autorizado no Grau',
      `Irmão ${user.fullName} aprovado e autorizado no Grau 0${deg} (${degreeNames[deg - 1]}).`,
      user.id,
      'user'
    );

    this.saveState();
    syncDocToCloud('users', user.id, user);

    return {
      success: true,
      user,
      message: `Irmão ${user.fullName} autorizado no Grau 0${deg} com sucesso!`,
    };
  }

  // --- DEGREES MANAGEMENT ---
  public getDegrees(): Degree[] {
    return this.degrees.map((deg) => {
      const lessons = this.lessons.filter((l) => l.degreeNumber === deg.degreeNumber && l.status === 'published');
      return {
        ...deg,
        totalLessons: lessons.length,
      };
    });
  }

  public getDegreeByNumber(degreeNumber: number): Degree | undefined {
    return this.degrees.find((d) => d.degreeNumber === degreeNumber);
  }

  public updateDegree(id: string, updates: Partial<Degree>, adminName?: string): Degree | null {
    const idx = this.degrees.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.degrees[idx] = { ...this.degrees[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveState();
    syncDocToCloud('degrees', id, this.degrees[idx]);
    this.logAction(adminName || 'Admin', 'Grau Atualizado', `Grau ${this.degrees[idx].name} modificado.`, id, 'degree');
    return this.degrees[idx];
  }

  public addDegree(degree: Omit<Degree, 'id' | 'createdAt' | 'updatedAt'>, adminName?: string): Degree {
    const newDegree: Degree = {
      ...degree,
      id: `grau_${degree.degreeNumber}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.degrees.push(newDegree);
    this.saveState();
    syncDocToCloud('degrees', newDegree.id, newDegree);
    this.logAction(adminName || 'Admin', 'Novo Grau Criado', `Grau ${newDegree.name} cadastrado.`, newDegree.id, 'degree');
    return newDegree;
  }

  // --- MODULES MANAGEMENT ---
  public getModules(degreeNumber?: number): Module[] {
    if (degreeNumber !== undefined) {
      return this.modules.filter((m) => m.degreeNumber === degreeNumber);
    }
    return [...this.modules];
  }

  public addModule(mod: Omit<Module, 'id' | 'createdAt' | 'updatedAt'>, adminName?: string): Module {
    const newMod: Module = {
      ...mod,
      id: `mod_${mod.degreeNumber}_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.modules.push(newMod);
    this.saveState();
    syncDocToCloud('modules', newMod.id, newMod);
    this.logAction(adminName || 'Admin', 'Módulo Criado', `Módulo "${newMod.title}" adicionado.`, newMod.id, 'module');
    return newMod;
  }

  public updateModule(id: string, updates: Partial<Module>): Module | null {
    const idx = this.modules.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.modules[idx] = { ...this.modules[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveState();
    syncDocToCloud('modules', id, this.modules[idx]);
    return this.modules[idx];
  }

  // --- LESSONS MANAGEMENT ---
  public getLessons(userDegree: number, isAdminOrInstructor: boolean): Lesson[] {
    return this.lessons.filter((lesson) => {
      if (isAdminOrInstructor) return true;
      if (lesson.status !== 'published') return false;
      const deg = this.degrees.find((d) => d.degreeNumber === lesson.degreeNumber);
      if (!deg) return lesson.degreeNumber <= userDegree;
      if (deg.allowPreviousDegrees) {
        return lesson.degreeNumber <= userDegree;
      }
      return lesson.degreeNumber === userDegree;
    });
  }

  public getLessonById(id: string): Lesson | undefined {
    return this.lessons.find((l) => l.id === id);
  }

  public saveLesson(lesson: Lesson, adminName?: string): Lesson {
    const idx = this.lessons.findIndex((l) => l.id === lesson.id);
    const updatedLesson: Lesson = {
      ...lesson,
      summary: lesson.summary || lesson.subtitle || '',
      estimatedMinutes: lesson.estimatedMinutes || 20,
      updatedAt: new Date().toISOString(),
    };

    if (idx !== -1) {
      this.lessons[idx] = updatedLesson;
      this.logAction(adminName || 'Admin', 'Instrução Editada', `Instrução "${lesson.title}" atualizada.`, lesson.id, 'lesson');
    } else {
      this.lessons.push(updatedLesson);
      this.logAction(adminName || 'Admin', 'Instrução Criada', `Nova instrução "${lesson.title}" cadastrada.`, lesson.id, 'lesson');
    }

    this.saveState();
    syncDocToCloud('lessons', updatedLesson.id, updatedLesson);
    return updatedLesson;
  }

  public deleteLesson(id: string, adminName?: string): boolean {
    const idx = this.lessons.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    const title = this.lessons[idx].title;
    this.lessons.splice(idx, 1);
    this.questions = this.questions.filter((q) => q.lessonId !== id);
    this.quizAttempts = this.quizAttempts.filter((a) => a.lessonId !== id);
    this.submissions = this.submissions.filter((s) => s.lessonId !== id);
    this.saveState();
    deleteDocFromCloud('lessons', id);
    this.logAction(adminName || 'Admin', 'Instrução Excluída', `Instrução "${title}" excluída.`, id, 'lesson');
    return true;
  }

  // --- QUESTIONS (EXACTLY 10 PER LESSON MANDATE) ---
  public getQuestionsByLessonId(lessonId: string): Question[] {
    let list = this.questions
      .filter((q) => q.lessonId === lessonId)
      .map((q) => ({
        ...q,
        prompt: q.prompt || q.question || '',
        question: q.question || q.prompt || '',
      }))
      .sort((a, b) => a.order - b.order);

    if (list.length === 0) {
      const seedForLesson = INITIAL_QUESTIONS.filter((q) => q.lessonId === lessonId).map((q) => ({
        ...q,
        prompt: q.prompt || q.question || '',
        question: q.question || q.prompt || '',
      }));
      if (seedForLesson.length > 0) {
        this.questions.push(...seedForLesson);
        this.saveState();
        list = seedForLesson;
      }
    }

    return list;
  }

  public getQuestionsByLesson(lessonId: string): Question[] {
    return this.getQuestionsByLessonId(lessonId);
  }

  public getAllQuestions(): Question[] {
    if (this.questions.length < INITIAL_QUESTIONS.length) {
      return [...INITIAL_QUESTIONS];
    }
    return [...this.questions];
  }

  public saveQuestion(question: Question, adminName?: string): Question {
    const idx = this.questions.findIndex((q) => q.id === question.id);
    const updatedQ: Question = {
      ...question,
      updatedAt: new Date().toISOString(),
    };

    if (idx !== -1) {
      this.questions[idx] = updatedQ;
    } else {
      this.questions.push(updatedQ);
    }
    this.saveState();
    syncDocToCloud('questions', updatedQ.id, updatedQ);
    this.logAction(adminName || 'Admin', 'Questão Atualizada', `Questão salva para a instrução ${question.lessonId}.`);
    return updatedQ;
  }

  public deleteQuestion(questionId: string, adminName?: string): boolean {
    const idx = this.questions.findIndex((q) => q.id === questionId);
    if (idx === -1) return false;
    this.questions.splice(idx, 1);
    this.saveState();
    deleteDocFromCloud('questions', questionId);
    this.logAction(adminName || 'Admin', 'Questão Excluída', `Questão ID ${questionId} removida.`);
    return true;
  }

  public saveQuestionsForLesson(lessonId: string, questions: Question[], adminName?: string): boolean {
    this.questions = this.questions.filter((q) => q.lessonId !== lessonId);
    this.questions.push(...questions);
    this.saveState();
    for (const q of questions) {
      syncDocToCloud('questions', q.id, q);
    }
    this.logAction(
      adminName || 'Admin',
      'Questionário Salvo',
      `Questionário para a instrução ${lessonId} salvo com ${questions.length} questões.`,
      lessonId,
      'question'
    );
    return true;
  }

  // --- QUIZ ATTEMPTS & GRADING ---
  public submitQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'createdAt' | 'updatedAt' | 'attemptNumber'>): QuizAttempt {
    const previousAttempts = this.quizAttempts.filter(
      (a) => a.userId === attempt.userId && a.lessonId === attempt.lessonId
    );

    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      attemptNumber: previousAttempts.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.quizAttempts.push(newAttempt);

    this.addNotification({
      userId: attempt.userId,
      title: newAttempt.isPassed ? 'Questionário Aprovado!' : 'Resultado da Avaliação',
      message: `Você obteve nota ${newAttempt.score}/100 na avaliação de "${attempt.lessonTitle}".`,
      type: 'quiz',
      link: 'evaluations',
      isRead: false,
    });

    this.saveState();
    return newAttempt;
  }

  public getQuizAttemptsByUser(userId: string): QuizAttempt[] {
    return this.quizAttempts
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllQuizAttempts(): QuizAttempt[] {
    return [...this.quizAttempts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public gradeDiscursiveQuestion(
    attemptId: string,
    awardedPoints: number,
    feedback: string,
    instructorName: string
  ): QuizAttempt | null {
    const attempt = this.quizAttempts.find((a) => a.id === attemptId);
    if (!attempt) return null;

    const discursiveAnswerObj = attempt.answers.find((a) => a.questionType === 'written');
    if (discursiveAnswerObj) {
      discursiveAnswerObj.awardedPoints = awardedPoints;
      discursiveAnswerObj.instructorFeedback = feedback;
      discursiveAnswerObj.isCorrect = awardedPoints >= 7;
    }

    const totalScore = attempt.answers.reduce((acc, curr) => acc + (curr.awardedPoints || 0), 0);
    attempt.score = Math.min(100, Math.max(0, totalScore || (attempt.score + awardedPoints)));
    attempt.hasPendingManualGrading = false;
    attempt.isPassed = attempt.score >= 70;
    attempt.status = attempt.isPassed ? 'approved' : 'rejected';
    attempt.gradedBy = instructorName;
    attempt.gradedAt = new Date().toISOString();
    attempt.feedback = feedback;
    attempt.updatedAt = new Date().toISOString();

    this.saveState();

    this.addNotification({
      userId: attempt.userId,
      title: 'Questão Dissertativa Avaliada',
      message: `Sua resposta discursiva em "${attempt.lessonTitle}" foi avaliada por ${instructorName}. Nota final: ${attempt.score}/100.`,
      type: 'quiz',
      link: 'evaluations',
      isRead: false,
    });

    return attempt;
  }

  // --- SUBMISSIONS (PRANCHAS DE TRABALHO) ---
  public submitPrancha(sub: Omit<Submission, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Submission {
    const newSubmission: Submission = {
      ...sub,
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      status: 'enviada',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.submissions.push(newSubmission);

    this.addNotification({
      userId: sub.userId,
      title: 'Prancha de Trabalho Enviada',
      message: `Sua Prancha "${sub.title}" foi enviada com sucesso e está aguardando análise dos instrutores.`,
      type: 'submission',
      link: 'submissions',
      isRead: false,
    });

    this.saveState();
    return newSubmission;
  }

  public getSubmissionsByUser(userId: string): Submission[] {
    return this.submissions
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllSubmissions(): Submission[] {
    return [...this.submissions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public evaluatePrancha(
    submissionId: string,
    evaluation: {
      status: Submission['status'];
      grade: number;
      feedback: string;
      instructorOrientation: string;
    },
    instructorId: string,
    instructorName: string
  ): Submission | null {
    return this.evaluateSubmission(
      submissionId,
      evaluation.grade,
      evaluation.feedback,
      evaluation.instructorOrientation,
      evaluation.status,
      instructorId,
      instructorName
    );
  }

  public evaluateSubmission(
    submissionId: string,
    grade: number,
    feedback: string,
    orientation: string,
    status: Submission['status'],
    instructorId: string,
    instructorName: string
  ): Submission | null {
    const idx = this.submissions.findIndex((s) => s.id === submissionId);
    if (idx === -1) return null;

    const sub = this.submissions[idx];
    sub.grade = grade;
    sub.feedback = feedback;
    sub.instructorOrientation = orientation;
    sub.status = status;
    sub.evaluatedBy = instructorId;
    sub.evaluatedByName = instructorName;
    sub.evaluatedAt = new Date().toISOString();
    sub.updatedAt = new Date().toISOString();

    this.saveState();

    const statusTitle =
      status === 'aprovada'
        ? 'Prancha Aprovada!'
        : status === 'necessita_correcao'
        ? 'Prancha Necessita de Correção'
        : 'Parecer da Prancha de Trabalho';

    this.addNotification({
      userId: sub.userId,
      title: statusTitle,
      message: `Sua Prancha "${sub.title}" foi avaliada por ${instructorName}. Nota: ${grade}/100.`,
      type: 'submission',
      link: 'submissions',
      isRead: false,
    });

    this.logAction(
      instructorName,
      'Prancha Avaliada',
      `Prancha "${sub.title}" de ${sub.userName} avaliada como ${status} (Nota: ${grade}).`,
      submissionId,
      'submission'
    );

    return sub;
  }

  // --- PROGRESS CALCULATOR ---
  public getUserProgress(userId: string, degreeNumber: number) {
    const lessonsInDegree = this.lessons.filter(
      (l) => l.degreeNumber === degreeNumber && l.status === 'published'
    );
    const userAttempts = this.quizAttempts.filter(
      (a) => a.userId === userId && a.degreeNumber === degreeNumber && a.isPassed
    );
    const userSubmissions = this.submissions.filter(
      (s) => s.userId === userId && s.degreeNumber === degreeNumber && s.status === 'aprovada'
    );

    const completedLessonIds = new Set<string>();
    lessonsInDegree.forEach((lesson) => {
      const hasPassedQuiz = userAttempts.some((a) => a.lessonId === lesson.id);
      const hasApprovedSubmission = userSubmissions.some((s) => s.lessonId === lesson.id);
      if (hasPassedQuiz && hasApprovedSubmission) {
        completedLessonIds.add(lesson.id);
      }
    });

    const totalLessons = lessonsInDegree.length;
    const completedCount = completedLessonIds.size;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    const isDegreeCompleted = totalLessons > 0 && completedCount === totalLessons;

    const allUserAttempts = this.quizAttempts.filter((a) => a.userId === userId);
    const averageGrade =
      allUserAttempts.length > 0
        ? Math.round(allUserAttempts.reduce((acc, curr) => acc + curr.score, 0) / allUserAttempts.length)
        : 0;

    return {
      degreeNumber,
      totalLessons,
      completedLessons: completedCount,
      progressPercent,
      isDegreeCompleted,
      quizzesTaken: allUserAttempts.length,
      averageGrade,
      submissionsTotal: this.submissions.filter((s) => s.userId === userId).length,
      submissionsApproved: this.submissions.filter((s) => s.userId === userId && s.status === 'aprovada').length,
      submissionsPending: this.submissions.filter(
        (s) => s.userId === userId && (s.status === 'enviada' || s.status === 'em_analise')
      ).length,
    };
  }

  // --- CERTIFICATES ---
  public issueCertificate(certData: Omit<Certificate, 'id' | 'certificateNumber' | 'createdAt'>): Certificate {
    const certNumber = `CERT-FM-${certData.degreeNumber}-${Date.now().toString().slice(-6)}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const newCert: Certificate = {
      ...certData,
      grandMasterName: certData.grandMasterName || "S.'.G.'.M.'. DARLAN MARTINS",
      grandMasterRole: certData.grandMasterRole || 'Soberano Grão-Mestre',
      inspectorName: certData.inspectorName || 'GRANDE INSPETOR GERAL / INSTRUTOR JANDERSON CAMARGOS',
      inspectorRole: certData.inspectorRole || 'Grande Inspetor Geral / Instrutor Docente',
      id: `cert_${Date.now()}`,
      certificateNumber: certNumber,
      createdAt: new Date().toISOString(),
    };

    this.certificates.push(newCert);

    this.addNotification({
      userId: certData.userId,
      title: 'Certificado Digital Emitido!',
      message: `Parabéns, Irmão! Seu Certificado de Conclusão do ${certData.degreeName} foi emitido com sucesso.`,
      type: 'degree',
      link: 'certificates',
      isRead: false,
    });

    this.saveState();
    return newCert;
  }

  public getCertificatesByUser(userId: string): Certificate[] {
    return this.certificates.filter((c) => c.userId === userId);
  }

  public getAllCertificates(): Certificate[] {
    return [...this.certificates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- NOTIFICATIONS ---
  public getNotificationsByUser(userId: string): AppNotification[] {
    return this.notifications
      .filter((n) => n.userId === userId || n.userId === 'all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'createdAt'>): AppNotification {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    this.saveState();
    return newNotif;
  }

  public broadcastNotification(params: {
    title: string;
    message: string;
    type: AppNotification['type'];
    targetDegree?: number;
  }): void {
    const targetUserId = params.targetDegree ? `degree_${params.targetDegree}` : 'all';
    this.addNotification({
      userId: targetUserId,
      title: params.title,
      message: params.message,
      type: params.type,
      isRead: false,
    });
    this.logAction('Chancelaria', 'Comunicado Transmitido', `Circular "${params.title}" disparada.`);
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.saveState();
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.notifications.forEach((n) => {
      if (n.userId === userId || n.userId === 'all') {
        n.isRead = true;
      }
    });
    this.saveState();
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime()
    );
  }

  public logAction(
    userName: string,
    action: string,
    details: string,
    targetId?: string,
    targetType?: string
  ): AuditLog {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: 'system',
      userName,
      action,
      details,
      targetId,
      targetType,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
    this.saveState();
    return log;
  }

  // --- SETTINGS ---
  public getSettings(): AppSetting {
    return { ...this.settings };
  }

  public getSystemSettings(): AppSetting {
    return this.getSettings();
  }

  public updateSettings(updates: Partial<AppSetting>, adminName?: string): AppSetting {
    this.settings = {
      ...this.settings,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: adminName,
    };
    this.saveState();
    syncDocToCloud('settings', 'global_config', this.settings);
    syncDocToCloud('settings', 'global_settings', this.settings);
    this.logAction(adminName || 'Admin', 'Configurações Atualizadas', 'Parâmetros globais do sistema alterados.');
    return { ...this.settings };
  }

  public updateSystemSettings(updates: Partial<AppSetting>, adminName?: string): AppSetting {
    return this.updateSettings(updates, adminName);
  }

  // --- SALARY INCREASE (PEDIDOS DE AUMENTO DE SALÁRIO) ---
  public checkDegreeQuizzesProgress(userId: string, degreeNumber: number = 1) {
    const publishedLessons = this.lessons.filter(
      (l) => l.degreeNumber === degreeNumber && l.status === 'published'
    );
    const userAttempts = this.quizAttempts.filter(
      (a) => a.userId === userId && a.degreeNumber === degreeNumber
    );

    const lessonStatusList = publishedLessons.map((lesson) => {
      const attempts = userAttempts.filter((a) => a.lessonId === lesson.id);
      const passedAttempt = attempts.find(
        (a) => a.isPassed || a.score >= (lesson.minimumPassingGrade || 70)
      );
      const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
      const latestAttempt = attempts[0] || null;

      return {
        lesson,
        isPassed: !!passedAttempt,
        bestScore,
        attempt: passedAttempt || latestAttempt,
      };
    });

    const totalLessons = publishedLessons.length;
    const completedLessons = lessonStatusList.filter((item) => item.isPassed).length;
    const isAllCompleted = totalLessons > 0 && completedLessons === totalLessons;

    const completedScores = lessonStatusList
      .filter((item) => item.isPassed && item.bestScore !== null)
      .map((item) => item.bestScore as number);

    const averageScore =
      completedScores.length > 0
        ? Math.round(completedScores.reduce((acc, curr) => acc + curr, 0) / completedScores.length)
        : 0;

    return {
      degreeNumber,
      totalLessons,
      completedLessons,
      isAllCompleted,
      averageScore,
      lessonStatusList,
    };
  }

  // Alias for backward compatibility
  public checkApprenticeQuizzesProgress(userId: string, degreeNumber: number = 1) {
    return this.checkDegreeQuizzesProgress(userId, degreeNumber);
  }

  public getSalaryRequests(): SalaryIncreaseRequest[] {
    return [...this.salaryRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getSalaryRequestsByUser(userId: string): SalaryIncreaseRequest[] {
    return this.salaryRequests
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getLatestSalaryRequestByUser(userId: string): SalaryIncreaseRequest | null {
    const list = this.getSalaryRequestsByUser(userId);
    return list[0] || null;
  }

  public requestSalaryIncrease(params: {
    userId: string;
    justificationText?: string;
  }): { success: boolean; message: string; request?: SalaryIncreaseRequest } {
    const user = this.getUserById(params.userId) || DEMO_PROFILES.find((p) => p.id === params.userId);
    if (!user) {
      return { success: false, message: 'Irmão não localizado no quadro de obreiros.' };
    }

    const currentDeg = user.degree || 1;

    // Grau 3 is the highest symbolic degree in the platform
    if (currentDeg >= 3) {
      return {
        success: false,
        message: 'Você já atingiu o Grau 03 (Mestre Maçom), a plenitude dos Graus Simbólicos da Maçonaria Universal. Não há pedido de aumento de salário posterior a ser solicitado.',
      };
    }

    const progress = this.checkDegreeQuizzesProgress(params.userId, currentDeg);

    if (!progress.isAllCompleted) {
      return {
        success: false,
        message: `Ainda existem questionários pendentes no Grau 0${currentDeg} (${progress.completedLessons} de ${progress.totalLessons} concluídos). Conclua todos os questionários do seu grau para solicitar o Aumento de Salário.`,
      };
    }

    // Check if there is already a pending request for the current degree elevation
    const existingPending = this.salaryRequests.find(
      (r) => r.userId === params.userId && r.status === 'pending'
    );
    if (existingPending) {
      return {
        success: false,
        message: 'Você já possui um pedido solene de Aumento de Salário em análise pela Chancelaria.',
        request: existingPending,
      };
    }

    const targetDegree = currentDeg === 1 ? 2 : 3;
    const targetDegreeName = targetDegree === 2 ? 'Companheiro Maçom' : 'Mestre Maçom';
    const currentDegreeName = currentDeg === 1 ? 'Aprendiz Maçom' : 'Companheiro Maçom';

    const newRequest: SalaryIncreaseRequest = {
      id: `sal_req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      userCim: user.cimNumber || 'CIM Registrado',
      userLodge: user.lodge || 'Loja Maçônica Regular',
      userGrandLodge: user.grandLodge || 'Potência Regular',
      currentDegree: currentDeg,
      targetDegree,
      quizzesCompletedCount: progress.completedLessons,
      totalQuizzesCount: progress.totalLessons,
      averageQuizScore: progress.averageScore,
      justificationText:
        params.justificationText?.trim() ||
        `O Irmão concluiu com aproveitamento integral todos os questionários do Grau 0${currentDeg} (${currentDegreeName}), solicitando formalmente seu Aumento de Salário para o Grau 0${targetDegree} (${targetDegreeName}).`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.salaryRequests.unshift(newRequest);

    // 1. Send High-Priority Notification to Administrators
    this.addNotification({
      userId: 'all',
      title: '🏛️ Novo Pedido de Aumento de Salário',
      message: `O Ir.'. ${user.fullName} (${user.lodge}) concluiu todos os questionários do Grau 0${currentDeg} (${currentDegreeName}) e submeteu formalmente seu Pedido de Aumento de Salário para o Grau 0${targetDegree} (${targetDegreeName}).`,
      type: 'salary_request',
      link: 'admin-users',
      isRead: false,
    });

    // 2. Send Confirmation Notification to the Brother
    this.addNotification({
      userId: user.id,
      title: 'Pedido de Aumento de Salário Transmitido',
      message: `Seu pedido de passagem e Aumento de Salário para o Grau 0${targetDegree} (${targetDegreeName}) foi transmitido com sucesso à Chancelaria e aguarda análise.`,
      type: 'salary_request',
      link: 'salary-request',
      isRead: false,
    });

    // 3. Log into Audit Ledger
    this.logAction(
      user.fullName,
      'Pedido de Aumento de Salário',
      `O Ir.'. ${user.fullName} concluiu os ${progress.totalLessons} questionários do Grau 0${currentDeg} (Média ${progress.averageScore}/100) e solicitou Aumento de Salário para o Grau 0${targetDegree} (${targetDegreeName}).`,
      newRequest.id,
      'salary_request'
    );

    this.saveState();
    return {
      success: true,
      message: `Seu Pedido de Aumento de Salário para o Grau 0${targetDegree} (${targetDegreeName}) foi protocolado com sucesso!`,
      request: newRequest,
    };
  }

  public reviewSalaryRequest(params: {
    requestId: string;
    status: SalaryRequestStatus;
    adminNotes?: string;
    adminName: string;
    adminId?: string;
    autoPromoteDegree?: boolean;
  }): { success: boolean; message: string; request?: SalaryIncreaseRequest } {
    const req = this.salaryRequests.find((r) => r.id === params.requestId);
    if (!req) {
      return { success: false, message: 'Pedido não encontrado.' };
    }

    req.status = params.status;
    req.adminNotes = params.adminNotes || '';
    req.reviewedBy = params.adminId || 'admin';
    req.reviewedByName = params.adminName;
    req.reviewedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();

    const targetDegreeName = req.targetDegree === 2 ? 'Companheiro Maçom' : 'Mestre Maçom';

    if (params.status === 'approved') {
      if (params.autoPromoteDegree !== false) {
        const user = this.getUserById(req.userId);
        if (user) {
          user.degree = req.targetDegree;
          user.updatedAt = new Date().toISOString();
        }
      }

      this.addNotification({
        userId: req.userId,
        title: '🎉 Aumento de Salário APROVADO!',
        message: `Parabéns, Venerável Irmão! Seu Pedido de Aumento de Salário foi APROVADO pela Chancelaria. Você foi elevado ao Grau 0${req.targetDegree} (${targetDegreeName})!`,
        type: 'approval',
        link: 'salary-request',
        isRead: false,
      });

      this.logAction(
        params.adminName,
        'Aumento de Salário Aprovado',
        `Aprovado Aumento de Salário de ${req.userName} para o Grau 0${req.targetDegree} (${targetDegreeName}).`,
        req.id,
        'salary_request'
      );
    } else if (params.status === 'rejected') {
      this.addNotification({
        userId: req.userId,
        title: 'Parecer sobre Aumento de Salário',
        message: `Seu Pedido de Aumento de Salário para o Grau 0${req.targetDegree} foi devolvido para ajustes: "${params.adminNotes || 'Necessita de maior dedicação aos estudos.'}"`,
        type: 'warning',
        link: 'salary-request',
        isRead: false,
      });

      this.logAction(
        params.adminName,
        'Aumento de Salário Devolvido',
        `Pedido de Aumento de Salário de ${req.userName} para o Grau 0${req.targetDegree} retornado com observações.`,
        req.id,
        'salary_request'
      );
    }

    this.saveState();
    return { success: true, message: `Pedido de Aumento de Salário atualizado com sucesso.`, request: req };
  }

  // ==========================================
  // CONTROLE DE INSTRUÇÕES MINISTRADAS
  // ==========================================
  public getDeliveredInstructions(): DeliveredInstruction[] {
    return [...this.deliveredInstructions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getDeliveredInstructionById(id: string): DeliveredInstruction | undefined {
    return this.deliveredInstructions.find((item) => item.id === id);
  }

  public createDeliveredInstruction(
    data: Omit<DeliveredInstruction, 'id' | 'createdAt' | 'updatedAt'>
  ): DeliveredInstruction {
    const newInstruction: DeliveredInstruction = {
      ...data,
      id: `inst_deliv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.deliveredInstructions.unshift(newInstruction);
    this.saveState();
    syncDocToCloud('delivered_instructions', newInstruction.id, newInstruction);

    this.logAction(
      data.registeredByName || data.instructorName || 'Sistema',
      'Instrução Ministrada Registrada',
      `Registrada instrução "${newInstruction.title}" aplicada na ${newInstruction.lodgeName} por ${newInstruction.instructorName} (${newInstruction.instructorRole}).`,
      newInstruction.id,
      'delivered_instruction'
    );

    return newInstruction;
  }

  public updateDeliveredInstruction(
    id: string,
    data: Partial<DeliveredInstruction>
  ): DeliveredInstruction | null {
    const index = this.deliveredInstructions.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updated: DeliveredInstruction = {
      ...this.deliveredInstructions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.deliveredInstructions[index] = updated;
    this.saveState();
    syncDocToCloud('delivered_instructions', id, updated);

    this.logAction(
      data.registeredByName || updated.instructorName || 'Sistema',
      'Instrução Ministrada Atualizada',
      `Atualizados dados da instrução "${updated.title}" na loja ${updated.lodgeName}.`,
      updated.id,
      'delivered_instruction'
    );

    return updated;
  }

  public deleteDeliveredInstruction(id: string): boolean {
    const index = this.deliveredInstructions.findIndex((item) => item.id === id);
    if (index === -1) return false;

    const removed = this.deliveredInstructions.splice(index, 1)[0];
    this.saveState();
    deleteDocFromCloud('delivered_instructions', id);

    this.logAction(
      'Administrador',
      'Instrução Ministrada Excluída',
      `Excluído registro da instrução "${removed.title}" (Loja: ${removed.lodgeName}).`,
      id,
      'delivered_instruction'
    );

    return true;
  }

  public getDeliveredInstructionsByLodge(lodgeName: string): DeliveredInstruction[] {
    if (!lodgeName) return this.getDeliveredInstructions();
    const query = lodgeName.toLowerCase();
    return this.deliveredInstructions
      .filter((item) => item.lodgeName.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getDeliveredInstructionsByInstructor(instructorName: string): DeliveredInstruction[] {
    if (!instructorName) return this.getDeliveredInstructions();
    const query = instructorName.toLowerCase();
    return this.deliveredInstructions
      .filter((item) => item.instructorName.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getDeliveredInstructionsByDegree(degree: number): DeliveredInstruction[] {
    if (degree === undefined || degree === 0) return this.getDeliveredInstructions();
    return this.deliveredInstructions
      .filter((item) => item.degreeNumber === degree)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ==========================================
  // BIBLIOTECA DE APOIO (VÍDEOS, PDFS, ÁUDIOS)
  // ==========================================

  public getSupportMaterials(
    degreeFilter?: number,
    mediaTypeFilter?: string,
    categoryFilter?: string,
    searchQuery?: string
  ): SupportMaterial[] {
    let result = [...this.supportMaterials];

    if (degreeFilter !== undefined && degreeFilter !== null && degreeFilter !== -1) {
      // 0 means general (all degrees)
      result = result.filter(
        (m) => m.degreeNumber === degreeFilter || m.degreeNumber === 0 || degreeFilter === 0
      );
    }

    if (mediaTypeFilter && mediaTypeFilter !== 'all') {
      result = result.filter((m) => m.mediaType === mediaTypeFilter);
    }

    if (categoryFilter && categoryFilter !== 'all') {
      result = result.filter((m) => m.category === categoryFilter);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          (m.author && m.author.toLowerCase().includes(q)) ||
          (m.tags && m.tags.some((t) => t.toLowerCase().includes(q))) ||
          (m.fileName && m.fileName.toLowerCase().includes(q))
      );
    }

    // Sort: Featured first, then newest
    return result.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public getSupportMaterialById(id: string): SupportMaterial | undefined {
    return this.supportMaterials.find((m) => m.id === id);
  }

  public addSupportMaterial(
    materialData: Omit<SupportMaterial, 'id' | 'createdAt' | 'updatedAt'>,
    adminName?: string
  ): SupportMaterial {
    const newId = `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newMaterial: SupportMaterial = {
      ...materialData,
      id: newId,
      downloadsCount: materialData.downloadsCount || 0,
      viewsCount: materialData.viewsCount || 0,
      createdAt: now,
      updatedAt: now,
    };

    this.supportMaterials.unshift(newMaterial);
    this.saveState();
    syncDocToCloud('support_materials', newMaterial.id, newMaterial);

    this.logAction(
      adminName || materialData.uploaderName || 'Sistema',
      'Material de Apoio Adicionado',
      `Novo material "${newMaterial.title}" (${newMaterial.mediaType.toUpperCase()}) adicionado à Biblioteca de Apoio.`,
      newMaterial.id,
      'support_material'
    );

    return newMaterial;
  }

  public updateSupportMaterial(
    id: string,
    data: Partial<SupportMaterial>,
    adminName?: string
  ): SupportMaterial | null {
    const index = this.supportMaterials.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const updated: SupportMaterial = {
      ...this.supportMaterials[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.supportMaterials[index] = updated;
    this.saveState();
    syncDocToCloud('support_materials', id, updated);

    this.logAction(
      adminName || updated.uploaderName || 'Sistema',
      'Material de Apoio Atualizado',
      `Material "${updated.title}" atualizado na Biblioteca de Apoio.`,
      updated.id,
      'support_material'
    );

    return updated;
  }

  public deleteSupportMaterial(id: string, adminName?: string): boolean {
    const index = this.supportMaterials.findIndex((m) => m.id === id);
    if (index === -1) return false;

    const removed = this.supportMaterials.splice(index, 1)[0];
    this.saveState();
    deleteDocFromCloud('support_materials', id);

    this.logAction(
      adminName || 'Administrador',
      'Material de Apoio Excluído',
      `Material "${removed.title}" (${removed.mediaType.toUpperCase()}) removido da Biblioteca de Apoio.`,
      id,
      'support_material'
    );

    return true;
  }

  public incrementMaterialDownload(id: string): void {
    const material = this.supportMaterials.find((m) => m.id === id);
    if (material) {
      material.downloadsCount = (material.downloadsCount || 0) + 1;
      this.saveState();
    }
  }

  public incrementMaterialView(id: string): void {
    const material = this.supportMaterials.find((m) => m.id === id);
    if (material) {
      material.viewsCount = (material.viewsCount || 0) + 1;
      this.saveState();
    }
  }
}

export const dataStore = new DataStore();
