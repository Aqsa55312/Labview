import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
    const [lastAnalysis, setLastAnalysis] = useState(null);
    const [totalScan, setTotalScan] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let unsubscribeSnapshot = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate('/login');
                return;
            }

            // Query untuk mengambil data terakhir
            const q = query(
                collection(db, "lab_results"),
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc")
            );

            unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                setTotalScan(snapshot.size);
                if (!snapshot.empty) {
                    setLastAnalysis({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
                }
                setLoading(false);
            });
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, [navigate]);

    // LOGIKA SMART METRICS UNTUK DASHBOARD
    const getMetrics = () => {
        if (!lastAnalysis) return { score: 0, label: "NO DATA", color: "#CBD5E1", isRecap: false };

        const rekamMedis = lastAnalysis.all_data?.["Rekam Medis Pasien"] || [];
        const isRecap = Array.isArray(rekamMedis) && rekamMedis.length > 0;
        const hasNumeric = (lastAnalysis.glucose > 0 || lastAnalysis.hemoglobin > 0 || lastAnalysis.cholesterol > 0);

        // 1. Jika Tipe Rekap (Banyak Pasien)
        if (isRecap) {
            return {
                score: Math.min(rekamMedis.length * 10, 100),
                label: "PRECISION",
                color: "#3498DB",
                isRecap: true,
                icon: "📋"
            };
        }

        // 2. Jika Tipe Hasil Lab (Numerik)
        if (hasNumeric) {
            let score = 100;
            if (lastAnalysis.hemoglobin > 0 && (lastAnalysis.hemoglobin < 13.5 || lastAnalysis.hemoglobin > 17.5)) score -= 20;
            if (lastAnalysis.glucose > 0 && (lastAnalysis.glucose < 70 || lastAnalysis.glucose > 110)) score -= 20;
            return { score: score, label: "OPTIMAL", color: "#48A878", isRecap: false, icon: score };
        }

        // 3. Jika Tipe Clinical Record (Hanya Teks)
        return { score: 100, label: "CLINICAL", color: "#9B59B6", isRecap: false, icon: "🩺" };
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white font-black text-[#48A878] animate-pulse uppercase tracking-[0.3em] text-[10px]">
            Refreshing Dashboard...
        </div>
    );

    const metrics = getMetrics();

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans pb-32">

            {/* HEADER SECTION */}
            <div className="bg-[#48A878] rounded-b-[50px] p-8 pt-12 pb-24 relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                            <span className="text-xl">👤</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Welcome Back,</p>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                {auth.currentUser?.displayName?.split(' ')[0] || "User"}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={() => auth.signOut()}
                        className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black px-6 py-3 rounded-2xl border border-white/20 transition-all uppercase tracking-widest"
                    >
                        Logout
                    </button>
                </div>
                {/* Decoration */}
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* MAIN SCORE CARD */}
            <div className="max-w-md mx-auto -mt-16 px-6">
                <div className="bg-white rounded-[50px] p-10 shadow-xl shadow-green-900/5 border border-slate-50 relative overflow-hidden">
                    <p className="text-[9px] font-black text-slate-300 text-center uppercase tracking-[0.3em] mb-8">Overall Health Score</p>

                    {/* GAUGE LINGKARAN */}
                    <div className="relative w-56 h-56 flex items-center justify-center mx-auto">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="112" cy="112" r="95" fill="transparent" stroke="#F8FAFC" strokeWidth="16" />
                            <circle
                                cx="112" cy="112" r="95" fill="transparent"
                                stroke={metrics.color} strokeWidth="16"
                                strokeDasharray="597"
                                strokeDashoffset={597 - (597 * metrics.score) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-[1500ms] ease-out"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-6xl font-black text-[#0A1D37] italic tracking-tighter">
                                {metrics.icon}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-2" style={{ color: metrics.color }}>
                                {metrics.label}
                            </span>
                        </div>
                    </div>

                    <div className="mt-10 flex justify-between items-center border-t border-slate-50 pt-8">
                        <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Analysis Status</p>
                            <p className="text-xs font-bold text-[#0A1D37]">Completed</p>
                        </div>
                        <Link to={lastAnalysis?.id ? `/detail/${lastAnalysis.id}` : '#'} className="text-[9px] font-black text-[#48A878] uppercase tracking-widest hover:underline italic">
                            View Report →
                        </Link>
                    </div>
                </div>
            </div>

            {/* BOTTOM STATS */}
            <div className="max-w-md mx-auto grid grid-cols-2 gap-4 px-6 mt-6">
                <div className="bg-[#E8F5EE]/50 p-8 rounded-[40px] border border-white text-center">
                    <p className="text-[8px] font-black text-[#48A878] uppercase tracking-widest mb-2">Total Scan</p>
                    <p className="text-3xl font-black text-[#0A1D37] italic">{totalScan}</p>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-50 text-center">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">AI Precision</p>
                    <p className="text-xl font-black text-[#0A1D37] italic uppercase tracking-tighter">High</p>
                </div>
            </div>

            {/* FLOATING ACTION BUTTON */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
                <button
                    onClick={() => navigate('/scan')}
                    className="w-16 h-16 bg-[#48A878] rounded-3xl flex items-center justify-center text-white text-3xl shadow-2xl shadow-green-400 hover:scale-110 active:scale-95 transition-all border-4 border-white"
                >
                    +
                </button>
            </div>

            {/* BOTTOM NAV */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-50 p-6 flex justify-around items-center z-50">
                <div onClick={() => navigate('/dashboard')} className="flex flex-col items-center text-[#48A878] opacity-100 cursor-pointer transition-opacity">
                    <span className="text-xl">🏠</span>
                    <span className="text-[8px] font-black uppercase mt-1">Home</span>
                </div>
                <div onClick={() => navigate('/history')} className="flex flex-col items-center opacity-30 cursor-pointer hover:opacity-100 transition-opacity">
                    <span className="text-xl">📋</span>
                    <span className="text-[8px] font-black uppercase mt-1">History</span>
                </div>
                <div className="w-10"></div> {/* Spacer for FAB */}
                <div onClick={() => navigate('/trends')} className="flex flex-col items-center opacity-30 cursor-pointer hover:opacity-100 transition-opacity">
                    <span className="text-xl">📈</span>
                    <span className="text-[8px] font-black uppercase mt-1">Trends</span>
                </div>
                <div onClick={() => navigate('/profile')} className="flex flex-col items-center opacity-30 cursor-pointer hover:opacity-100 transition-opacity">
                    <span className="text-xl">👤</span>
                    <span className="text-[8px] font-black uppercase mt-1">Profile</span>
                </div>
            </nav>
        </div>
    );
}