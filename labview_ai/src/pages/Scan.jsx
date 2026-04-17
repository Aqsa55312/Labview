import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key Gemini
const genAI = new GoogleGenerativeAI("AIzaSyAkNQDM89T-EcM_3_uiRJFLD95_PbMs2cg");

export default function Scan() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [detectedValues, setDetectedValues] = useState([]);
    const [step, setStep] = useState(1);
    const [aiResult, setAiResult] = useState(null);
    const [recentScans, setRecentScans] = useState([]);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchRecent = async () => {
            if (auth.currentUser) {
                try {
                    const q = query(
                        collection(db, "lab_results"),
                        where("userId", "==", auth.currentUser.uid),
                        orderBy("createdAt", "desc"),
                        limit(3)
                    );
                    const snap = await getDocs(q);
                    setRecentScans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } catch (e) { console.error(e); }
            }
        };
        fetchRecent();
    }, []);

    // PROMPT AI FLEKSIBEL DENGAN LOGIKA RETRY (503 FIX)
    const runAIAnalysis = async (text, retryCount = 0) => {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `
                Tugas: Anda adalah ahli ekstraksi data medis LabView AI. 
                Analisis teks hasil OCR berikut: "${text}"

                TUGAS EKSTRAKSI:
                1. main_metrics: Ekstrak HANYA ANGKA untuk glucose, hemoglobin, cholesterol, dan uric_acid. (Gunakan 0 jika tidak ada).
                2. all_data: Cari SEMUA temuan medis lainnya (misal: Tekanan Darah, Suhu, Berat Badan, Diagnosa spesifik, atau hasil lab lain) dalam bentuk key-value pair.
                3. explanation: Berikan narasi interpretasi klinis mendalam minimal 3 paragraf.

                RESPON WAJIB JSON MURNI:
                {
                  "explanation": "...",
                  "main_metrics": { 
                     "glucose": 0, 
                     "hemoglobin": 0, 
                     "cholesterol": 0, 
                     "uric_acid": 0 
                  },
                  "all_data": {
                     "Nama Parameter": "Nilai/Hasil"
                  }
                }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text());

        } catch (error) {
            // Logika Retry jika Server Busy (Error 503)
            if (error.message.includes("503") && retryCount < 2) {
                console.log(`Server sibuk (503), mencoba lagi... Percobaan ke-${retryCount + 1}`);
                await new Promise(res => setTimeout(res, 3000)); // Tunggu 3 detik
                return runAIAnalysis(text, retryCount + 1);
            }
            throw error;
        }
    };

    const simulateExtraction = (metrics) => {
        const items = [
            { label: "Hemoglobin (Hb)", value: metrics.hemoglobin, unit: "g/dL" },
            { label: "Glucose", value: metrics.glucose, unit: "mg/dL" },
            { label: "Cholesterol", value: metrics.cholesterol, unit: "mg/dL" },
            { label: "Uric Acid", value: metrics.uric_acid, unit: "mg/dL" }
        ].filter(item => item.value > 0);

        let count = 0;
        const interval = setInterval(() => {
            if (count < items.length) {
                setDetectedValues(prev => [...prev, items[count]]);
                setProgress(prev => Math.min(prev + 20, 90));
                count++;
            } else {
                clearInterval(interval);
                setProgress(100);
            }
        }, 800);
    };

    const processFile = async (file) => {
        if (!file) return;
        setStep(2);
        setLoading(true);
        setProgress(15);
        setDetectedValues([]);

        try {
            const ocr = await Tesseract.recognize(file, 'eng+ind');
            const rawText = ocr.data.text;
            setProgress(40);

            const aiData = await runAIAnalysis(rawText);
            setAiResult(aiData);

            // Memulai animasi tampilan nilai yang terdeteksi
            simulateExtraction(aiData.main_metrics);

        } catch (error) {
            console.error(error);
            alert("Gagal menganalisis dokumen. Silakan coba lagi nanti.");
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!aiResult || loading) return;
        setLoading(true);
        try {
            if (auth.currentUser) {
                await addDoc(collection(db, "lab_results"), {
                    userId: auth.currentUser.uid,
                    interpretation: aiResult.explanation,
                    glucose: Number(aiResult.main_metrics?.glucose) || 0,
                    hemoglobin: Number(aiResult.main_metrics?.hemoglobin) || 0,
                    cholesterol: Number(aiResult.main_metrics?.cholesterol) || 0,
                    uric_acid: Number(aiResult.main_metrics?.uric_acid) || 0,
                    all_data: aiResult.all_data || {}, // MENYIMPAN DATA TAMBAHAN
                    createdAt: serverTimestamp()
                });
            }
            navigate('/dashboard');
        } catch (e) {
            alert("Gagal menyimpan ke database.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 pb-32">
            <header className="px-6 py-4 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white z-50">
                <button onClick={() => navigate('/dashboard')} className="text-xl">←</button>
                <h1 className="font-black text-sm uppercase tracking-tighter italic text-[#48A878]">Smart Ingestion</h1>
                <div className="w-6"></div>
            </header>

            <main className="max-w-md mx-auto p-6">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="bg-[#E8F5EE] p-5 rounded-[25px] border border-[#D1E9DB] flex gap-4">
                            <span className="text-xl">✨</span>
                            <p className="text-[11px] text-[#2D6A4F] font-semibold leading-relaxed">AI kami akan mengekstrak metrik kesehatan utama dan temuan medis lainnya dari laporan Anda.</p>
                        </div>

                        <div className="border-4 border-dashed border-[#D1E9DB] rounded-[40px] p-12 text-center relative group hover:bg-slate-50 transition-all cursor-pointer" onClick={() => fileInputRef.current.click()}>
                            <div className="w-16 h-16 bg-[#E8F5EE] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl text-[#48A878]">☁️</div>
                            <h3 className="text-lg font-black tracking-tight">Tap to upload lab results</h3>
                            <button className="mt-6 bg-[#48A878] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg">Select File</button>
                            <input type="file" ref={fileInputRef} accept="image/*,application/pdf" onChange={(e) => processFile(e.target.files[0])} className="hidden" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => fileInputRef.current.click()} className="bg-white border border-slate-100 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 shadow-sm transition-all active:scale-95">📸 Take Photo</button>
                            <button onClick={() => fileInputRef.current.click()} className="bg-white border border-slate-100 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 shadow-sm transition-all active:scale-95">📄 Import PDF</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in duration-700 pt-10">
                        <div className="text-center space-y-2">
                            <h2 className="text-[#48A878] font-black text-sm uppercase italic tracking-tighter animate-pulse">Analyzing Document...</h2>
                            <p className="text-[10px] text-slate-400 font-medium italic">Gemini AI is extracting biomarkers</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end px-1 text-[#48A878]">
                                <p className="text-[11px] font-black uppercase tracking-widest italic">Progress</p>
                                <p className="text-xl font-black">{progress}%</p>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-[#48A878] transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {detectedValues.length > 0 ? detectedValues.map((item, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 p-5 rounded-[25px] flex justify-between items-center shadow-sm animate-in slide-in-from-bottom-2">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase">✓ {item.label}</span>
                                    <span className="text-sm font-black text-[#0A1D37] italic">{item.value} <small className="text-[9px] text-slate-400 font-bold">{item.unit}</small></span>
                                </div>
                            )) : (
                                <p className="text-center text-[10px] text-slate-400 italic">Mencari parameter numerik...</p>
                            )}
                        </div>
                        {progress === 100 && (
                            <button onClick={() => setStep(3)} className="w-full bg-[#48A878] text-white p-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-xl shadow-green-100 animate-in zoom-in">Confirm & Interpret ✨</button>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in slide-in-from-bottom-10 duration-700 space-y-8">
                        <div className="bg-white rounded-[50px] p-10 shadow-sm border border-slate-50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-green-50/40 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                            <div className="flex items-center gap-3 mb-8 relative z-10">
                                <div className="w-2 h-6 bg-[#48A878] rounded-full"></div>
                                <h2 className="text-slate-900 font-black text-xs uppercase italic tracking-tighter">AI Analysis Result</h2>
                            </div>
                            <div className="text-slate-600 text-[12px] leading-[1.8] font-medium whitespace-pre-line text-justify italic relative z-10">
                                {aiResult?.explanation}
                            </div>
                        </div>
                        <button onClick={handleSave} disabled={loading} className="w-full bg-[#48A878] text-white p-7 rounded-[35px] font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                            {loading ? "SAVING TO CLOUD..." : "SAVE REPORT & FINISH"}
                        </button>
                    </div>
                )}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-50 p-5 flex justify-around items-center z-[100]">
                <div onClick={() => navigate('/dashboard')} className="flex flex-col items-center opacity-30 cursor-pointer"><span className="text-xl">🏠</span><span className="text-[8px] font-black">HOME</span></div>
                <div className="flex flex-col items-center text-[#48A878] cursor-pointer"><span className="text-xl">📄</span><span className="text-[8px] font-black">SCAN</span></div>
                <div onClick={() => navigate('/history')} className="flex flex-col items-center opacity-30 cursor-pointer"><span className="text-xl">📊</span><span className="text-[8px] font-black">REPORTS</span></div>
                <div onClick={() => navigate('/profile')} className="flex flex-col items-center opacity-30 cursor-pointer"><span className="text-xl">👤</span><span className="text-[8px] font-black">PROFILE</span></div>
            </nav>
        </div>
    );
}