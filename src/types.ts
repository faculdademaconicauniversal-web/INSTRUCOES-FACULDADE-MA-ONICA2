export type UserRole = 'admin' | 'instructor' | 'brother';
export type UserStatus = 'pending' | 'approved' | 'blocked';

export interface UserProfile {
  id: string;
  fullName: string;
  masonicName?: string;
  email: string;
  phone?: string;
  age?: number; // Trava de Segurança: Idade do membro cadastrada pelo gestor
  birthDate?: string; // Data de nascimento
  lodge: string; // Loja Maçônica
  grandLodge: string; // Potência (GOMAU, GLMEMG, GLESP, COMAB, etc.)
  degree: number; // Grau atual (1, 2, 3...)
  cimNumber: string; // Trava de Segurança: Número de registro interno / CIM
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  temporaryPassword?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Degree {
  id: string;
  degreeNumber: number;
  title: string; // ex: "Grau 01"
  name: string; // ex: "Aprendiz Maçom"
  description: string;
  color?: string;
  allowPreviousDegrees: boolean;
  passingGrade?: number;
  requireSubmissionApproval?: boolean;
  isActive: boolean;
  order: number;
  totalLessons?: number;
  completedLessons?: number;
  progressPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  degreeId?: string;
  degreeNumber: number;
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type LessonStatus = 'draft' | 'published' | 'archived';

export interface LessonAttachment {
  name: string;
  url: string;
  type: string;
  size?: string;
}

export interface Lesson {
  id: string;
  number?: number;
  order?: number;
  title: string;
  subtitle?: string;
  summary?: string;
  degreeId?: string;
  degreeNumber: number;
  moduleId: string;
  moduleTitle?: string;
  objective?: string;
  content: string; // Rich text / markdown
  videoUrl?: string;
  audioUrl?: string;
  attachments?: LessonAttachment[];
  essayPrompt?: string;
  minimumPassingGrade?: number;
  estimatedMinutes?: number;
  status: LessonStatus;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'written';

export interface Question {
  id: string;
  lessonId: string;
  degreeNumber?: number;
  order: number; // 1 to 10
  type: QuestionType;
  prompt?: string;
  question?: string; // alias for prompt
  options?: string[]; // exactly 4 for multiple choice
  correctAnswer?: string;
  explanation?: string;
  points: number; // usually 10 points
  createdAt?: string;
  updatedAt?: string;
}

export type QuizQuestion = Question;

export interface QuizUserAnswer {
  questionId: string;
  questionOrder?: number;
  questionType?: QuestionType;
  prompt?: string;
  userAnswer?: string;
  selectedOption?: number;
  booleanAnswer?: boolean;
  writtenAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  awardedPoints?: number;
  instructorFeedback?: string;
}

export type UserAnswer = QuizUserAnswer;

export interface QuizAttempt {
  id: string;
  userId: string;
  userName: string;
  userDegree?: number;
  lessonId: string;
  lessonTitle: string;
  degreeNumber: number;
  attemptNumber: number;
  answers: QuizUserAnswer[];
  score: number; // 0 to 100
  correctCount: number;
  errorCount: number;
  isPassed: boolean;
  hasPendingManualGrading: boolean;
  discursiveAnswer?: string;
  status: 'approved' | 'rejected' | 'pending_review';
  feedback: string;
  gradedBy?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionStatus =
  | 'enviada'
  | 'em_analise'
  | 'aprovada'
  | 'necessita_correcao'
  | 'rejeitada'
  | 'reenviar';

export interface Submission {
  id: string;
  userId: string;
  userName: string;
  userDegree: number;
  userLodge?: string;
  lessonId: string;
  lessonTitle: string;
  degreeNumber: number;
  title: string;
  comments: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  status: SubmissionStatus;
  grade?: number; // 0 to 100
  feedback?: string;
  instructorOrientation?: string;
  evaluatedBy?: string;
  evaluatedByName?: string;
  evaluatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'lesson'
  | 'quiz'
  | 'submission'
  | 'degree'
  | 'salary_request'
  | 'announcement'
  | 'general'
  | 'approval'
  | 'reminder'
  | 'warning'
  | 'info';

export interface AppNotification {
  id: string;
  userId: string; // Specific user ID or 'all'
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  userCim: string;
  userLodge: string;
  userGrandLodge: string;
  degreeNumber: number;
  degreeName: string;
  institutionName: string;
  certificateNumber: string;
  issueDate: string;
  responsibleName?: string;
  responsibleRole?: string;
  grandMasterName?: string;
  grandMasterRole?: string;
  inspectorName?: string;
  inspectorRole?: string;
  qrCodeData?: string;
  qrCodeVerificationUrl?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName: string;
  action: string;
  details: string;
  targetId?: string;
  targetType?: string;
  timestamp?: string;
  createdAt: string;
}

export interface AppSetting {
  id?: string;
  institutionName: string;
  grandMasterName?: string;
  grandMasterRole?: string;
  grandLodgeAffiliation?: string;
  defaultPassingGrade: number;
  allowPreviousDegreesGlobal?: boolean;
  allowRegistration?: boolean;
  autoApproveUsers?: boolean;
  enableEmailAlerts?: boolean;
  maxUploadSizeBytes?: number;
  requireApprovalForRegistration?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export type SalaryRequestStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface MemberAuthorization {
  id: string;
  tokenCode: string; // ex: AUTH-G1-928301, AUTH-G2-192837, AUTH-G3-882910
  fullName: string;
  email: string;
  phone?: string;
  age?: number; // Trava de Segurança: Idade do membro cadastrada pelo gestor
  birthDate?: string;
  cimNumber: string; // Trava de Segurança: CIM cadastrado
  lodge: string;
  grandLodge: string;
  authorizedDegree: number; // 1 = Aprendiz, 2 = Companheiro, 3 = Mestre
  role: UserRole;
  status: 'pending' | 'used' | 'revoked';
  temporaryPassword?: string;
  notes?: string;
  createdById: string;
  createdByName: string;
  usedByUserId?: string;
  usedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SalaryIncreaseRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userCim: string;
  userLodge: string;
  userGrandLodge: string;
  currentDegree: number; // usually 1 for Apprentice
  targetDegree: number; // usually 2 for Fellowcraft
  quizzesCompletedCount: number;
  totalQuizzesCount: number;
  averageQuizScore: number;
  justificationText?: string;
  status: SalaryRequestStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveredInstruction {
  id: string;
  title: string; // Título da instrução ministrada
  date: string; // Data de aplicação (YYYY-MM-DD)
  lodgeName: string; // Nome da loja que foi aplicada
  orientCity?: string; // Oriente / Cidade
  grandLodge?: string; // Potência / Obediência Maçônica
  instructorName: string; // Nome de quem aplicou
  instructorRole: string; // Cargo de quem aplicou (ex: Venerável Mestre, 1º Vigilante, 2º Vigilante, Grande Inspetor Geral, Mestre de Instrução, Orador, etc.)
  instructorCim?: string; // CIM do aplicador/instrutor
  degreeNumber: number; // Grau da Instrução (1 - Aprendiz, 2 - Companheiro, 3 - Mestre, 0 - Geral)
  degreeName?: string; // Nome do Grau (ex: "Grau 01 - Aprendiz Maçom")
  sessionType?: string; // Tipo de Sessão (ex: Sessão Magna de Instrução, Sessão Econômica Ordinária, Sessão Especial de Aprendizes)
  attendeesCount?: number; // Número de Irmãos presentes
  summaryNotes?: string; // Resumo e Pauta da Instrução / Temas debatidos
  practicalExercises?: string; // Dinâmica ou trabalho prático realizado em Loja
  attachmentsUrl?: string; // Link de Prancha ou material de apoio
  status: 'concluida' | 'agendada' | 'em_andamento';
  registeredById?: string; // ID do usuário que registrou
  registeredByName?: string; // Nome do usuário que registrou
  createdAt: string;
  updatedAt: string;
}

export type SupportMediaType = 'pdf' | 'video' | 'audio' | 'document';

export interface SupportMaterial {
  id: string;
  title: string; // Título do material de apoio
  description: string; // Descrição ou resumo do conteúdo
  mediaType: SupportMediaType; // 'pdf' | 'video' | 'audio' | 'document'
  degreeNumber: number; // 1 - Aprendiz, 2 - Companheiro, 3 - Mestre, 0 - Geral / Todos
  degreeName?: string; // ex: "Grau 01 • Aprendiz Maçom"
  category: string; // ex: 'Rituais & Liturgia', 'Simbologia & Filosofia', 'História & Tradição', 'Música Harmônica', 'Pranchas de Arquitetura', 'Landmarks & Legislação'
  fileUrl?: string; // URL do arquivo ou base64 data URI
  fileName?: string; // Nome do arquivo enviado
  fileSize?: string; // ex: "4.8 MB"
  externalUrl?: string; // Link externo (YouTube, Vimeo, Google Drive, Spotify, etc.)
  embedUrl?: string; // URL para embed de vídeo/áudio
  duration?: string; // Para áudios e vídeos (ex: "18:45", "42 min")
  pagesCount?: number; // Para PDFs (ex: 28)
  author?: string; // Autor / Irmão / Potência / Grande Oriente
  uploaderId?: string;
  uploaderName?: string;
  uploaderRole?: string;
  thumbnailUrl?: string;
  tags?: string[];
  downloadsCount?: number;
  viewsCount?: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

