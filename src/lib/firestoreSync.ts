import {
  doc,
  setDoc,
  getDocs,
  collection,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { dataStore } from './dataStore';
import {
  INITIAL_DEGREES,
  INITIAL_MODULES,
  INITIAL_LESSONS,
  INITIAL_QUESTIONS,
  INITIAL_SETTINGS,
  INITIAL_SUPPORT_MATERIALS,
  INITIAL_DELIVERED_INSTRUCTIONS,
} from './seedData';
import {
  Degree,
  Module,
  Lesson,
  Question,
  AppSetting,
  UserProfile,
  DeliveredInstruction,
  SupportMaterial,
  MemberAuthorization,
} from '../types';

export interface SyncProgressCallback {
  (message: string, current: number, total: number): void;
}

export interface SyncResult {
  success: boolean;
  message: string;
  counts: {
    degrees: number;
    modules: number;
    lessons: number;
    deliveredInstructions: number;
    supportMaterials: number;
    questions: number;
    settings: number;
    users: number;
    authorizations: number;
  };
}

/**
 * Strips out `undefined` values from an object before sending to Firestore,
 * preventing 'Unsupported field value: undefined' fatal errors.
 */
function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore);
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Publishes all local data, degrees, modules, instructions (degrees + delivered in temple),
 * support library materials, and questions to Firebase Firestore.
 */
export async function publishAllDataToFirestore(
  onProgress?: SyncProgressCallback
): Promise<SyncResult> {
  const counts = {
    degrees: 0,
    modules: 0,
    lessons: 0,
    deliveredInstructions: 0,
    supportMaterials: 0,
    questions: 0,
    settings: 0,
    users: 0,
    authorizations: 0,
  };

  try {
    const totalSteps = 9;
    let currentStep = 0;

    // 1. Settings
    currentStep++;
    onProgress?.('Publicando configurações institucionais da Chancelaria...', currentStep, totalSteps);
    const settings = dataStore.getSystemSettings() || INITIAL_SETTINGS;
    await setDoc(doc(db, 'settings', 'global_config'), cleanForFirestore({
      ...settings,
      updatedAt: new Date().toISOString(),
    }));
    counts.settings = 1;

    // 2. Degrees (Symbolic Degrees 1, 2, 3)
    currentStep++;
    onProgress?.('Publicando os 3 Graus Simbólicos...', currentStep, totalSteps);
    const degrees = dataStore.getDegrees();
    const degreesList = degrees.length > 0 ? degrees : INITIAL_DEGREES;
    for (const d of degreesList) {
      await setDoc(doc(db, 'degrees', d.id), cleanForFirestore({
        ...d,
        updatedAt: new Date().toISOString(),
      }));
      counts.degrees++;
    }

    // 3. Modules (All 6 Thematic Modules)
    currentStep++;
    onProgress?.('Publicando os 6 Módulos de Ensino Doutrinário...', currentStep, totalSteps);
    const modules = dataStore.getModules();
    const modulesList = modules.length > 0 ? modules : INITIAL_MODULES;
    for (const m of modulesList) {
      await setDoc(doc(db, 'modules', m.id), cleanForFirestore({
        ...m,
        updatedAt: new Date().toISOString(),
      }));
      counts.modules++;
    }

    // 4. Lessons (All 9 Official Masonic Degree Instructions - Guaranteed Full Set)
    currentStep++;
    onProgress?.('Publicando todas as 9 Instruções Oficiais de Graus...', currentStep, totalSteps);
    const lessonsMap = new Map<string, Lesson>();
    // First, ensure all default official instructions are present
    INITIAL_LESSONS.forEach((l) => lessonsMap.set(l.id, l));
    // Then merge any lessons edited or created in the store
    dataStore.getLessons(99, true).forEach((l) => lessonsMap.set(l.id, l));
    const lessonsList = Array.from(lessonsMap.values());

    for (const l of lessonsList) {
      await setDoc(doc(db, 'lessons', l.id), cleanForFirestore({
        ...l,
        summary: l.summary || l.subtitle || '',
        estimatedMinutes: l.estimatedMinutes || 20,
        status: l.status || 'published',
        updatedAt: new Date().toISOString(),
      }));
      counts.lessons++;
    }

    // 5. Delivered Instructions in Temple (Instruções Ministradas em Loja/Templo)
    currentStep++;
    onProgress?.('Publicando todas as Instruções Ministradas em Templo...', currentStep, totalSteps);
    const deliveredMap = new Map<string, DeliveredInstruction>();
    INITIAL_DELIVERED_INSTRUCTIONS.forEach((d) => deliveredMap.set(d.id, d));
    dataStore.getDeliveredInstructions().forEach((d) => deliveredMap.set(d.id, d));
    const deliveredList = Array.from(deliveredMap.values());

    for (const d of deliveredList) {
      await setDoc(doc(db, 'delivered_instructions', d.id), cleanForFirestore({
        ...d,
        status: d.status || 'concluida',
        updatedAt: new Date().toISOString(),
      }));
      counts.deliveredInstructions++;
    }

    // 6. Support Materials (Apostilas, Manuais e Biblioteca de Apoio)
    currentStep++;
    onProgress?.('Publicando Biblioteca, Apostilas e Acervo de Apoio...', currentStep, totalSteps);
    const materialsMap = new Map<string, SupportMaterial>();
    INITIAL_SUPPORT_MATERIALS.forEach((m) => materialsMap.set(m.id, m));
    dataStore.getSupportMaterials().forEach((m) => materialsMap.set(m.id, m));
    const materialsList = Array.from(materialsMap.values());

    for (const m of materialsList) {
      await setDoc(doc(db, 'support_materials', m.id), cleanForFirestore({
        ...m,
        updatedAt: new Date().toISOString(),
      }));
      counts.supportMaterials++;
    }

    // 7. Questions (All 90 evaluation questions, chunked in batches of 250 for speed and stability)
    currentStep++;
    onProgress?.('Publicando banco de 90 Questões Avaliativas...', currentStep, totalSteps);
    const questions = dataStore.getAllQuestions();
    const questionsList = questions.length >= INITIAL_QUESTIONS.length ? questions : INITIAL_QUESTIONS;

    const BATCH_SIZE = 250;
    for (let i = 0; i < questionsList.length; i += BATCH_SIZE) {
      const chunk = questionsList.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const q of chunk) {
        const qRef = doc(db, 'questions', q.id);
        batch.set(qRef, cleanForFirestore({
          ...q,
          question: q.question || q.prompt || '',
          prompt: q.prompt || q.question || '',
        }));
      }
      await batch.commit();
      counts.questions += chunk.length;
    }

    // 8. Registered Users & Admin Credentials
    currentStep++;
    onProgress?.('Publicando membros e credenciais da Chancelaria...', currentStep, totalSteps);
    const users = dataStore.getUsers();
    for (const u of users) {
      await setDoc(doc(db, 'users', u.id), cleanForFirestore({
        ...u,
        updatedAt: new Date().toISOString(),
      }));
      counts.users++;
    }

    // 9. Member Authorizations & Access Security Locks (E-mail, CIM e Idade)
    currentStep++;
    onProgress?.('Publicando Travas de Acesso e Autorizações Prévias...', currentStep, totalSteps);
    const authorizations = dataStore.getAuthorizations();
    for (const a of authorizations) {
      await setDoc(doc(db, 'member_authorizations', a.id), cleanForFirestore({
        ...a,
        updatedAt: new Date().toISOString(),
      }));
      counts.authorizations++;
    }

    onProgress?.('Publicação concluída com sucesso!', totalSteps, totalSteps);

    const totalInstructions = counts.lessons + counts.deliveredInstructions;
    return {
      success: true,
      message: `Todo o acervo (${totalInstructions} Instruções no total: ${counts.lessons} Instruções Oficiais de Graus e ${counts.deliveredInstructions} Instruções em Templo; ${counts.supportMaterials} Apostilas/Manuais; ${counts.questions} Questões Avaliativas; ${counts.degrees} Graus, ${counts.modules} Módulos e ${counts.authorizations} Travas de Acesso) foi publicado com êxito no Firebase Firestore!`,
      counts,
    };
  } catch (err: any) {
    console.error('Erro na publicação para Firestore:', err);
    throw new Error(err.message || 'Falha ao sincronizar banco de dados com Firestore.');
  }
}

/**
 * Loads published data from Firestore into local dataStore
 */
export async function loadAllDataFromFirestore(): Promise<boolean> {
  try {
    const cloudData: {
      degrees?: Degree[];
      modules?: Module[];
      lessons?: Lesson[];
      deliveredInstructions?: DeliveredInstruction[];
      supportMaterials?: SupportMaterial[];
      questions?: Question[];
      settings?: AppSetting;
      users?: UserProfile[];
      authorizations?: MemberAuthorization[];
    } = {};

    // 1. Fetch settings
    const settingsSnap = await getDocs(collection(db, 'settings'));
    if (!settingsSnap.empty) {
      cloudData.settings = settingsSnap.docs[0].data() as AppSetting;
    }

    // 2. Fetch degrees
    const degreesSnap = await getDocs(collection(db, 'degrees'));
    if (!degreesSnap.empty) {
      const loadedDegrees: Degree[] = [];
      degreesSnap.forEach((d) => {
        loadedDegrees.push(d.data() as Degree);
      });
      loadedDegrees.sort((a, b) => a.order - b.order);
      cloudData.degrees = loadedDegrees;
    }

    // 3. Fetch modules
    const modulesSnap = await getDocs(collection(db, 'modules'));
    if (!modulesSnap.empty) {
      const loadedModules: Module[] = [];
      modulesSnap.forEach((m) => {
        loadedModules.push(m.data() as Module);
      });
      loadedModules.sort((a, b) => a.order - b.order);
      cloudData.modules = loadedModules;
    }

    // 4. Fetch lessons
    const lessonsSnap = await getDocs(collection(db, 'lessons'));
    if (!lessonsSnap.empty) {
      const loadedLessons: Lesson[] = [];
      lessonsSnap.forEach((d) => {
        loadedLessons.push(d.data() as Lesson);
      });
      loadedLessons.sort((a, b) => (a.order || a.number) - (b.order || b.number));
      cloudData.lessons = loadedLessons;
    }

    // 5. Fetch delivered instructions
    const deliveredSnap = await getDocs(collection(db, 'delivered_instructions'));
    if (!deliveredSnap.empty) {
      const loadedDelivered: DeliveredInstruction[] = [];
      deliveredSnap.forEach((d) => {
        loadedDelivered.push(d.data() as DeliveredInstruction);
      });
      cloudData.deliveredInstructions = loadedDelivered;
    }

    // 6. Fetch support materials
    const materialsSnap = await getDocs(collection(db, 'support_materials'));
    if (!materialsSnap.empty) {
      const loadedMaterials: SupportMaterial[] = [];
      materialsSnap.forEach((d) => {
        loadedMaterials.push(d.data() as SupportMaterial);
      });
      cloudData.supportMaterials = loadedMaterials;
    }

    // 7. Fetch questions
    const questionsSnap = await getDocs(collection(db, 'questions'));
    if (!questionsSnap.empty) {
      const loadedQuestions: Question[] = [];
      questionsSnap.forEach((d) => {
        loadedQuestions.push(d.data() as Question);
      });
      cloudData.questions = loadedQuestions;
    }

    // 8. Fetch users
    const usersSnap = await getDocs(collection(db, 'users'));
    if (!usersSnap.empty) {
      const loadedUsers: UserProfile[] = [];
      usersSnap.forEach((u) => {
        loadedUsers.push(u.data() as UserProfile);
      });
      cloudData.users = loadedUsers;
    }

    // 9. Fetch authorizations & access locks
    const authSnap = await getDocs(collection(db, 'member_authorizations'));
    if (!authSnap.empty) {
      const loadedAuths: MemberAuthorization[] = [];
      authSnap.forEach((a) => {
        loadedAuths.push(a.data() as MemberAuthorization);
      });
      cloudData.authorizations = loadedAuths;
    }

    // Apply cloud data to in-memory store and persist
    dataStore.syncFromCloud(cloudData);

    return true;
  } catch (err) {
    console.warn('Notice loading Firestore cloud documents:', err);
    return false;
  }
}
