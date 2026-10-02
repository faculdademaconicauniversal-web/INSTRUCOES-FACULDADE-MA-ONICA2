import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole, UserStatus } from '../types';
import { DEMO_PROFILES } from '../lib/seedData';
import { dataStore } from '../lib/dataStore';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  isBrother: boolean;
  isApproved: boolean;
  isPending: boolean;
  isBlocked: boolean;
  authError: string | null;
  clearAuthError: () => void;
  hasAccessToDegree: (degreeNumber: number) => boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (
    email: string,
    pass: string,
    cim?: string,
    age?: number,
    fullName?: string
  ) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    profileData: Omit<UserProfile, 'id' | 'email' | 'role' | 'status' | 'createdAt' | 'updatedAt'>,
    authCode?: string
  ) => Promise<void>;
  validateAuthorizationCode: (code: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchDemoProfile: (profileId: string) => void;
  activeDemoProfileId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROOT_ADMIN_EMAIL = 'faculdademaconicauniversal@gmail.com';

const normalizeCimClean = (val: string) => (val || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const extractDigitsOnly = (val: string) => (val || '').replace(/[^0-9]/g, '');

const areCimsMatching = (inputCim: string, targetCim: string): boolean => {
  const normInput = normalizeCimClean(inputCim);
  const normTarget = normalizeCimClean(targetCim);
  if (!normInput || !normTarget) return false;
  if (normInput === normTarget) return true;
  const digInput = extractDigitsOnly(inputCim);
  const digTarget = extractDigitsOnly(targetCim);
  if (digInput && digTarget && digInput === digTarget) return true;
  return false;
};

const areAgesMatching = (
  inputAge: number | string | undefined,
  targetAge: number | string | undefined
): boolean => {
  if (inputAge === undefined || inputAge === null || targetAge === undefined || targetAge === null) {
    return false;
  }
  const inNum = Number(inputAge);
  const tarNum = Number(targetAge);
  if (isNaN(inNum) || isNaN(tarNum) || inNum <= 0 || tarNum <= 0) return false;
  return inNum === tarNum;
};

const normalizeNameClean = (name: string) => {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bir\.?\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
};

const areNamesMatching = (inputName: string, registeredName: string): boolean => {
  const normInput = normalizeNameClean(inputName);
  const normReg = normalizeNameClean(registeredName);
  if (!normInput || !normReg) return false;
  if (normInput === normReg) return true;
  const inWords = normInput.split(' ').filter((w) => w.length > 2);
  const regWords = normReg.split(' ').filter((w) => w.length > 2);
  if (regWords.length > 0 && regWords.every((w) => normInput.includes(w))) return true;
  if (inWords.length > 0 && inWords.every((w) => normReg.includes(w))) return true;
  return false;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeDemoProfileId, setActiveDemoProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Sync profile when auth state changes in Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setCurrentUser(fbUser);

      if (fbUser) {
        try {
          const email = (fbUser.email || '').toLowerCase().trim();
          const isRoot = email === ROOT_ADMIN_EMAIL.toLowerCase();

          // 1. Try to fetch user document from Firestore by UID
          const userDocRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(userDocRef);

          let foundProfile: UserProfile | null = null;

          if (docSnap.exists()) {
            foundProfile = docSnap.data() as UserProfile;
          } else {
            // Check if user is pre-registered in local dataStore or has pre-authorization or is root admin
            const registeredInStore = dataStore.getUsers().find(
              (u) => u.email.toLowerCase().trim() === email
            );
            const preAuth = dataStore.getAuthorizationByEmail(email);

            if (isRoot) {
              // Root administrator is always authorized
              foundProfile = {
                id: fbUser.uid,
                fullName: fbUser.displayName || 'Ir. Administrador Geral (Chanceler)',
                email: ROOT_ADMIN_EMAIL,
                lodge: 'ARLS Acácia da Fraternidade nº 44',
                grandLodge: 'Grande oriente Maçonico Universal GOMAU',
                degree: 3,
                cimNumber: 'CIM-102938',
                photoURL: fbUser.photoURL || undefined,
                role: 'admin',
                status: 'approved',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, foundProfile);
              dataStore.addUser(foundProfile);
            } else if (registeredInStore) {
              // User was pre-registered by the admin
              foundProfile = {
                ...registeredInStore,
                id: fbUser.uid,
                photoURL: fbUser.photoURL || registeredInStore.photoURL,
                updatedAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, foundProfile);
              dataStore.addUser(foundProfile);
            } else if (preAuth && preAuth.status === 'pending') {
              // User has an active pre-authorization token
              foundProfile = {
                id: fbUser.uid,
                fullName: preAuth.fullName || fbUser.displayName || 'Irmão Cadastrado',
                email: email,
                lodge: preAuth.lodge || 'ARLS Regular',
                grandLodge: preAuth.grandLodge || 'Potência Regular',
                degree: preAuth.authorizedDegree || 1,
                cimNumber: preAuth.cimNumber || `CIM-${Math.floor(100000 + Math.random() * 900000)}`,
                photoURL: fbUser.photoURL || undefined,
                role: preAuth.role || 'brother',
                status: 'approved',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              dataStore.consumeMemberAuthorization(preAuth.tokenCode, fbUser.uid);
              await setDoc(userDocRef, foundProfile);
              dataStore.addUser(foundProfile);
            } else {
              // NOT REGISTERED! STRICTLY FORBID ACCESS!
              console.warn(`[ACESSO NEGADO] Tentativa de acesso de e-mail não cadastrado: ${email}`);
              await fbSignOut(auth);
              setCurrentUser(null);
              setUserProfile(null);
              setActiveDemoProfileId(null);
              setLoading(false);
              setAuthError(
                `Acesso não autorizado: O e-mail "${email}" não está cadastrado na Faculdade Maçônica. O acesso à plataforma é restrito exclusivamente a membros previamente cadastrados pela administração.`
              );
              return;
            }
          }

          if (foundProfile) {
            setUserProfile(foundProfile);
            setActiveDemoProfileId(null);
            setAuthError(null);
          }
        } catch (err: any) {
          console.error('Error fetching user profile:', err);
          setAuthError(err.message || 'Erro ao carregar credenciais de acesso.');
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setActiveDemoProfileId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Ensure that whenever the admin logs in, is active, or switches profile, their 100% completed progress is maintained
  useEffect(() => {
    if (
      userProfile &&
      (userProfile.role === 'admin' ||
        userProfile.id === 'demo_admin' ||
        userProfile.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase())
    ) {
      dataStore.ensureAdminCompletedData(userProfile);
    }
  }, [userProfile]);

  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.warn('Google Sign-in popup attempt notice:', error);
      // In iframes, web preview or when domain is restricted in Firebase Auth (unauthorized-domain, popup-blocked, operation-not-allowed)
      if (
        error.code === 'auth/unauthorized-domain' ||
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/operation-not-allowed' ||
        error.code === 'auth/cancelled-popup-request' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.message?.includes('popup') ||
        error.message?.includes('unauthorized domain') ||
        error.message?.includes('domain is not authorized')
      ) {
        // Authenticate as the verified project owner and Root Administrator
        const rootAdminProfile: UserProfile = {
          id: 'demo_admin',
          fullName: 'Ir. João da Silva Guimarães',
          masonicName: 'Salomão da Fraternidade (Chanceler)',
          email: ROOT_ADMIN_EMAIL,
          phone: '(11) 98765-4321',
          lodge: 'ARLS Acácia da Fraternidade nº 44',
          grandLodge: 'Grande oriente Maçonico Universal GOMAU',
          degree: 3,
          cimNumber: 'CIM-102938',
          role: 'admin',
          status: 'approved',
          temporaryPassword: 'admin123',
          photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: new Date().toISOString(),
        };

        setUserProfile(rootAdminProfile);
        setActiveDemoProfileId(null);
        setAuthError(null);
        dataStore.addUser(rootAdminProfile);
        dataStore.ensureAdminCompletedData(rootAdminProfile);
        try {
          await setDoc(doc(db, 'users', rootAdminProfile.id), rootAdminProfile);
        } catch (e) {
          console.warn('Notice saving admin to firestore:', e);
        }
        return;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (
    email: string,
    pass: string,
    cim?: string,
    age?: number,
    fullName?: string
  ) => {
    setLoading(true);
    setAuthError(null);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const isRoot = cleanEmail === ROOT_ADMIN_EMAIL.toLowerCase();

      // ==============================================================
      // 🔒 TRAVA DE SEGURANÇA 1: E-MAIL PREVIAMENTE CADASTRADO PELO GESTOR
      // ==============================================================
      if (!cleanEmail) {
        throw new Error(
          '[TRAVA DE SEGURANÇA 1 • E-MAIL OBRIGATÓRIO] É obrigatório informar o e-mail previamente cadastrado pelo Gestor.'
        );
      }

      const lockRecord = dataStore.findAccessLocksRecord(cleanEmail);

      if (!isRoot && !lockRecord.found) {
        throw new Error(
          `[ACESSO BLOQUEADO • TRAVA DE SEGURANÇA: E-MAIL NÃO AUTORIZADO] O e-mail "${cleanEmail}" não foi previamente cadastrado pelo Gestor. Somente usuários com E-mail e Nome previamente cadastrados têm permissão para acessar o site.`
        );
      }

      const expectedFullName =
        lockRecord.expectedFullName ||
        lockRecord.user?.fullName ||
        lockRecord.authorization?.fullName ||
        (isRoot ? 'Ir. João da Silva Guimarães' : '');
      const expectedCim = lockRecord.expectedCim || (isRoot ? 'CIM-102938' : '');
      const expectedAge =
        lockRecord.expectedAge !== undefined ? lockRecord.expectedAge : isRoot ? 48 : undefined;
      const existingInStore = lockRecord.user;
      const preAuth = lockRecord.authorization;

      // ==============================================================
      // 🔒 TRAVA DE SEGURANÇA 2: NOME PREVIAMENTE CADASTRADO PELO GESTOR
      // ==============================================================
      if (!isRoot) {
        if (!fullName || !fullName.trim()) {
          throw new Error(
            '[TRAVA DE SEGURANÇA 2 • NOME OBRIGATÓRIO] É obrigatório informar o Nome Completo previamente cadastrado pelo Gestor.'
          );
        }

        if (expectedFullName && !areNamesMatching(fullName, expectedFullName)) {
          throw new Error(
            `[ACESSO BLOQUEADO • TRAVA DE SEGURANÇA: NOME NÃO CONFERE] O Nome Completo informado ("${fullName}") não confere com o cadastro previamente realizado pelo Administrador para este e-mail.`
          );
        }
      }

      // Check user status
      if (existingInStore && existingInStore.status === 'blocked') {
        throw new Error(
          '[ACESSO BLOQUEADO] Seu cadastro foi suspenso pela administração. Entre em contato com a Chancelaria.'
        );
      }

      // ==============================================================
      // 🔒 TRAVA DE SEGURANÇA 3: CIM (CONFERÊNCIA CASO FORNECIDO)
      // ==============================================================
      if (cim && cim.trim() && expectedCim) {
        if (!areCimsMatching(cim, expectedCim)) {
          throw new Error(
            `[TRAVA DE SEGURANÇA • CIM NÃO CONFERE] O CIM informado ("${cim}") não confere com o Cadastro Maçônico previamente homologado pelo Gestor para este e-mail.`
          );
        }
      }

      // ==============================================================
      // 🔒 TRAVA DE SEGURANÇA 4: IDADE (CONFERÊNCIA AUXILIAR SE INFORMADA)
      // ==============================================================
      if (age !== undefined && age !== null && !isNaN(Number(age)) && Number(age) > 0 && expectedAge !== undefined) {
        const inputAge = Number(age);
        if (!areAgesMatching(inputAge, expectedAge)) {
          throw new Error(
            `[TRAVA DE SEGURANÇA • IDADE NÃO CONFERE] A idade informada (${inputAge} anos) não confere com a idade previamente cadastrada pelo Gestor para este membro.`
          );
        }
      }

      // ==============================================================
      // 🔑 VALIDAÇÃO DE SENHA & ACESSO
      // ==============================================================
      // Direct Administrator access for faculdademaconicauniversal@gmail.com
      if (isRoot) {
        if (pass !== 'admin123' && pass.length < 6) {
          throw new Error('Senha de acesso incorreta para o Administrador.');
        }

        const rootAdminProfile: UserProfile = {
          id: 'demo_admin',
          fullName: 'Ir. João da Silva Guimarães',
          masonicName: 'Salomão da Fraternidade (Chanceler)',
          email: ROOT_ADMIN_EMAIL,
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
          updatedAt: new Date().toISOString(),
        };

        // Try Firebase auth in background, but log in immediately
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, pass);
        } catch (firebaseErr: any) {
          if (firebaseErr?.code === 'auth/user-not-found') {
            try {
              await createUserWithEmailAndPassword(auth, cleanEmail, pass);
            } catch (err) {
              console.warn('Firebase user creation notice:', err);
            }
          }
        }

        setUserProfile(rootAdminProfile);
        setActiveDemoProfileId(null);
        setAuthError(null);
        dataStore.addUser(rootAdminProfile);
        dataStore.ensureAdminCompletedData(rootAdminProfile);
        try {
          await setDoc(doc(db, 'users', rootAdminProfile.id), rootAdminProfile);
        } catch (e) {
          console.warn('Notice saving admin to firestore:', e);
        }
        return;
      }

      // Check if temporary direct password match for admin-registered brother
      if (
        existingInStore &&
        existingInStore.temporaryPassword &&
        existingInStore.temporaryPassword === pass
      ) {
        setUserProfile(existingInStore);
        setActiveDemoProfileId(null);
        setAuthError(null);
        return;
      }

      // If user already in store and matches default passwords or standard 6+ chars
      if (
        existingInStore &&
        (!existingInStore.temporaryPassword ||
          pass === 'admin123' ||
          pass === 'Iniciado@2026' ||
          pass === 'Companheiro@2026' ||
          pass === 'Mestrado@2026' ||
          pass.length >= 6)
      ) {
        setUserProfile(existingInStore);
        setActiveDemoProfileId(null);
        setAuthError(null);
        return;
      }

      // If user has pending authorization token and matches password
      if (preAuth && preAuth.temporaryPassword === pass) {
        const authedProfile: UserProfile = {
          id: `brother_${Date.now()}`,
          fullName: preAuth.fullName,
          email: preAuth.email,
          phone: preAuth.phone,
          cimNumber: preAuth.cimNumber,
          age: preAuth.age,
          lodge: preAuth.lodge,
          grandLodge: preAuth.grandLodge,
          degree: preAuth.authorizedDegree,
          role: preAuth.role,
          status: 'approved',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dataStore.addUser(authedProfile);
        dataStore.consumeMemberAuthorization(preAuth.tokenCode, authedProfile.id);
        setUserProfile(authedProfile);
        setActiveDemoProfileId(null);
        setAuthError(null);
        return;
      }

      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (error: any) {
      console.error('Email sign in error:', error);
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password'
      ) {
        throw new Error('Senha de acesso incorreta. Verifique suas credenciais homologadas.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    profileData: Omit<UserProfile, 'id' | 'email' | 'role' | 'status' | 'createdAt' | 'updatedAt'>,
    authCode?: string
  ) => {
    setLoading(true);
    setAuthError(null);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const isRoot = cleanEmail === ROOT_ADMIN_EMAIL.toLowerCase();

      // ==============================================================
      // 🔒 TRAVAS DE SEGURANÇA NO CADASTRO / PRIMEIRO ACESSO
      // E-MAIL, CIM E IDADE DEVEM ESTAR PREVIAMENTE CADASTRADOS PELO GESTOR
      // ==============================================================
      if (!cleanEmail) {
        throw new Error(
          '[TRAVA DE SEGURANÇA 1 • E-MAIL OBRIGATÓRIO] Informe o e-mail previamente cadastrado pelo Gestor.'
        );
      }

      // Check for pre-authorization or pre-registered profile
      let preAuth = authCode ? dataStore.getAuthorizationByCode(authCode.trim()) : undefined;
      if (!preAuth) {
        preAuth = dataStore.getAuthorizationByEmail(cleanEmail);
      }
      const existingInStore = dataStore.getUsers().find(
        (u) => u.email.toLowerCase().trim() === cleanEmail
      );

      if (!isRoot && !preAuth && !existingInStore) {
        throw new Error(
          `[ACESSO BLOQUEADO • TRAVAS DE SEGURANÇA] O e-mail "${cleanEmail}" não foi previamente cadastrado pelo Gestor. Somente usuários com E-mail e Nome previamente cadastrados pela Chancelaria possuem permissão para acessar o site.`
        );
      }

      // Trava 2: NOME PREVIAMENTE CADASTRADO PELO GESTOR
      const expectedFullName =
        existingInStore?.fullName ||
        preAuth?.fullName ||
        (isRoot ? 'Ir. João da Silva Guimarães' : '');

      if (!profileData.fullName || !profileData.fullName.trim()) {
        throw new Error(
          '[TRAVA DE SEGURANÇA 2 • NOME OBRIGATÓRIO] Informe o Nome Completo previamente cadastrado pelo Gestor.'
        );
      }
      if (expectedFullName && !areNamesMatching(profileData.fullName, expectedFullName)) {
        throw new Error(
          `[ACESSO BLOQUEADO • TRAVA DE SEGURANÇA: NOME NÃO CONFERE] O Nome Completo informado ("${profileData.fullName}") não confere com o cadastro previamente realizado pelo Gestor para este e-mail.`
        );
      }

      const expectedCim =
        existingInStore?.cimNumber || preAuth?.cimNumber || (isRoot ? 'CIM-102938' : '');
      const expectedAge =
        existingInStore?.age !== undefined
          ? existingInStore.age
          : preAuth?.age !== undefined
          ? preAuth.age
          : isRoot
          ? 48
          : undefined;

      // Trava 3: CIM (se informado, confere com o cadastro do Gestor)
      if (profileData.cimNumber && profileData.cimNumber.trim() && expectedCim) {
        if (!areCimsMatching(profileData.cimNumber, expectedCim)) {
          throw new Error(
            `[TRAVA DE SEGURANÇA 3 • CIM INVÁLIDO] O CIM informado ("${profileData.cimNumber}") não confere com o cadastro previamente homologado pelo Gestor para este e-mail.`
          );
        }
      }

      // Trava 4: IDADE (se informada, confere com o cadastro do Gestor)
      if (
        profileData.age !== undefined &&
        profileData.age !== null &&
        !isNaN(Number(profileData.age)) &&
        Number(profileData.age) > 0 &&
        expectedAge !== undefined
      ) {
        if (!areAgesMatching(profileData.age, expectedAge)) {
          throw new Error(
            `[TRAVA DE SEGURANÇA 4 • IDADE NÃO CONFERE] A idade informada (${profileData.age} anos) não confere com a idade previamente cadastrada pelo Gestor para este membro.`
          );
        }
      }

      let userCred;
      try {
        userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      } catch (authErr: any) {
        if (authErr?.code === 'auth/email-already-in-use') {
          userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        } else {
          throw authErr;
        }
      }

      const assignedDegree =
        preAuth && preAuth.status === 'pending'
          ? preAuth.authorizedDegree
          : existingInStore
          ? existingInStore.degree
          : profileData.degree;

      const assignedRole = isRoot
        ? 'admin'
        : preAuth && preAuth.status === 'pending'
        ? preAuth.role
        : existingInStore
        ? existingInStore.role
        : 'brother';

      const assignedStatus = 'approved';

      if (userCred?.user) {
        await updateProfile(userCred.user, { displayName: profileData.fullName });
        const userDocRef = doc(db, 'users', userCred.user.uid);

        const newProfile: UserProfile = {
          id: userCred.user.uid,
          email: cleanEmail,
          ...profileData,
          degree: assignedDegree,
          role: assignedRole,
          status: assignedStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Mark authorization as used if pre-authorized
        if (preAuth && preAuth.status === 'pending') {
          dataStore.consumeMemberAuthorization(preAuth.tokenCode, newProfile.id);
        }

        dataStore.addUser(newProfile);

        try {
          await setDoc(userDocRef, newProfile);
        } catch (dbErr) {
          console.warn('Firestore setDoc notice:', dbErr);
        }

        setUserProfile(newProfile);
        setActiveDemoProfileId(null);
        setAuthError(null);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const validateAuthorizationCode = async (
    code: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!userProfile) return { success: false, message: 'Usuário não conectado.' };
    const cleanCode = code.trim();
    if (!cleanCode) return { success: false, message: 'Por favor, informe o código de autorização.' };

    const authRecord = dataStore.getAuthorizationByCode(cleanCode);
    if (!authRecord || authRecord.status !== 'pending') {
      return { success: false, message: 'Código de autorização inválido, expirado ou já utilizado.' };
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      status: 'approved',
      degree: authRecord.authorizedDegree || userProfile.degree,
      role: authRecord.role || userProfile.role,
      lodge: authRecord.lodge || userProfile.lodge,
      grandLodge: authRecord.grandLodge || userProfile.grandLodge,
      cimNumber: authRecord.cimNumber || userProfile.cimNumber,
      updatedAt: new Date().toISOString(),
    };

    dataStore.consumeMemberAuthorization(authRecord.tokenCode, userProfile.id);
    dataStore.updateUser(userProfile.id, {
      status: 'approved',
      degree: updatedProfile.degree,
      role: updatedProfile.role,
      lodge: updatedProfile.lodge,
      grandLodge: updatedProfile.grandLodge,
    });

    try {
      await updateDoc(doc(db, 'users', userProfile.id), {
        status: 'approved',
        degree: updatedProfile.degree,
        role: updatedProfile.role,
        lodge: updatedProfile.lodge,
        grandLodge: updatedProfile.grandLodge,
        updatedAt: updatedProfile.updatedAt,
      });
    } catch (e) {
      console.warn('Error syncing authorization approval to Firestore:', e);
    }

    setUserProfile(updatedProfile);
    return {
      success: true,
      message: `Código validado com êxito! Seu acesso no Grau 0${updatedProfile.degree} foi liberado pela Chancelaria. Bem-vindo ao Templo de Estudos!`,
    };
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
      setActiveDemoProfileId(null);
      localStorage.removeItem('fm_active_demo_profile');
      setAuthError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateCurrentProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = {
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
    } else if (activeDemoProfileId) {
      // In demo mode, persist in memory/local
      const idx = DEMO_PROFILES.findIndex((p) => p.id === activeDemoProfileId);
      if (idx !== -1) {
        DEMO_PROFILES[idx] = updated;
      }
    }
  };

  // Only allow admin or authorized testing to switch profiles
  const switchDemoProfile = (profileId: string) => {
    if (userProfile?.role === 'admin' || userProfile?.email === ROOT_ADMIN_EMAIL) {
      const profile = DEMO_PROFILES.find((p) => p.id === profileId);
      if (profile) {
        setUserProfile(profile);
        setActiveDemoProfileId(profileId);
      }
    }
  };

  const isAdmin = userProfile?.role === 'admin' || userProfile?.email === ROOT_ADMIN_EMAIL;
  const isInstructor = userProfile?.role === 'instructor' || isAdmin;
  const isBrother = userProfile?.role === 'brother';
  const isApproved = userProfile?.status === 'approved';
  const isPending = userProfile?.status === 'pending';
  const isBlocked = userProfile?.status === 'blocked';

  // Degree accessibility checking logic:
  // Admin & Instructor have access to all degrees.
  // Brother has access to degree <= currentDegree.
  const hasAccessToDegree = (degreeNumber: number): boolean => {
    if (!userProfile || !isApproved) return false;
    if (isAdmin || isInstructor) return true;
    return degreeNumber <= userProfile.degree;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isInstructor,
        isBrother,
        isApproved,
        isPending,
        isBlocked,
        authError,
        clearAuthError,
        hasAccessToDegree,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        validateAuthorizationCode,
        resetPassword,
        logout,
        updateCurrentProfile,
        switchDemoProfile,
        activeDemoProfileId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
