import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard');
        } catch (error) {
            alert("Login Gagal: Periksa kembali email dan password Anda.");
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-white flex font-sans">

            {/* BAGIAN KIRI: Visual Branding (Hanya muncul di Layar Besar) */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#48A878] items-center justify-center p-20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    {/* Dekorasi pola medis (optional) */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
                </div>
                <div className="relative z-10 text-white space-y-6">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-[30px] flex items-center justify-center border border-white/30 text-4xl shadow-2xl">🔬</div>
                    <h2 className="text-6xl font-black italic tracking-tighter leading-tight uppercase">LabView <br />AI Transformation.</h2>
                    <p className="text-xl text-white/80 font-medium max-w-md leading-relaxed">
                        Mendigitalisasi data rekam medis Anda dengan teknologi AI terbaru secara aman dan instan.
                    </p>
                </div>
            </div>

            {/* BAGIAN KANAN: Login Form (Full screen di mobile, setengah screen di desktop) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 bg-[#F8FAFB]">
                <div className="w-full max-w-lg space-y-10">

                    {/* Mobile Logo (Hanya muncul jika layar kecil) */}
                    <div className="lg:hidden flex justify-center mb-10">
                        <div className="w-16 h-16 bg-[#48A878] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-green-200">+</div>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-4xl font-black text-[#0A1D37] tracking-tight">Welcome Back</h1>
                        <p className="text-slate-400 font-medium">Access your medical transformation dashboard securely.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-[#5C6E84] uppercase tracking-[0.2em] ml-1">Email Address</label>
                            <input
                                type="email"
                                placeholder=""
                                className="w-full bg-white border border-[#E2E8F0] rounded-2xl py-5 px-6 text-sm focus:outline-none focus:border-[#48A878] focus:ring-4 focus:ring-[#48A878]/5 transition-all shadow-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-black text-[#5C6E84] uppercase tracking-[0.2em] ml-1">Password</label>
                                <button type="button" className="text-[11px] font-bold text-[#48A878] hover:underline">Forgot Password?</button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder=""
                                    className="w-full bg-white border border-[#E2E8F0] rounded-2xl py-5 px-6 text-sm focus:outline-none focus:border-[#48A878] focus:ring-4 focus:ring-[#48A878]/5 transition-all shadow-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-[#A0B0C5]"
                                >
                                    {showPassword ? "HIDE" : "SHOW"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#48A878] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-green-900/10 active:scale-[0.98] transition-all"
                        >
                            Sign In to Account
                        </button>
                    </form>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-400 bg-[#F8FAFB] px-4 tracking-widest">Or Continue With</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center gap-3 bg-white border border-slate-200 py-4 rounded-2xl hover:bg-slate-50 transition-all text-xs font-bold text-[#0A1D37]"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="G" /> Google
                        </button>
                        <button className="flex items-center justify-center gap-3 bg-white border border-slate-200 py-4 rounded-2xl hover:bg-slate-50 transition-all text-xs font-bold text-[#0A1D37]">
                            <span className="text-lg"></span> Apple
                        </button>
                    </div>

                    <p className="text-center text-sm font-bold text-slate-400">
                        Don't have an account? <Link to="/register" className="text-[#48A878] hover:underline">Create for free</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}