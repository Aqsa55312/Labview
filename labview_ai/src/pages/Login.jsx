import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Activity, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] flex justify-center items-center text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
            >
                {/* Background glow */}
                <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-32 h-32 bg-[#1D9E75]/20 rounded-full blur-3xl"></div>

                <div className="flex justify-center mb-8 relative z-10 w-full mt-4">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                        }}
                        className="w-16 h-16 bg-[#F8FAFC] dark:bg-[#0d1117] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(29,158,117,0.2)]"
                    >
                        <Activity size={32} className="text-[#1D9E75]" strokeWidth={2} />
                    </motion.div>
                </div>

                <div className="text-center space-y-2 mb-10 relative z-10">
                    <h1 className="text-3xl font-black text-[#1E293B] dark:text-[#f0f6ff] tracking-tight">LabView AI</h1>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-[#4a6080] tracking-[0.2em] uppercase">Medical Transformation Platform</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.2em] ml-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full bg-[#F8FAFC] dark:bg-[#0d1117] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-[20px] py-4 px-5 text-sm text-[#1E293B] dark:text-[#f0f6ff] focus:outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75] transition-all placeholder:text-slate-500 dark:text-[#4a6080]"
                            placeholder=""
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-2">
                            <label className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.2em]">Password</label>
                            <button type="button" className="text-[10px] font-black text-[#1D9E75] uppercase hover:underline tracking-widest">Reset</button>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full bg-[#F8FAFC] dark:bg-[#0d1117] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-[20px] py-4 px-5 text-sm text-[#1E293B] dark:text-[#f0f6ff] focus:outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75] transition-all placeholder:text-slate-500 dark:text-[#4a6080]"
                                placeholder=""
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#4a6080] hover:text-[#1D9E75] transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                            </button>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(29,158,117,0.3)] transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <Fingerprint size={16} />
                        Authenticate
                    </motion.button>
                </form>

                <div className="relative py-6 z-10">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2E8F0] dark:border-[#1e2e40]"></div></div>
                    <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-500 dark:text-[#4a6080] bg-[#FFFFFF] dark:bg-[#161d28] px-4 tracking-[0.2em]">Social Integration</div>
                </div>

                <div className="w-full mb-6 relative z-10">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-[#F8FAFC] dark:bg-[#0d1117] border border-[#E2E8F0] dark:border-[#1e2e40] py-4 rounded-[20px] hover:bg-[#1e2e40]/50 transition-colors text-xs font-bold text-[#1E293B] dark:text-[#f0f6ff] shadow-sm"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                        <span className="tracking-wide">Continue with Google</span>
                    </motion.button>
                </div>

                <p className="text-center text-[11px] font-bold text-slate-500 dark:text-[#4a6080] relative z-10">
                    UNREGISTERED? <Link to="/register" className="text-[#1D9E75] hover:underline uppercase tracking-wide ml-1">Register Now</Link>
                </p>
            </motion.div>
        </div>
    );
}