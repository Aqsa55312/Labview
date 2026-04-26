import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Filter, FileText, AlertTriangle, CheckCircle, Activity, Home, BatteryCharging, User } from 'lucide-react';

export default function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState('All'); // All, Normal, Watch, Alert
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const q = query(
                    collection(db, "lab_results"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
                const snapshot = await getDocs(q);
                const list = snapshot.docs.map(doc => {
                    const data = doc.data();
                    let status = "NORMAL";
                    
                    if (data.glucose > 110 || (data.hemoglobin > 0 && (data.hemoglobin < 13 || data.hemoglobin > 18))) {
                        status = "ALERT";
                    } else if (data.glucose > 100 || (data.cholesterol > 200)) {
                        status = "WATCH";
                    }

                    return { id: doc.id, ...data, status };
                });
                setHistory(list);
                setLoading(false);
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const filteredHistory = history.filter(item => {
        const matchesFilter = filterOption === 'All' || item.status === filterOption.toUpperCase();
        const matchesSearch = item.interpretation?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.createdAt?.toDate().toLocaleDateString('id-ID').includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    const getStatusStyle = (status) => {
        if (status === 'ALERT') return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (status === 'WATCH') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        return 'bg-[#1D9E75]/10 text-[#1D9E75] border-[#1D9E75]/20';
    };

    const getStatusIcon = (status) => {
        if (status === 'ALERT') return <AlertTriangle size={14} className="text-red-500" />;
        if (status === 'WATCH') return <Activity size={14} className="text-yellow-500" />;
        return <CheckCircle size={14} className="text-[#1D9E75]" />;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0d1117] font-black text-[#1D9E75] animate-pulse uppercase tracking-[0.3em] text-[10px]">
            RETRIEVING ARCHIVES...
        </div>
    );

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500 pb-32 flex flex-col items-center">
            
            {/* HEADER SECTION */}
            <header className="w-full max-w-md px-6 py-6 flex flex-col sticky top-0 bg-[#F8FAFC] dark:bg-[#0d1117]/80 backdrop-blur-lg z-50 border-b border-[#E2E8F0] dark:border-[#1e2e40]">
                <div className="flex items-center justify-between w-full mb-4">
                    <button onClick={() => navigate('/dashboard')} className="text-[#1E293B] dark:text-[#f0f6ff] hover:text-[#1D9E75] dark:hover:text-[#1D9E75] transition-colors p-2 -ml-2 rounded-full hover:bg-[#FFFFFF] dark:bg-[#161d28]">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div className="w-6"></div>
                </div>
                <div>
                    <h1 className="font-black text-[10px] text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase mb-1">
                        History Archive
                    </h1>
                    <p className="text-[#1E293B] dark:text-[#f0f6ff] text-sm font-medium tracking-wide">
                        Medical Records Timeline
                    </p>
                </div>

                {/* SEARCH & FILTER CHIPS */}
                <div className="mt-6 flex flex-col gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#4a6080]" />
                        <input 
                            type="text" 
                            placeholder="Search interpretation or date..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-[20px] py-3 pl-12 pr-4 text-[11px] text-[#1E293B] dark:text-white focus:outline-none focus:border-[#1D9E75] transition-colors placeholder:text-slate-500 dark:text-[#4a6080]"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['All', 'Normal', 'Watch', 'Alert'].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setFilterOption(opt)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-colors ${
                                    filterOption === opt 
                                    ? 'bg-[#1D9E75]/20 border-[#1D9E75] text-[#1D9E75]' 
                                    : 'bg-[#FFFFFF] dark:bg-[#161d28] border-[#E2E8F0] dark:border-[#1e2e40] text-slate-500 dark:text-[#4a6080] hover:bg-[#1e2e40]'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-md px-6 py-8">
                {/* VERTICAL TIMELINE */}
                <div className="relative border-l-2 border-[#E2E8F0] dark:border-[#1e2e40] ml-3 pl-6 space-y-8">
                    <AnimatePresence>
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => navigate(`/detail/${item.id}`)}
                                    className="relative bg-[#FFFFFF] dark:bg-[#161d28] p-6 rounded-[30px] border border-[#E2E8F0] dark:border-[#1e2e40] shadow-xl hover:border-[#E2E8F0] dark:border-[#1e2e40]/80 cursor-pointer group transition-colors"
                                >
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[31.5px] top-8 w-4 h-4 rounded-full bg-[#F8FAFC] dark:bg-[#0d1117] border-2 border-[#E2E8F0] dark:border-[#1e2e40] group-hover:border-[#1D9E75] transition-colors"></div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-[#F8FAFC] dark:bg-[#0d1117] rounded-full flex items-center justify-center border border-[#E2E8F0] dark:border-[#1e2e40]">
                                            <FileText size={16} className="text-slate-500 dark:text-[#4a6080]" />
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${getStatusStyle(item.status)}`}>
                                            {getStatusIcon(item.status)}
                                            <span className="text-[8px] font-black uppercase tracking-widest">{item.status}</span>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-[#1E293B] dark:text-[#f0f6ff] text-[13px] mb-2">
                                        {item.createdAt?.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </h3>
                                    
                                    <p className="text-[11px] text-slate-500 dark:text-[#4a6080] leading-relaxed italic line-clamp-2">
                                        {item.interpretation || "No interpretation provided by AI model."}
                                    </p>
                                    
                                    {/* Metrics Pills */}
                                    <div className="flex gap-2 mt-4 flex-wrap">
                                        {item.glucose > 0 && <span className="bg-[#F8FAFC] dark:bg-[#0d1117] border border-[#E2E8F0] dark:border-[#1e2e40] text-slate-500 dark:text-[#4a6080] text-[8px] font-bold px-2 py-1 rounded w-fit">GLU: {item.glucose}</span>}
                                        {item.hemoglobin > 0 && <span className="bg-[#F8FAFC] dark:bg-[#0d1117] border border-[#E2E8F0] dark:border-[#1e2e40] text-slate-500 dark:text-[#4a6080] text-[8px] font-bold px-2 py-1 rounded w-fit">HB: {item.hemoglobin}</span>}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="text-center py-20 bg-[#FFFFFF] dark:bg-[#161d28] rounded-[40px] border border-dashed border-[#E2E8F0] dark:border-[#1e2e40] ml-[-24px]"
                            >
                                <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-widest">No Archival Records Found</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <nav className="fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-white/90 dark:bg-[#161d28]/90 backdrop-blur-xl border border-[#E2E8F0] dark:border-[#1e2e40] rounded-[30px] p-4 flex justify-around items-center z-50 shadow-2xl">
                <div onClick={() => navigate('/dashboard')} className="flex flex-col items-center text-slate-500 dark:text-[#4a6080] hover:text-[#1E293B] dark:hover:text-[#f0f6ff] cursor-pointer transition-colors">
                    <Home size={20} className="mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1">Home</span>
                </div>
                <div onClick={() => navigate('/history')} className="flex flex-col items-center text-[#1D9E75] cursor-pointer">
                    <Search size={20} className="mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1">History</span>
                </div>
                <div onClick={() => navigate('/trends')} className="flex flex-col items-center text-slate-500 dark:text-[#4a6080] hover:text-[#1E293B] dark:hover:text-[#f0f6ff] cursor-pointer transition-colors">
                    <BatteryCharging size={20} className="mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1">Trends</span>
                </div>
                <div onClick={() => navigate('/profile')} className="flex flex-col items-center text-slate-500 dark:text-[#4a6080] hover:text-[#1E293B] dark:hover:text-[#f0f6ff] cursor-pointer transition-colors">
                    <User size={20} className="mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1">Profile</span>
                </div>
            </nav>
        </div>
    );
}