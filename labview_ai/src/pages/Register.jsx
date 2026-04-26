import React, { useState } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, UserPlus, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Register() {
    const [step, setStep] = useState(1);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gender, setGender] = useState('Male');
    const [healthGoal, setHealthGoal] = useState('Monitor Health');
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
                gender: gender,
                healthGoal: healthGoal,
                createdAt: serverTimestamp(),
                role: 'patient'
            });

            navigate('/dashboard');
        } catch (error) {
            alert("Registration Failed: " + error.message);
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
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] flex justify-center items-center text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500 p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
            >
                {/* Background glow */}
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-[#1D9E75]/20 rounded-full blur-3xl"></div>

                <div className="flex items-center justify-between mb-8 relative z-10 w-full mt-2">
                    {step === 2 ? (
                        <button onClick={() => setStep(1)} className="text-slate-500 dark:text-[#4a6080] hover:text-[#1E293B] dark:hover:text-[#f0f6ff] transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                    ) : (
                        <div className="w-6"></div>
                    )}
                    <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-12 h-12 bg-[#F8FAFC] dark:bg-[#0d1117] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(29,158,117,0.2)]"
                    >
                        <UserPlus size={20} className="text-[#1D9E75]" strokeWidth={2} />
                    </motion.div>
                    <div className="w-6"></div>
                </div>

                {/* TEAL PROGRESS BAR */}
                <div className="flex justify-between items-end px-1 mb-2 text-[#1D9E75] relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}</p>
                    <p className="text-[10px] font-black">{step === 1 ? '50%' : '100%'}</p>
                </div>
                <div className="w-full h-1 bg-[#1e2e40] rounded-full overflow-hidden mb-10 relative z-10">
                    <motion.div 
                        initial={{ width: '50%' }}
                        animate={{ width: step === 1 ? '50%' : '100%' }}
                        className="h-full bg-[#1D9E75]"
                    ></motion.div>
                </div>

                <div className="text-center space-y-2 mb-8 relative z-10">
                    <h1 className="text-3xl font-black text-[#1E293B] dark:text-[#f0f6ff] tracking-tight">{step === 1 ? 'Join LabView' : 'Health Profile'}</h1>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-[#4a6080] tracking-[0.2em] uppercase">
                        {step === 1 ? 'Establish your digital identity' : 'Personalize your metrics'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.form 
                            key="step1"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6 relative z-10"
                            onSubmit={(e) => { e.preventDefault(); setStep(2); }}
                        >
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.2em] ml-2">Full Identity</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#F8FAFC] dark:bg-[#0d1117] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-[20px] py-4 px-5 text-sm text-[#1E293B] dark:text-[#f0f6ff] focus:outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75] transition-all placeholder:text-slate-500 dark:text-[#4a6080]"
                                    placeholder=""
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
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
                                <label className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.2em] ml-2">Secret Code</label>
                                <input
                                    type="password"
                                    className="w-full bg-[#F8FAFC] dark:bg-[#0d1117] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-[20px] py-4 px-5 text-sm text-[#1E293B] dark:text-[#f0f6ff] focus:outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75] transition-all placeholder:text-slate-500 dark:text-[#4a6080]"
                                    placeholder=""
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(29,158,117,0.3)] transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                CONTINUE <ArrowRight size={16} />
                            </motion.button>
                        </motion.form>
                    )}

                    {step === 2 && (
                        <motion.form 
                            key="step2"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="space-y-6 relative z-10"
                            onSubmit={handleRegister}
                        >
                            {/* GENDER PILLS */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.2em] ml-2">Biological Sex</label>
                                <div className="flex gap-3">
                                    {['Male', 'Female'].map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setGender(g)}
                                            className={`flex-1 py-4 px-4 rounded-[20px] border font-bold text-[11px] uppercase tracking-widest transition-all ${
                                                gender === g 
                                                ? 'bg-[#1D9E75]/10 border-[#1D9E75] text-[#1D9E75]' 
                                                : 'bg-[#F8FAFC] dark:bg-[#0d1117] border-[#E2E8F0] dark:border-[#1e2e40] text-slate-500 dark:text-[#4a6080] hover:bg-[#1e2e40]/50'
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* HEALTH GOALS */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.2em] ml-2">Primary Goal</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['Monitor Health', 'Manage Condition', 'Fitness Tracking'].map(hg => (
                                        <button
                                            key={hg}
                                            type="button"
                                            onClick={() => setHealthGoal(hg)}
                                            className={`w-full py-4 px-5 rounded-[20px] border text-left font-bold text-[11px] uppercase tracking-wider transition-all flex justify-between items-center ${
                                                healthGoal === hg 
                                                ? 'bg-[#1D9E75]/10 border-[#1D9E75] text-[#1D9E75]' 
                                                : 'bg-[#F8FAFC] dark:bg-[#0d1117] border-[#E2E8F0] dark:border-[#1e2e40] text-slate-500 dark:text-[#4a6080] hover:bg-[#1e2e40]/50'
                                            }`}
                                        >
                                            {hg}
                                            {healthGoal === hg && <Activity size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#1D9E75] disabled:bg-[#1e2e40] disabled:text-slate-500 dark:text-[#4a6080] hover:bg-[#1D9E75]/90 text-white py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(29,158,117,0.3)] transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? "INITIALIZING..." : "FINALIZE PROFILE"}
                            </motion.button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {step === 1 && (
                    <>
                    <div className="relative py-6 z-10">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2E8F0] dark:border-[#1e2e40]"></div></div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-500 dark:text-[#4a6080] bg-[#FFFFFF] dark:bg-[#161d28] px-4 tracking-[0.2em]">Quick Setup</div>
                    </div>

                    <div className="w-full mb-6 relative z-10">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGoogleSignIn}
                            className="w-full flex items-center justify-center gap-3 bg-[#F8FAFC] dark:bg-[#0d1117] border border-[#E2E8F0] dark:border-[#1e2e40] py-4 rounded-[20px] hover:bg-[#1e2e40]/50 transition-colors text-xs font-bold text-[#1E293B] dark:text-[#f0f6ff] shadow-sm"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" /> 
                            <span className="tracking-wide">Import Google Profile</span>
                        </motion.button>
                    </div>

                    <p className="text-center text-[11px] font-bold text-slate-500 dark:text-[#4a6080] relative z-10">
                        ALREADY HAVE ACCESS? <Link to="/login" className="text-[#1D9E75] hover:underline uppercase tracking-wide ml-1">Login Here</Link>
                    </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}