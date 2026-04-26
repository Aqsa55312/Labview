import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, LogOut, Shield, Settings, QrCode, User, Activity, Sun, Moon } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Profile() {
    const navigate = useNavigate();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
    
    const [totalScans, setTotalScans] = useState(0);
    const [stability, setStability] = useState("OPTIMAL");
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    useEffect(() => {
        const fetchUserStats = async () => {
            if (user) {
                try {
                    const q = query(
                        collection(db, "lab_results"),
                        where("userId", "==", user.uid)
                    );
                    const querySnapshot = await getDocs(q);
                    setTotalScans(querySnapshot.size);

                    let hasAlert = false;
                    let hasWatch = false;

                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        if (data.glucose > 110 || (data.hemoglobin > 0 && (data.hemoglobin < 13 || data.hemoglobin > 18))) {
                            hasAlert = true;
                        } else if (data.glucose > 100 || (data.cholesterol > 200)) {
                            hasWatch = true;
                        }
                    });

                    if (hasAlert) {
                        setStability("CRITICAL");
                    } else if (hasWatch) {
                        setStability("WARNING");
                    }

                } catch (error) {
                    console.error("Error fetching stats:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUserStats();
    }, [user]);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500 font-['Plus_Jakarta_Sans'] pb-40">
            {/* GRADIENT BACKGROUND */}
            <div className="h-64 bg-gradient-to-b from-[#1D9E75]/20 to-transparent absolute top-0 left-0 right-0 -z-10"></div>

            <header className="px-8 pt-16 flex justify-between items-center z-10 relative">
                <button onClick={() => navigate(-1)} className="p-3 bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-2xl text-slate-500 dark:text-[#4a6080] transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none">
                    <ChevronLeft size={20} />
                </button>
                <button onClick={() => setShowSettings(true)} className="p-3 bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-2xl text-slate-500 dark:text-[#4a6080] transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none">
                    <Settings size={20} />
                </button>
            </header>

            <main className="px-8 mt-8">
                {/* DYNAMIC USER INFO */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center mb-10"
                >
                    <div className="w-24 h-24 bg-[#1D9E75] rounded-[35px] flex items-center justify-center text-4xl font-black italic text-white shadow-[0_20px_40px_rgba(29,158,117,0.3)] mb-6 overflow-hidden">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" />
                        ) : (
                            (user?.displayName || user?.email || "A").charAt(0).toUpperCase()
                        )}
                    </div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase text-[#1E293B] dark:text-[#f0f6ff] transition-colors">
                        {user?.displayName || user?.email?.split('@')[0] || "Medical User"}
                    </h2>
                    <p className="text-slate-500 dark:text-[#4a6080] text-xs font-bold tracking-widest mt-1 uppercase transition-colors">
                        {user?.email}
                    </p>
                </motion.div>

                {/* DIGITAL HEALTH ID CARD (DYNAMIC) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#1D9E75] rounded-[40px] p-8 relative overflow-hidden shadow-[0_30px_60px_rgba(29,158,117,0.2)] mb-8 text-white"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-20"><QrCode size={100} /></div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-black text-white/80 tracking-[0.4em] uppercase mb-1">Health Passport</p>
                            <h3 className="text-xl font-black italic tracking-tighter uppercase">
                                ID: {user?.uid?.substring(0, 8)}
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-white/80 uppercase tracking-widest mb-1">Institution</p>
                            <p className="text-xs font-black uppercase tracking-widest">ULBI</p>
                            <p className="text-[10px] font-bold text-white/80 mt-1">NPM: 613230016</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/20">
                        <div>
                            <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">Total Records</p>
                            <p className="text-lg font-black text-white italic">
                                {loading ? "..." : `${totalScans} SCANS`}
                            </p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">Verification</p>
                            <p className={`text-lg font-black italic uppercase ${user?.emailVerified ? 'text-white' : 'text-red-300'}`}>
                                {user?.emailVerified ? 'VERIFIED' : 'UNVERIFIED'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* STATS SUMMARY ROW */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#FFFFFF] dark:bg-[#161d28] p-6 rounded-[30px] border border-[#E2E8F0] dark:border-[#1e2e40] transition-colors"
                    >
                        <Activity size={20} className={stability === 'OPTIMAL' ? 'text-[#1D9E75] mb-2' : stability === 'WARNING' ? 'text-yellow-500 mb-2' : 'text-red-500 mb-2'} />
                        <p className="text-[8px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.3em]">Stability</p>
                        <p className={`text-xl font-black italic ${stability === 'OPTIMAL' ? 'text-[#1E293B] dark:text-[#f0f6ff]' : stability === 'WARNING' ? 'text-yellow-500' : 'text-red-500'}`}>
                            {stability}
                        </p>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#FFFFFF] dark:bg-[#161d28] p-6 rounded-[30px] border border-[#E2E8F0] dark:border-[#1e2e40] transition-colors"
                    >
                        <LogOut size={20} className="text-blue-500 dark:text-blue-400 mb-2 rotate-180" />
                        <p className="text-[8px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.3em]">Joined</p>
                        <p className="text-xl font-black italic text-[#1E293B] dark:text-[#f0f6ff]">{user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getFullYear() : "2026"}</p>
                    </motion.div>
                </div>

                {/* MENU ACTIONS */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <ProfileMenu 
                        icon={<User size={18} />} 
                        label="Personal Data"
                        isExpanded={expandedMenu === 'personal'}
                        onClick={() => setExpandedMenu(expandedMenu === 'personal' ? null : 'personal')}
                    >
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-[#4a6080] mb-1">Full Name (Identifier)</p>
                                <p className="font-bold text-[#1E293B] dark:text-white text-sm">{user?.displayName || user?.email?.split('@')[0]}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-[#4a6080] mb-1">Registered Email</p>
                                <p className="font-bold text-[#1E293B] dark:text-white text-sm">{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-[#4a6080] mb-1">Account UID</p>
                                <p className="font-bold text-[#1E293B] dark:text-white text-[10px] break-all">{user?.uid}</p>
                            </div>
                        </div>
                    </ProfileMenu>

                    <ProfileMenu 
                        icon={<Shield size={18} />} 
                        label="Privacy & Security"
                        isExpanded={expandedMenu === 'privacy'}
                        onClick={() => setExpandedMenu(expandedMenu === 'privacy' ? null : 'privacy')}
                    >
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-[#0d1117] p-3 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-[#4a6080]">Auth Mechanism</p>
                                    <p className="font-bold text-[#1E293B] dark:text-white capitalize text-xs mt-0.5">{user?.providerData[0]?.providerId.split('.')[0] || "Email / Password"}</p>
                                </div>
                                <Shield size={16} className="text-[#1D9E75]" />
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-[#0d1117] p-3 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-[#4a6080]">Last Active (Sign In)</p>
                                    <p className="font-bold text-[#1E293B] dark:text-white text-xs mt-0.5">
                                        {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : "Session Active"}
                                    </p>
                                </div>
                                <Activity size={16} className="text-blue-500" />
                            </div>
                        </div>
                    </ProfileMenu>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-[#FFFFFF] dark:bg-[#161d28] border border-red-200 dark:border-red-900/20 rounded-[30px] p-6 flex items-center gap-4 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sign Out From Account</span>
                    </button>
                </motion.div>
            </main>

            {/* SETTINGS BOTTOM SHEET */}
            <AnimatePresence>
                {showSettings && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSettings(false)}
                            className="fixed inset-0 bg-slate-900/60 dark:bg-[#0d1117]/80 backdrop-blur-sm z-[60] transition-colors"
                        ></motion.div>

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF] dark:bg-[#161d28] rounded-t-[40px] px-8 pt-8 pb-12 z-[70] max-w-md mx-auto border-t border-[#E2E8F0] dark:border-[#1e2e40] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] transition-colors"
                        >
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8"></div>
                            
                            <h3 className="text-xl font-black italic uppercase text-[#1E293B] dark:text-[#f0f6ff] mb-6 tracking-tight transition-colors">App Settings</h3>
                            
                            <div className="space-y-4">
                                {/* THEME TOGGLE */}
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#0d1117] p-5 rounded-3xl border border-slate-100 dark:border-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl transition-colors ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-400/10 text-amber-500'}`}>
                                            {isDark ? <Moon size={18} fill="currentColor" /> : <Sun size={18} fill="currentColor" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1E293B] dark:text-white transition-colors">Appearance</p>
                                            <p className="text-[9px] font-medium text-slate-500 dark:text-[#4a6080] transition-colors">{isDark ? "Antigravity Dark Mode" : "Clinical Light Mode"}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={toggleTheme}
                                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-[#1D9E75]' : 'bg-slate-300'}`}
                                    >
                                        <motion.div 
                                            animate={{ x: isDark ? 24 : 2 }}
                                            className="w-5 h-5 bg-white rounded-full mt-0.5 shadow-sm"
                                        />
                                    </button>
                                </div>

                                {/* DELETE ACCOUNT (DISABLED INFO) */}
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#0d1117] p-5 rounded-3xl border border-slate-100 dark:border-white/5 opacity-50 cursor-not-allowed transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                                            <Shield size={18} fill="currentColor" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1E293B] dark:text-white transition-colors">Delete Account</p>
                                            <p className="text-[9px] font-medium text-slate-500 dark:text-[#4a6080] transition-colors">Contact Support for Deactivation</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-[#4a6080] mt-10 transition-colors">LabView AI v1.0.0</p>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function ProfileMenu({ icon, label, children, isExpanded, onClick }) {
    return (
        <div className="bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-[30px] p-6 group transition-colors overflow-hidden">
            <div onClick={onClick} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-4">
                    <div className="text-slate-500 dark:text-[#4a6080] group-hover:text-[#1D9E75] transition-colors">{icon}</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1E293B] dark:text-[#f0f6ff] transition-colors">{label}</span>
                </div>
                <motion.span 
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-500 dark:text-[#4a6080] transition-colors inline-block"
                >
                    →
                </motion.span>
            </div>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="border-t border-slate-100 dark:border-white/5 pt-4 overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}