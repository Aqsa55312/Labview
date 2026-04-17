import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Detail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const reportRef = useRef();

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const docRef = doc(db, "lab_results", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setData(docSnap.data());
                } else {
                    navigate('/dashboard');
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    // LOGIKA 1: Menentukan Status Bar & Zona Warna
    const getStatusInfo = (type, value) => {
        if (!value || value === 0) return { status: "N/A", color: "bg-slate-300", pos: "0%", range: "No Data" };

        let min = 0, max = 0, status = "NORMAL", color = "bg-[#48A878]", pos = "50%";

        switch (type) {
            case 'hemoglobin': min = 13.5; max = 17.5; break;
            case 'glucose': min = 70; max = 110; break;
            case 'cholesterol': min = 120; max = 200; break;
            case 'uric_acid': min = 3.4; max = 7.0; break;
            default: return { status: "NORMAL", color: "bg-[#48A878]", pos: "50%", range: "-" };
        }

        if (value < min) { status = "LOW"; color = "bg-orange-500"; pos = "20%"; }
        else if (value > max) { status = "HIGH"; color = "bg-red-500"; pos = "80%"; }
        else { status = "NORMAL"; color = "bg-[#48A878]"; pos = "50%"; }

        return { status, color, pos, range: `${min} - ${max}` };
    };

    // LOGIKA 2: Kalkulasi Skor Kesehatan Dinamis
    const calculateDynamicScore = () => {
        let score = 100;
        let issues = 0;

        if (data?.hemoglobin > 0 && (data.hemoglobin < 13.5 || data.hemoglobin > 17.5)) { score -= 20; issues++; }
        if (data?.glucose > 0 && (data.glucose < 70 || data.glucose > 110)) { score -= 20; issues++; }
        if (data?.cholesterol > 200) { score -= 15; issues++; }
        if (data?.uric_acid > 7.0) { score -= 15; issues++; }

        let statusText = "Excellent";
        let statusColor = "#48A878";
        if (score < 90 && score >= 70) { statusText = "Stable"; statusColor = "#E67E22"; }
        else if (score < 70) { statusText = "Needs Attention"; statusColor = "#E74C3C"; }

        return { total: score, status: statusText, color: statusColor, issuesCount: issues };
    };

    const downloadPDF = () => {
        const input = reportRef.current;
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
            pdf.save(`LabView_Report_${id}.pdf`);
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-[#48A878] tracking-widest animate-pulse">GENERATING REPORT...</div>;

    const health = calculateDynamicScore();

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans pb-40">

            {/* Header Sticky */}
            <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
                <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100">←</button>
                <h1 className="text-[11px] font-black uppercase tracking-[0.3em] italic text-[#0A1D37]">Full Diagnostic Report</h1>
                <button onClick={downloadPDF} className="bg-[#48A878] text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">Export PDF</button>
            </header>

            <div className="max-w-5xl mx-auto p-6 lg:p-12 space-y-12">

                <div ref={reportRef} className="space-y-12">

                    {/* 1. GAUGE SKOR UTAMA */}
                    <div className="bg-white rounded-[60px] p-12 shadow-sm border border-slate-50 text-center flex flex-col items-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-10 italic">Patient Vital Statistics</p>
                        <div className="relative w-56 h-56 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="112" cy="112" r="95" fill="transparent" stroke="#F8FAFC" strokeWidth="18" />
                                <circle
                                    cx="112" cy="112" r="95" fill="transparent"
                                    stroke={health.color} strokeWidth="18" strokeDasharray="597"
                                    strokeDashoffset={597 - (597 * health.total) / 100}
                                    strokeLinecap="round" className="transition-all duration-[2000ms] ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-6xl font-black text-[#0A1D37] tracking-tighter">{health.total}<small className="text-xl">/100</small></span>
                                <span className="text-[10px] font-black uppercase mt-2 tracking-widest px-4 py-1 rounded-full border border-slate-100" style={{ color: health.color }}>{health.status}</span>
                            </div>
                        </div>
                        <p className="mt-10 text-xs text-slate-400 font-medium max-w-md leading-relaxed">
                            Analisis otomatis mendeteksi {health.issuesCount} anomali klinis. Sistem menggunakan algoritma referensi laboratorium standar.
                        </p>
                    </div>

                    {/* 2. GRID PARAMETER UTAMA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {['hemoglobin', 'glucose', 'cholesterol', 'uric_acid'].map((type) => {
                            const info = getStatusInfo(type, data?.[type]);
                            return (
                                <div key={type} className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-sm space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-black text-[#0A1D37] text-sm uppercase italic">{type.replace('_', ' ')}</h4>
                                            <p className="text-[11px] font-bold text-slate-400 italic mt-1">{data?.[type] || 0} unit | Ref: {info.range}</p>
                                        </div>
                                        <span className={`text-[8px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest text-white shadow-sm ${info.color}`}>{info.status}</span>
                                    </div>
                                    <div className="relative h-2.5 w-full bg-slate-50 rounded-full flex overflow-hidden border border-slate-100">
                                        <div className="h-full w-[30%] bg-orange-50"></div>
                                        <div className="h-full w-[40%] bg-green-50"></div>
                                        <div className="h-full w-[30%] bg-red-50"></div>
                                        {data?.[type] > 0 && (
                                            <div className="absolute h-4 w-4 bg-white border-[4px] border-[#0A1D37] rounded-full top-1/2 -translate-y-1/2 shadow-xl transition-all duration-1000" style={{ left: info.pos }}></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 3. TEMUAN MEDIS LAINNYA (FLEKSIBEL) */}
                    {data?.all_data && Object.keys(data.all_data).length > 0 && (
                        <div className="bg-white rounded-[50px] p-10 border border-slate-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                            <div className="flex items-center gap-4">
                                <div className="w-2.5 h-10 bg-[#3498DB] rounded-full"></div>
                                <div>
                                    <h3 className="font-black text-[#0A1D37] text-sm uppercase italic tracking-widest">Other Clinical Findings</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Detected via AI Deep Scan</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(data.all_data).map(([key, value]) => (
                                    <div key={key} className="group flex justify-between items-center p-6 bg-[#FBFDFF] rounded-[30px] border border-slate-100 hover:border-blue-200 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">{key}</span>
                                            <span className="text-sm font-black text-[#0A1D37] group-hover:text-blue-600 transition-colors italic uppercase tracking-tighter">{value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. AI INTERPRETATION */}
                    <div className="bg-white rounded-[60px] p-10 lg:p-14 border border-slate-50 shadow-sm space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-2.5 h-10 bg-[#48A878] rounded-full"></div>
                            <h3 className="font-black text-[#0A1D37] text-lg uppercase italic tracking-tighter">AI Deep Clinical Interpretation</h3>
                        </div>
                        <div className="bg-[#F8FAFC] p-10 lg:p-14 rounded-[50px] border border-slate-100">
                            <div className="text-slate-600 text-[14px] leading-[2.2] font-medium italic whitespace-pre-line text-justify italic">
                                {data?.interpretation || "AI sedang menyusun narasi interpretasi medis..."}
                            </div>
                        </div>
                    </div>

                </div>

                {/* 5. EMERGENCY ACTION */}
                {health.total < 70 && (
                    <div className="bg-[#E74C3C] p-8 rounded-[40px] flex flex-col md:flex-row items-center justify-between text-white shadow-2xl shadow-red-200 border-4 border-white animate-bounce-short">
                        <div className="flex items-center gap-6 mb-6 md:mb-0">
                            <div className="w-14 h-14 bg-white/20 rounded-3xl flex items-center justify-center text-3xl">⚕️</div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Medical Alert System</p>
                                <p className="text-sm font-black italic">Hasil lab Anda memerlukan perhatian medis segera.</p>
                            </div>
                        </div>
                        <button className="bg-white text-[#E74C3C] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Konsultasi Dokter</button>
                    </div>
                )}

            </div>
        </div>
    );
}