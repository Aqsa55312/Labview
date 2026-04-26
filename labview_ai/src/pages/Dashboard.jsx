import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    ScanLine,
    History as HistoryIcon,
    User,
    Bell,
    Activity,
    Droplets,
    Zap,
    Sun,
    Moon
} from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export default function Dashboard() {
    const navigate = useNavigate();
    const [latestResult, setLatestResult] = useState(null);
    const [totalScans, setTotalScans] = useState(0);
    const [loading, setLoading] = useState(true);
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [showNotif, setShowNotif] = useState(false);
    const user = auth.currentUser;

    // --- LOGIKA DUAL MODE (Sesuai Saran Cara 1) ---
    const [isDark, setIsDark] = useState(() => {
        return localStorage.getItem('theme') === 'light' ? false : true;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);
    // ----------------------------------------------

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "lab_results"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTotalScans(snapshot.size);
            if (!snapshot.empty) {
                setLatestResult(snapshot.docs[0].data());
                
                // Cek data yang butuh Alert (mirip logika History)
                const allAlerts = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))
                   .filter(data => data.glucose > 110 || (data.hemoglobin > 0 && (data.hemoglobin < 13 || data.hemoglobin > 18)));
                
                setRecentAlerts(allAlerts.slice(0, 3)); // Ambil max 3 terbaru
            } else {
                setRecentAlerts([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] font-['Plus_Jakarta_Sans'] pb-40 overflow-x-hidden transition-colors duration-500">
            {/* BACKGROUND GLOW (Hanya Aktif di Dark Mode) */}
            <div className="fixed top-[-10%] right-[-10%] w-80 h-80 bg-[#1D9E75]/10 rounded-full blur-[120px] -z-10 hidden dark:block"></div>

            {/* TOP BAR */}
            <header className="px-8 pt-16 pb-6 flex justify-between items-center transition-all">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.3em] uppercase">
                        {isDark ? 'Antigravity Mode' : 'Clinical Mode'}
                    </p>
                    <h1 className="text-xl font-black italic tracking-tighter uppercase text-[#1D9E75]">
                        {user?.displayName?.split(' ')[0] || "User"}
                    </h1>
                </motion.div>

                <div className="flex gap-3">
                    {/* TOMBOL TOGGLE THEME (Sesuai Permintaan) */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsDark(!isDark)}
                        className="p-3 bg-white dark:bg-[#161d28] border border-slate-200 dark:border-[#1e2e40] rounded-2xl shadow-sm transition-all text-[#1E293B] dark:text-[#f0f6ff]"
                    >
                        {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
                    </motion.button>

                    <div className="relative">
                        <motion.button
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            onClick={() => setShowNotif(!showNotif)}
                            className="p-3 bg-white dark:bg-[#161d28] border border-slate-200 dark:border-[#1e2e40] rounded-2xl text-slate-500 dark:text-[#4a6080] relative shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                            <Bell size={20} />
                            {recentAlerts.length > 0 && (
                                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#161d28] transition-colors"></div>
                            )}
                        </motion.button>

                        {/* POPUP NOTIFIKASI DROPDOWN */}
                        <AnimatePresence>
                            {showNotif && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-[#161d28] border border-slate-200 dark:border-[#1e2e40] rounded-[25px] shadow-2xl overflow-hidden z-50 p-4 transition-colors"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-[#4a6080]">Notifications</h3>
                                        <span className="text-[9px] font-bold bg-red-50 dark:bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">{recentAlerts.length} Alerts</span>
                                    </div>

                                    <div className="space-y-3">
                                        {recentAlerts.length > 0 ? (
                                            recentAlerts.map(alert => (
                                                <div key={alert.id} onClick={() => navigate(`/detail/${alert.id}`)} className="p-3 bg-slate-50 dark:bg-[#0d1117] rounded-2xl border border-slate-100 dark:border-white/5 cursor-pointer hover:border-red-500/30 transition-all">
                                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Attention Required</p>
                                                    <p className="text-xs font-medium text-[#1E293B] dark:text-[#f0f6ff] leading-snug line-clamp-2">
                                                        {alert.interpretation || "Abnormal biomarker levels detected. Please review."}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-slate-500 dark:text-[#4a6080]">
                                                <Activity size={24} className="mx-auto mb-2 opacity-30" />
                                                <p className="text-[9px] font-black uppercase tracking-widest">All Clear</p>
                                                <p className="text-[10px] mt-1">Your recent vitals are optimal.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            <main className="px-6 space-y-6">
                {/* HERO SCORE CARD */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-[#161d28] rounded-[50px] p-10 border border-slate-100 dark:border-[#1e2e40] text-center shadow-xl dark:shadow-2xl relative overflow-hidden transition-all duration-500"
                >
                    <p className="text-[9px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase mb-8">System Health Score</p>

                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="85" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-[#0d1117] transition-colors" />
                            <motion.circle
                                cx="96" cy="96" r="85" fill="transparent"
                                stroke="#1D9E75" strokeWidth="12"
                                strokeDasharray="534"
                                initial={{ strokeDashoffset: 534 }}
                                animate={{ strokeDashoffset: 534 - (534 * 60) / 100 }}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-6xl font-black italic tracking-tighter text-[#1E293B] dark:text-[#f0f6ff]">60</span>
                            <span className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest mt-1">Optimal</span>
                        </div>
                    </div>

                    <div className="mt-10 bg-slate-50 dark:bg-[#0d1117]/50 rounded-[25px] p-4 flex items-center justify-between border border-slate-100 dark:border-white/5 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#1D9E75]/10 rounded-xl text-[#1D9E75]">
                                <Zap size={16} />
                            </div>
                            <div className="text-left">
                                <p className="text-[8px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-widest leading-none">Latest Intel</p>
                                <p className="text-[10px] font-bold text-[#1E293B] dark:text-white uppercase tracking-tighter">Processed {totalScans} file(s)</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/scan')} className="px-4 py-2 bg-[#1D9E75]/10 text-[#1D9E75] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#1D9E75]/20 transition-all">Analyze</button>
                    </div>
                </motion.div>

                {/* DYNAMIC GRID */}
                <div className="grid grid-cols-2 gap-4">
                    <GridItem
                        icon={<HistoryIcon size={20} />}
                        label="Scans Total"
                        value={loading ? '-' : totalScans}
                        delay={0.1}
                    />
                    <GridItem
                        icon={<Droplets size={20} />}
                        label="Blood Sugar"
                        value={loading ? '-' : (latestResult?.glucose || "--")}
                        color="text-blue-500"
                        delay={0.2}
                    />
                </div>
            </main>

            {/* BOTTOM NAV */}
            <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 z-50 pointer-events-none">
                <nav className="max-w-md mx-auto bg-white/90 dark:bg-[#161d28]/90 backdrop-blur-xl border border-slate-200 dark:border-[#1e2e40] rounded-[35px] h-[85px] flex justify-between items-center px-6 shadow-2xl relative pointer-events-auto transition-all duration-500">
                    <div className="flex flex-1 justify-around items-center">
                        <NavIcon icon={<LayoutGrid size={22} />} label="Home" active />
                        <NavIcon icon={<HistoryIcon size={22} />} label="History" onClick={() => navigate('/history')} />
                    </div>

                    <div className="relative -mt-16 group">
                        <div className="absolute inset-0 bg-[#1D9E75]/30 rounded-[30px] blur-xl group-hover:blur-2xl transition-all"></div>
                        <button
                            onClick={() => navigate('/scan')}
                            className="relative w-20 h-20 bg-[#1D9E75] rounded-[30px] flex items-center justify-center text-white shadow-[0_15px_30px_rgba(29,158,117,0.3)] border-[6px] border-[#F8FAFC] dark:border-[#0d1117] active:scale-90 transition-all duration-500"
                        >
                            <ScanLine size={30} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex flex-1 justify-around items-center">
                        <NavIcon icon={<ActivityIcon />} label="Trends" onClick={() => navigate('/trends')} />
                        <NavIcon icon={<User size={22} />} label="Profile" onClick={() => navigate('/profile')} />
                    </div>
                </nav>
            </div>
        </div>
    );
}

// Sub-komponen Grid Item agar kode lebih bersih
function GridItem({ icon, label, value, color = "text-[#1D9E75]", delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white dark:bg-[#161d28] p-8 rounded-[40px] border border-slate-100 dark:border-[#1e2e40] flex flex-col items-center text-center shadow-sm dark:shadow-none transition-all duration-500"
        >
            <div className={`w-12 h-12 bg-slate-50 dark:bg-[#1D9E75]/5 rounded-2xl flex items-center justify-center ${color} mb-4`}>
                {icon}
            </div>
            <p className="text-[9px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.3em] mb-1">{label}</p>
            <p className="text-3xl font-black italic text-[#1E293B] dark:text-white tracking-tighter transition-colors">{value}</p>
        </motion.div>
    );
}

function NavIcon({ icon, active, onClick, label }) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#1D9E75]' : 'text-slate-400 dark:text-[#4a6080]'}`}>
            {icon}
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${active ? 'opacity-100' : 'opacity-50'}`}>
                {label}
            </span>
            {active && <div className="w-1 h-1 bg-[#1D9E75] rounded-full mt-0.5"></div>}
        </button>
    );
}

function ActivityIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
    );
}