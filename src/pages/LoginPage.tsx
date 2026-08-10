import React, { useState } from 'react';

export const LoginPage = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = data.redirect || '/app';
      } else {
        setErrorMsg(data.error || 'Login gagal. Silakan coba lagi.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (signupPassword !== signupPasswordConfirm) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Pendaftaran berhasil. Silakan cek email Anda.');
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupPasswordConfirm('');
      } else {
        setErrorMsg(data.error || 'Pendaftaran gagal.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        window.location.href = data.redirect || '/app';
      } else {
        alert('Gagal masuk sebagai tamu. Silakan coba lagi.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-4">
      {/* Background Decor */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-32 -right-32 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      {/* Main Card */}
      <div className="w-full max-w-md bg-white/90 shadow-2xl rounded-2xl border border-slate-100 p-8 relative z-10 backdrop-blur-sm">
        
        {/* Header & Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/public/assets/Logo LogosLAB.png" alt="Logos LAB Logo" className="w-16 h-16 object-contain mb-4 rounded-xl shadow-sm" onError={(e) => { e.currentTarget.src = '/public/assets/logo.png' }} />
          <h1 className="text-2xl font-bold text-[#1A237E]">Selamat Datang</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">Platform E-Learning Berbasis Game Edukasi</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button 
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'login' ? 'bg-white text-[#1A237E] shadow' : 'text-slate-500 hover:text-[#1A237E]'}`}
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Masuk
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'register' ? 'bg-white text-[#1A237E] shadow' : 'text-slate-500 hover:text-[#1A237E]'}`}
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Daftar
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{errorMsg}</div>}
        {successMsg && <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-600 text-sm border border-emerald-100">{successMsg}</div>}

        {/* Forms */}
        <div className="mb-6">
          {activeTab === 'login' ? (
            <form onSubmit={handleSubmitLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A237E] mb-1" htmlFor="login-username">Username / Email</label>
                <input 
                  id="login-username"
                  type="text" 
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="Masukkan username atau email"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A237E] mb-1" htmlFor="login-password">Password</label>
                <input 
                  id="login-password"
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="Masukkan password"
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-semibold py-2.5 rounded-lg text-sm shadow-md flex items-center justify-center disabled:opacity-70"
              >
                {loading ? <i className="bi bi-arrow-repeat animate-spin mr-2"></i> : null}
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitRegister} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A237E] mb-1" htmlFor="signup-name">Nama Lengkap</label>
                <input 
                  id="signup-name"
                  type="text" 
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="Nama lengkap Anda"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A237E] mb-1" htmlFor="signup-email">Email</label>
                <input 
                  id="signup-email"
                  type="email" 
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="email@example.com"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A237E] mb-1" htmlFor="signup-password">Password</label>
                <input 
                  id="signup-password"
                  type="password" 
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="Min. 8 karakter"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A237E] mb-1" htmlFor="signup-password-confirm">Konfirmasi Password</label>
                <input 
                  id="signup-password-confirm"
                  type="password" 
                  value={signupPasswordConfirm}
                  onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="Ulangi password"
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-semibold py-2.5 rounded-lg text-sm shadow-md flex items-center justify-center disabled:opacity-70"
              >
                {loading ? <i className="bi bi-arrow-repeat animate-spin mr-2"></i> : null}
                {loading ? 'Memproses...' : 'Buat Akun'}
              </button>
            </form>
          )}
        </div>

        {/* Separator */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-xs text-slate-400 font-medium">ATAU</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        {/* Alternative Logins */}
        <div className="flex flex-col gap-3">
          <a href="/api/auth/google" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Lanjutkan dengan Google
          </a>
          <button 
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-teal-50 border border-teal-200 rounded-lg text-sm font-semibold text-teal-700 hover:bg-teal-100 transition-colors shadow-sm"
          >
            <i className="bi bi-person-badge"></i>
            Masuk sebagai Tamu
          </button>
        </div>
      </div>
    </div>
  );
};
