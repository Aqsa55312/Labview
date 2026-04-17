import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [userData, setUserData] = useState(null);
    const [lastScan, setLastScan] = useState(null);
    const [totalScan, setTotalScan] = useState(0);
    const [loading, setLoading] = useState(true);
    const [healthScore, setHealthScore] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) setUserData(userDoc.data());

                    const allScansQ = query(collection(db, "lab_results"), where("userId", "==", currentUser.uid));
                    const allScansSnap = await getDocs(allScansQ);
                    setTotalScan(allScansSnap.size);

                    const lastScanQ = query(
                        collection(db, "lab_results"),
                        where("userId", "==", currentUser.uid),
                        orderBy("createdAt", "desc"),
                        limit(1)
                    );
                    const lastScanSnap = await getDocs(lastScanQ);
                    if (!lastScanSnap.empty) {
                        setLastScan(lastScanSnap.docs[0].data());
                        setHealthScore(85); 
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-10 h-10 border-4 border-[#48A878] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 pb-44">
            
            {/* Header - Sekarang Pakai Hijau LabView */}
            <div className="bg-gradient-to-br from-[#48A878] to-[#3a8d63] rounded-b-[50px] px-8 pt-12 pb-32 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="flex justify-between items-center relative z-10 max-w-6xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-white text-xl">👤</div>
                        <div>
                            <p className="text-green-100 text-[10px] font-bold uppercase tracking-widest opacity-80">Welcome Back,</p>
                            <h2 className="text-white font-black text-xl tracking-tight uppercase">{userData?.fullName || "USER"}</h2>
                        </div>
                    </div>
                    <button onClick={() => signOut(auth)} className="px-5 py-2 bg-white/10 rounded-full text-white text-[10px] font-black border border-white/20 active:scale-95 transition-all uppercase">Logout</button>
                </div>
            </div>

            {/* Health Score Card - Layout Persis Gambar */}
            <div className="px-8 -mt-24 relative z-20 max-w-6xl mx-auto">
                <div className="bg-white rounded-[45px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Overall Health Score</p>
                    <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="88" cy="88" r="75" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                            <circle cx="88" cy="88" r="75" fill="transparent" stroke="#48A878" strokeWidth="12"
                                strokeDasharray="471" strokeDashoffset={471 - (471 * healthScore) / 100}
                                strokeLinecap="round" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black text-slate-900 leading-none">{healthScore}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 italic ${healthScore > 0 ? 'text-[#48A878]' : 'text-slate-300'}`}>
                                {healthScore > 0 ? 'Optimal' : 'No Data'}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between mt-8 px-2 border-t border-slate-50 pt-6">
                        <div className="text-left">
                            <p className="text-[8px] font-black text-slate-300 uppercase">Analysis Status</p>
                            <p className="text-[11px] font-bold text-slate-700">{lastScan ? "Completed" : "Empty"}</p>
                        </div>
                        <div className="text-right" onClick={() => navigate('/history')}>
                            <p className="text-[11px] font-bold text-[#48A878] italic cursor-pointer uppercase tracking-tighter">View All →</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Row */}
            <div className="px-8 mt-10 grid grid-cols-2 gap-4 max-w-6xl mx-auto">
                <div className="bg-green-50/50 p-5 rounded-[30px] border border-green-100 text-center">
                    <p className="text-[9px] font-black text-[#48A878] uppercase tracking-widest mb-1">Total Scan</p>
                    <p className="text-xl font-black text-[#48A878]">{totalScan}</p>
                </div>
                <div className="bg-white p-5 rounded-[30px] border border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Precision</p>
                    <p className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">High</p>
                </div>
            </div>

            {/* Floating Navigation - Layout Sesuai Gambar (Melayang & Rapi) */}
            <div className="fixed bottom-6 left-6 right-6 z-[100] flex justify-center">
                <div className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] px-8 py-4 flex justify-between items-center relative w-full max-w-2xl">
                    
                    <button onClick={() => navigate('/history')} className="flex flex-col items-center gap-1 group">
                        <span className="text-xl opacity-40 group-hover:opacity-100 transition-opacity">📄</span>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">History</span>
                    </button>

                    <button onClick={() => navigate('/trends')} className="flex flex-col items-center gap-1 group">
                        <span className="text-xl opacity-40 group-hover:opacity-100 transition-opacity">📈</span>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Trends</span>
                    </button>

                    {/* Tombol "+" Melayang di Tengah */}
                    <div onClick={() => navigate('/scan')} className="bg-[#48A878] w-16 h-16 min-w-[64px] rounded-[24px] flex items-center justify-center shadow-lg shadow-green-200 -mt-14 border-[6px] border-[#FDFDFD] active:scale-90 transition-all cursor-pointer z-50">
                        <span className="text-3xl text-white font-bold">+</span>
                    </div>

                    <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 group">
                        <span className="text-xl opacity-40 group-hover:opacity-100 transition-opacity">👤</span>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Profile</span>
                    </button>

                    <button onClick={() => signOut(auth)} className="flex flex-col items-center gap-1 group text-red-400">
                        <span className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">🚪</span>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Exit</span>
                    </button>

                </div>
            </div>
        </div>
    );
}