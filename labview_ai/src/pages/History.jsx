import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
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
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHistory(list);
                setLoading(false);
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-blue-600 uppercase tracking-widest">Loading History...</div>;

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans pb-32">
            <header className="p-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <button onClick={() => navigate('/dashboard')} className="text-slate-400 font-bold uppercase text-[10px]">← Back</button>
                <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Scan History</h1>
                <div className="w-10"></div>
            </header>

            <div className="px-8 space-y-4">
                {history.length > 0 ? (
                    history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => navigate(`/detail/${item.id}`)}
                            className="bg-white p-6 rounded-[35px] border border-slate-50 shadow-[0_10px_30px_rgba(0,0,0,0.02)] active:scale-95 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-blue-50 w-10 h-10 rounded-2xl flex items-center justify-center text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">📄</div>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                    {item.createdAt?.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                </p>
                            </div>
                            <h3 className="font-black text-slate-800 text-xs uppercase tracking-tight mb-2">AI Analysis Report</h3>
                            <p className="text-[10px] text-slate-400 leading-relaxed italic line-clamp-2">
                                {item.interpretation || "Klik untuk melihat detail analisis..."}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[50px] border-2 border-dashed border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada riwayat scan</p>
                    </div>
                )}
            </div>
        </div>
    );
}