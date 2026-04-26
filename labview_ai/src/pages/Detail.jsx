import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Share2,
    Sparkles,
    Calendar,
    Clock,
    Download,
    Activity
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Detail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const docRef = doc(db, "lab_results", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setData(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching detail:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] flex flex-col items-center justify-center transition-colors">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="text-[#1D9E75] mb-4"
            >
                <Sparkles size={40} />
            </motion.div>
            <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase">Decrypting Report</p>
        </div>
    );

    const isAlert = data?.glucose > 140 || data?.hemoglobin < 10;

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500 font-['Plus_Jakarta_Sans'] pb-20">
            {/* HEADER FIXED */}
            <header className="px-8 pt-16 pb-6 flex justify-between items-center fixed top-0 w-full bg-[#F8FAFC]/90 dark:bg-[#0d1117]/90 backdrop-blur-xl z-50 border-b border-[#E2E8F0] dark:border-white/5 transition-colors">
                <button onClick={() => navigate(-1)} className="p-3 bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-2xl text-slate-500 dark:text-[#4a6080] active:scale-90 transition-all">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-500 dark:text-[#4a6080]">AI Diagnostic</h1>
                <button className="p-3 bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-2xl text-slate-500 dark:text-[#4a6080] transition-colors hover:text-[#1D9E75]">
                    <Share2 size={20} />
                </button>
            </header>

            <main className="px-8 pt-36 space-y-8">
                {/* METADATA */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-6 justify-center"
                >
                    <div className="flex items-center gap-2 text-slate-500 dark:text-[#4a6080] text-[9px] font-black uppercase tracking-widest">
                        <Calendar size={14} className="text-[#1D9E75]" />
                        {data?.createdAt?.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-[#4a6080] text-[9px] font-black uppercase tracking-widest">
                        <Clock size={14} className="text-[#1D9E75]" />
                        {data?.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </motion.div>

                {/* AI INTERPRETATION CARD (REVISED) */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#FFFFFF] dark:bg-[#161d28] rounded-[45px] p-10 border border-[#E2E8F0] dark:border-[#1e2e40] relative overflow-hidden shadow-xl dark:shadow-2xl transition-colors"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 pointer-events-none">
                        <Activity size={80} className="text-[#1D9E75]" />
                    </div>

                    <div className="text-center mb-8 relative z-10">
                        <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase mb-4">SYSTEM ANALYTICS</p>

                        <div className="flex items-center justify-center gap-2">
                            <h2 className={`text-2xl font-black italic tracking-tighter uppercase ${isAlert ? 'text-red-500' : 'text-[#1D9E75]'}`}>
                                {isAlert ? "Attention" : "Condition"}
                            </h2>
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-[#1E293B] dark:text-white/90">
                                {isAlert ? "Required" : "Optimal"}
                            </h2>
                        </div>
                        <div className={`h-1.5 w-16 mx-auto mt-3 rounded-full ${isAlert ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-[#1D9E75] shadow-[0_0_10px_rgba(29,158,117,0.5)]'}`}></div>
                    </div>

                    <div className="relative">
                        <span className="absolute -top-4 -left-2 text-5xl text-[#1D9E75] opacity-20 font-serif leading-none">“</span>
                        <p className="text-sm text-slate-700 dark:text-[#f0f6ff]/80 leading-[1.8] italic text-center px-4 relative z-10 font-medium">
                            {data?.interpretation || "The AI engine is synthesizing your laboratory results. This may take a few seconds..."}
                        </p>
                        <span className="absolute -bottom-6 -right-2 text-5xl text-[#1D9E75] opacity-20 font-serif leading-none">”</span>
                    </div>
                </motion.div>

                {/* METRICS GRID */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <h3 className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.3em] uppercase ml-2">Extracted Biomarkers</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <MetricBox label="Hemoglobin" value={data?.hemoglobin} unit="g/dL" />
                        <MetricBox label="Glucose" value={data?.glucose} unit="mg/dL" highlight={data?.glucose > 140} />
                        <MetricBox label="Cholesterol" value={data?.cholesterol} unit="mg/dL" />
                        <MetricBox label="Uric Acid" value={data?.uricAcid || data?.uric_acid} unit="mg/dL" />
                    </div>
                </motion.div>

                {/* FOOTER ACTIONS */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col gap-4 pt-6"
                >
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-6 bg-[#1D9E75] rounded-[30px] flex items-center justify-center gap-3 text-white text-[11px] font-black tracking-[0.3em] uppercase shadow-[0_15px_30px_rgba(29,158,117,0.2)] transition-all"
                    >
                        <Download size={18} /> Export Diagnostic PDF
                    </motion.button>
                    <p className="text-center text-[9px] text-slate-500 dark:text-[#4a6080] font-bold uppercase tracking-[0.2em] px-10 leading-relaxed">
                        This report is generated by AI and should be verified by a medical professional.
                    </p>
                </motion.div>
            </main>
        </div>
    );
}

function MetricBox({ label, value, unit, highlight }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={`bg-[#FFFFFF] dark:bg-[#161d28] p-7 rounded-[40px] border transition-colors duration-300 ${highlight ? 'border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.1)]' : 'border-[#E2E8F0] dark:border-[#1e2e40]'}`}
        >
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-3 ${highlight ? 'text-red-500/80' : 'text-slate-500 dark:text-[#4a6080]'}`}>
                {label}
            </p>
            <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black italic tracking-tighter ${highlight ? 'text-red-500' : 'text-[#1E293B] dark:text-white'}`}>
                    {value || '--'}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${highlight ? 'text-red-500/60' : 'text-slate-500 dark:text-[#4a6080]'}`}>
                    {unit}
                </span>
            </div>
        </motion.div>
    );
}