import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import config from '../firebase-applet-config.json';
import {
  INITIAL_SETTINGS,
  INITIAL_DEGREES,
  INITIAL_MODULES,
  INITIAL_LESSONS,
  INITIAL_DELIVERED_INSTRUCTIONS,
  INITIAL_SUPPORT_MATERIALS,
  INITIAL_QUESTIONS,
  DEMO_PROFILES,
} from '../src/lib/seedData';
import { MemberAuthorization } from '../src/types';

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

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

const INITIAL_AUTHORIZATIONS: MemberAuthorization[] = [
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

async function seedDatabase() {
  console.log('🚀 Iniciando atualização integral do banco de dados Cloud Firestore...');

  try {
    // 1. Settings
    console.log('📦 1/9 Gravando Configurações Globais...');
    await setDoc(doc(db, 'settings', 'global_settings'), cleanForFirestore(INITIAL_SETTINGS));

    // 2. Degrees
    console.log(`📦 2/9 Gravando Graus Maçônicos (${INITIAL_DEGREES.length})...`);
    for (const deg of INITIAL_DEGREES) {
      await setDoc(doc(db, 'degrees', deg.id), cleanForFirestore(deg));
    }

    // 3. Modules
    console.log(`📦 3/9 Gravando Módulos Curriculares (${INITIAL_MODULES.length})...`);
    for (const mod of INITIAL_MODULES) {
      await setDoc(doc(db, 'modules', mod.id), cleanForFirestore(mod));
    }

    // 4. Lessons
    console.log(`📦 4/9 Gravando Instruções Oficiais de Grau (${INITIAL_LESSONS.length})...`);
    for (const les of INITIAL_LESSONS) {
      await setDoc(doc(db, 'lessons', les.id), cleanForFirestore(les));
    }

    // 5. Delivered Instructions
    console.log(`📦 5/9 Gravando Instruções Ministradas em Templo (${INITIAL_DELIVERED_INSTRUCTIONS.length})...`);
    for (const deliv of INITIAL_DELIVERED_INSTRUCTIONS) {
      await setDoc(doc(db, 'delivered_instructions', deliv.id), cleanForFirestore(deliv));
    }

    // 6. Support Materials
    console.log(`📦 6/9 Gravando Materiais de Apoio & Biblioteca (${INITIAL_SUPPORT_MATERIALS.length})...`);
    for (const mat of INITIAL_SUPPORT_MATERIALS) {
      await setDoc(doc(db, 'support_materials', mat.id), cleanForFirestore(mat));
    }

    // 7. Questions
    console.log(`📦 7/9 Gravando Questões Avaliativas (${INITIAL_QUESTIONS.length})...`);
    for (const q of INITIAL_QUESTIONS) {
      await setDoc(doc(db, 'questions', q.id), cleanForFirestore(q));
    }

    // 8. Users
    console.log(`📦 8/9 Gravando Usuários & Perfis Homologados (${DEMO_PROFILES.length})...`);
    for (const u of DEMO_PROFILES) {
      await setDoc(doc(db, 'users', u.id), cleanForFirestore(u));
    }

    // 9. Authorizations / Travas de Acesso
    console.log(`📦 9/9 Gravando Travas de Acesso e Autorizações Prévias (${INITIAL_AUTHORIZATIONS.length})...`);
    for (const a of INITIAL_AUTHORIZATIONS) {
      await setDoc(doc(db, 'member_authorizations', a.id), cleanForFirestore(a));
    }

    console.log('✅ BANCO DE DADOS ATUALIZADO COM SUCESSO NO CLOUD FIRESTORE!');
    console.log(`- Graus: ${INITIAL_DEGREES.length}`);
    console.log(`- Módulos: ${INITIAL_MODULES.length}`);
    console.log(`- Instruções de Grau: ${INITIAL_LESSONS.length}`);
    console.log(`- Instruções em Templo: ${INITIAL_DELIVERED_INSTRUCTIONS.length}`);
    console.log(`- Materiais de Apoio: ${INITIAL_SUPPORT_MATERIALS.length}`);
    console.log(`- Questões: ${INITIAL_QUESTIONS.length}`);
    console.log(`- Usuários: ${DEMO_PROFILES.length}`);
    console.log(`- Autorizações / Travas: ${INITIAL_AUTHORIZATIONS.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao atualizar o banco de dados:', error);
    process.exit(1);
  }
}

seedDatabase();
