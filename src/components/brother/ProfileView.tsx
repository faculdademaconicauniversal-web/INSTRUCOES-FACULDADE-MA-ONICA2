import React, { useState } from 'react';
import {
  User,
  Building,
  Phone,
  Mail,
  Award,
  FileCheck,
  Shield,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ProfileView: React.FC = () => {
  const { userProfile, updateCurrentProfile } = useAuth();
  if (!userProfile) return null;

  const [fullName, setFullName] = useState(userProfile.fullName);
  const [masonicName, setMasonicName] = useState(userProfile.masonicName || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [lodge, setLodge] = useState(userProfile.lodge);
  const [grandLodge, setGrandLodge] = useState(userProfile.grandLodge);
  const [photoURL, setPhotoURL] = useState(userProfile.photoURL || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCurrentProfile({
      fullName,
      masonicName: masonicName || undefined,
      phone: phone || undefined,
      lodge,
      grandLodge,
      photoURL: photoURL || undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121622] via-[#0e121a] to-black border border-amber-500/20 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg">
            {photoURL ? (
              <img
                src={photoURL}
                alt={fullName}
                className="w-full h-full rounded-2xl object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              fullName.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold font-masonic text-slate-100">
                {fullName}
              </h1>
              {userProfile.role === 'admin' ? (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-red-950/60 text-red-300 rounded border border-red-500/40">
                  Administrador
                </span>
              ) : userProfile.role === 'instructor' ? (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-950/60 text-blue-300 rounded border border-blue-500/40">
                  Instrutor
                </span>
              ) : null}
            </div>
            <p className="text-xs text-amber-400 font-medium">
              Grau 0{userProfile.degree} • {userProfile.degree === 1 ? 'Aprendiz Maçom' : userProfile.degree === 2 ? 'Companheiro Maçom' : 'Mestre Maçom'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{userProfile.lodge} ({userProfile.grandLodge})</p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
          <span className="text-[10px] text-slate-500 block uppercase font-mono">Registro (CIM)</span>
          <span className="text-sm font-mono font-bold text-amber-300">{userProfile.cimNumber}</span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Perfil maçônico atualizado com sucesso no sistema!</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSave} className="space-y-4">
          <h2 className="text-sm font-bold font-masonic text-amber-200 border-b border-slate-800 pb-2">
            Dados Cadastrais & Fraternais
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome Maçônico
              </label>
              <input
                type="text"
                value={masonicName}
                onChange={(e) => setMasonicName(e.target.value)}
                placeholder="Ex: Hermes Trismegisto"
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mail (Login)
              </label>
              <input
                type="email"
                disabled
                value={userProfile.email}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">O e-mail não pode ser alterado diretamente.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Loja Maçônica
              </label>
              <input
                type="text"
                required
                value={lodge}
                onChange={(e) => setLodge(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Potência Maçônica
              </label>
              <input
                type="text"
                required
                value={grandLodge}
                onChange={(e) => setGrandLodge(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              URL da Foto de Perfil (Opcional)
            </label>
            <input
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://exemplo.com/minha-foto.jpg"
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg flex items-center space-x-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
