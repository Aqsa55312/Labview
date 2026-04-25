import React, { useState } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName,
                email: email,
                createdAt: serverTimestamp(),
                role: 'patient'
            });

            navigate('/dashboard');
        } catch (error) {
            alert("Registrasi Gagal: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            await setDoc(doc(db, "users", user.uid), {
                fullName: user.displayName,
                email: user.email,
                updatedAt: serverTimestamp()
            }, { merge: true });

            navigate('/dashboard');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-white flex font-sans">

            {/* KIRI: Visual Section (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#48A878] items-center justify-center p-20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
                <div className="relative z-10 text-white space-y-6">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-[25px] flex items-center justify-center border border-white/30 text-3xl">🛡️</div>
                    <h2 className="text-5xl font-black italic tracking-tighter leading-tight uppercase">Start Your Health <br />Revolution.</h2>
                    <p className="text-lg text-white/80 font-medium max-w-sm leading-relaxed">
                        Bergabunglah dengan ribuan pengguna yang telah mendigitalisasi riwayat medis mereka dengan asisten AI yang cerdas.
                    </p>
                </div>
            </div>

            {/* KANAN: Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 bg-[#F8FAFB]">
                <div className="w-full max-w-lg space-y-8">

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-6">
                        <div className="w-14 h-14 bg-[#48A878] rounded-2xl flex items-center justify-center text-white text-xl font-bold">+</div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-[#0A1D37] tracking-tight">Create Account</h1>
                        <p className="text-slate-400 font-medium italic">Join LabView AI for a smarter health monitoring.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#5C6E84] uppercase tracking-[0.2em] ml-1">Full Name</label>
                            <input
                                type="text"
                                placeholder=""
                                className="w-full bg-white border border-[#E2E8F0] rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[#48A878] focus:ring-4 focus:ring-[#48A878]/5 transition-all shadow-sm"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#5C6E84] uppercase tracking-[0.2em] ml-1">Email Address</label>
                            <input
                                type="email"
                                placeholder=""
                                className="w-full bg-white border border-[#E2E8F0] rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[#48A878] focus:ring-4 focus:ring-[#48A878]/5 transition-all shadow-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#5C6E84] uppercase tracking-[0.2em] ml-1">Password</label>
                            <input
                                type="password"
                                placeholder=""
                                className="w-full bg-white border border-[#E2E8F0] rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[#48A878] focus:ring-4 focus:ring-[#48A878]/5 transition-all shadow-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${loading ? 'bg-slate-300' : 'bg-[#48A878]'} text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-green-900/10 active:scale-[0.98] transition-all`}
                        >
                            {loading ? "PROCESING..." : "Join LabView Now"}
                        </button>
                    </form>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative flex justify-center text-[9px] font-black uppercase text-slate-400 bg-[#F8FAFB] px-4 tracking-widest">Or Register With</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleGoogleSignIn}
                            className="flex items-center justify-center gap-3 bg-white border border-slate-200 py-3.5 rounded-2xl hover:bg-slate-50 transition-all text-xs font-bold text-[#0A1D37]"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="G" /> Google
                        </button>
                        <button className="flex items-center justify-center gap-3 bg-white border border-slate-200 py-3.5 rounded-2xl hover:bg-slate-50 transition-all text-xs font-bold text-[#0A1D37]">
                            <svg
                                viewBox="0 0 384 512"
                                width="16"
                                height="16"
                                fill="currentColor"
                                className="text-slate-800"
                            >
                                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                            </svg> Apple
                        </button>
                    </div>

                    <p className="text-center text-sm font-bold text-slate-400">
                        Already member? <Link to="/login" className="text-[#48A878] hover:underline">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}