import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

    // LOGIKA PERHITUNGAN SKOR & KLASIFIKASI DATA
    const getHealthMetrics = () => {
        const hasNumericData = (data?.glucose > 0 || data?.hemoglobin > 0 || data?.cholesterol > 0 || data?.uric_acid > 0);
        const rekamMedis = data?.all_data?.["Rekam Medis Pasien"] || [];
        const isRecap = Array.isArray(rekamMedis) && rekamMedis.length > 0;

        if (isRecap) {
            return {
                type: 'RECAP',
                score: Math.min(rekamMedis.length * 10, 100), // Skor berdasarkan jumlah data ditemukan
                label: "DATA PRECISION",
                color: "#3498DB"
            };
        }

        if (!hasNumericData) {
            return { type: 'CLINICAL', score: 100, label: "CLINICAL RECORD", color: "#9B59B6" };
        }

        let score = 100;
        if (data?.hemoglobin > 0 && (data.hemoglobin < 13.5 || data.hemoglobin > 17.5)) score -= 20;
        if (data?.glucose > 0 && (data.glucose < 70 || data.glucose > 110)) score -= 20;
        if (data?.cholesterol > 200) score -= 15;

        return { type: 'LAB', score: score, label: "HEALTH SCORE", color: "#48A878" };
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white font-black text-[#48A878] animate-pulse tracking-widest text-[10px]">
            SYNCHRONIZING AI DATA...
        </div>
    );

    const metrics = getHealthMetrics();
    const patientList = data?.all_data?.["Rekam Medis Pasien"] || [];

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans pb-32">
            {/* STICKY HEADER */}
            <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-50 sticky top-0 z-50">
                <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-all text-slate-400 font-bold">←</button>
                <h1 className="text-[10px] font-black uppercase tracking-[0.3em] italic text-[#0A1D37]">AI Diagnostic Report</h1>
                <div className="w-10"></div>
            </header>

            <main className="max-w-4xl mx-auto p-6 space-y-8">

                {/* GAUGE SCORE CARD */}
                <div className="bg-white rounded-[50px] p-10 shadow-sm border border-slate-50 text-center relative overflow-hidden">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8 italic">System Analytics</p>

                    <div className="relative w-64 h-64 mx-auto flex items-center justify-center animate-in fade-in zoom-in duration-1000">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="128" cy="128" r="110" fill="transparent" stroke="#F1F5F9" strokeWidth="20" />
                            <circle
                                cx="128" cy="128" r="110" fill="transparent"
                                stroke={metrics.color} strokeWidth="20" strokeDasharray="691"
                                strokeDashoffset={691 - (691 * metrics.score) / 100}
                                strokeLinecap="round" className="transition-all duration-[2000ms] ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-7xl font-black text-[#0A1D37] tracking-tighter italic">{metrics.score}</span>
                            <span className="text-[10px] font-black uppercase mt-2 tracking-widest px-4 py-1.5 rounded-full border border-slate-100" style={{ color: metrics.color }}>{metrics.label}</span>
                        </div>
                    </div>
                </div>

                {/* MODUL 1: TABEL REKAP PASIEN (Hanya muncul jika ada data Rekam Medis Pasien) */}
                {metrics.type === 'RECAP' && (
                    <div className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-sm overflow-hidden">
                        <h3 className="font-black text-[#0A1D37] text-sm uppercase italic tracking-widest mb-6 px-2">Patient Summary List</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#F8FAFB] rounded-2xl">
                                    <tr>
                                        <th className="p-4 text-[9px] font-black text-slate-400 uppercase">Patient & NIK</th>
                                        <th className="p-4 text-[9px] font-black text-slate-400 uppercase">Primary Diagnosis</th>
                                        <th className="p-4 text-[9px] font-black text-slate-400 uppercase text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {patientList.map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <p className="text-xs font-bold text-[#0A1D37] uppercase">{typeof p["Nama Pasien"] === 'object' ? JSON.stringify(p["Nama Pasien"]) : (p["Nama Pasien"] || "N/A")}</p>
                                                <p className="text-[9px] text-slate-400 font-mono mt-1">{typeof p["NIK Pasien"] === 'object' ? JSON.stringify(p["NIK Pasien"]) : (p["NIK Pasien"] || "No NIK recorded")}</p>
                                            </td>
                                            <td className="p-4 text-[10px] font-semibold text-slate-500 italic">
                                                {typeof p["Diagnosa Utama"] === 'object' ? JSON.stringify(p["Diagnosa Utama"]) : p["Diagnosa Utama"]}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="text-[8px] font-black px-2 py-1 bg-green-50 text-green-600 rounded-md border border-green-100 uppercase">Verified</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MODUL 2: BIOMETRIC CARDS (Hanya muncul jika data LAB) */}
                {metrics.type === 'LAB' && (
                    <div className="grid grid-cols-2 gap-4">
                        {['hemoglobin', 'glucose', 'cholesterol', 'uric_acid'].map((key) => (
                            <div key={key} className="bg-white p-6 rounded-[30px] border border-slate-50 shadow-sm">
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{key}</p>
                                <p className="text-2xl font-black text-[#0A1D37] mt-2 italic">{data[key] || 0}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* AI INTERPRETATION - BOX GELAP MEWAH */}
                <div className="bg-[#0A1D37] rounded-[50px] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-xl">✨</div>
                            <h3 className="font-black uppercase tracking-[0.2em] italic text-sm">AI Narrative Insight</h3>
                        </div>
                        <div className="text-sm leading-[1.8] font-medium text-white/80 italic text-justify whitespace-pre-line">
                            {(() => {
                                const interp = data?.interpretation;
                                if (!interp) return "AI is processing the medical narrative...";
                                if (typeof interp === 'string') return interp;
                                if (typeof interp === 'object') {
                                    return Object.entries(interp)
                                        .map(([k, v]) => `${k.toUpperCase()}:\n${typeof v === 'object' ? JSON.stringify(v) : v}`)
                                        .join('\n\n');
                                }
                                return String(interp);
                            })()}
                        </div>
                    </div>
                    {/* Efek Cahaya */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32"></div>
                </div>

                {/* TEMUAN MEDIS LAINNYA (FLEXIBLE DATA) */}
                {data?.all_data && Object.keys(data.all_data).filter(k => k !== "Rekam Medis Pasien" && k !== "Nama Klinik" && k !== "Telepon Klinik").length > 0 && (
                    <div className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E8F5EE] rounded-2xl flex items-center justify-center text-[#48A878] text-xl">📋</div>
                            <div>
                                <h3 className="font-black text-[#0A1D37] text-sm uppercase italic tracking-widest">Other Clinical Findings</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Detected via AI Deep Scan</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(data.all_data)
                                .filter(([key]) => key !== "Rekam Medis Pasien" && key !== "Nama Klinik" && key !== "Telepon Klinik")
                                .map(([key, value]) => (
                                    <div key={key} className="group flex justify-between items-center p-5 bg-[#FBFDFF] rounded-[25px] border border-slate-100 hover:border-green-200 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">{key}</span>
                                            <span className="text-xs font-black text-[#0A1D37] group-hover:text-[#48A878] transition-colors italic uppercase tracking-tighter break-words pt-1">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* KLINIK INFO CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm flex items-center gap-6">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl">🏥</div>
                        <div>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Clinic Identity</p>
                            <p className="text-xs font-bold text-[#0A1D37] uppercase italic break-all">{typeof data?.all_data?.["Nama Klinik"] === 'object' ? JSON.stringify(data.all_data["Nama Klinik"]) : (data?.all_data?.["Nama Klinik"] || "Unknown Source")}</p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm flex items-center gap-6">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl">📞</div>
                        <div>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Contact Info</p>
                            <p className="text-xs font-bold text-[#0A1D37] italic break-all">{typeof data?.all_data?.["Telepon Klinik"] === 'object' ? JSON.stringify(data.all_data["Telepon Klinik"]) : (data?.all_data?.["Telepon Klinik"] || "No Phone Info")}</p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}