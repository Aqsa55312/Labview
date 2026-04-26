import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FilePlus, Camera, Activity, Home, FileText, User } from 'lucide-react';

// API Key Gemini
const genAI = new GoogleGenerativeAI("AIzaSyBYFGnX4HVxHcR4yvQ00WO9xdiK2SDA6oM");

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
                    all_data: aiResult.all_data || {},
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
                        Smart Ingestion
                    </h1>
                    <p className="text-[#1E293B] dark:text-[#f0f6ff] text-sm font-medium tracking-wide">
                        Upload medical reports for AI analysis
                    </p>
                </div>
            </header>

            <main className="flex-1 w-full max-w-md px-6 flex flex-col justify-center pb-12">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="upload-hub"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="w-full flex flex-col gap-6"
                        >
                            {/* CENTRAL UPLOAD HUB */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => fileInputRef.current.click()}
                                className="bg-[#FFFFFF] dark:bg-[#161d28]/80 backdrop-blur-xl border border-dashed border-[#E2E8F0] dark:border-[#1e2e40] rounded-[50px] p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[#1e2e40]/40 group"
                                style={{ minHeight: '380px' }}
                            >
                                <div className="w-24 h-24 rounded-full bg-[#1e2e40]/50 flex items-center justify-center mb-8 relative">
                                    <div className="absolute inset-0 rounded-full bg-[#1D9E75] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                    <FilePlus size={40} className="text-[#1D9E75] relative z-10" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight mb-2 text-[#1E293B] dark:text-[#f0f6ff]">Select medical file</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-[#4a6080] mb-8 text-center max-w-[200px]">
                                    Supports PDF, JPG and PNG files up to 10MB
                                </p>

                                <button className="bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(29,158,117,0.3)] transition-all flex items-center gap-2">
                                    <Activity size={16} />
                                    Select File
                                </button>
                                <input type="file" ref={fileInputRef} accept="image/*,application/pdf" onChange={(e) => processFile(e.target.files[0])} className="hidden" />
                            </motion.div>

                            {/* AI STATUS PANEL */}
                            <div className="bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] p-4 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0">
                                        <Activity size={18} className="text-[#1D9E75]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-[#4a6080] tracking-[0.1em] mb-1">AI ENGINE STATUS</p>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse"></span>
                                            <p className="text-[11px] font-semibold tracking-wide text-[#1E293B] dark:text-[#f0f6ff]">GEMINI 2.5 FLASH : ACTIVE</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-16 h-1 bg-[#1e2e40] rounded-full overflow-hidden">
                                    <div className="w-1/3 h-full bg-[#1D9E75] block"></div>
                                </div>
                            </div>

                            {/* QUICK ACTIONS */}
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => fileInputRef.current.click()}
                                    className="bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] p-5 rounded-[25px] flex flex-col items-center justify-center gap-3 hover:bg-[#1e2e40]/50 transition-colors"
                                >
                                    <Camera size={24} className="text-slate-500 dark:text-[#4a6080]" strokeWidth={1.5} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#4a6080]">TAKE PHOTO</span>
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => fileInputRef.current.click()}
                                    className="bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] p-5 rounded-[25px] flex flex-col items-center justify-center gap-3 hover:bg-[#1e2e40]/50 transition-colors"
                                >
                                    <FileText size={24} className="text-slate-500 dark:text-[#4a6080]" strokeWidth={1.5} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#4a6080]">IMPORT PDF</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="analyzing"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="space-y-10 w-full"
                        >
                            <div className="text-center space-y-3 mt-10">
                                <div className="w-16 h-16 rounded-full bg-[#1e2e40] flex items-center justify-center mx-auto relative mb-6">
                                    <div className="absolute inset-0 rounded-full border-2 border-t-[#1D9E75] border-r-transparent border-b-[#1D9E75]/30 border-l-[#1D9E75]/10 animate-spin"></div>
                                    <Activity size={24} className="text-[#1D9E75] animate-pulse" />
                                </div>
                                <h2 className="text-[#1D9E75] font-black text-xs uppercase tracking-[0.3em]">Analyzing Document</h2>
                                <p className="text-[11px] text-slate-500 dark:text-[#4a6080] font-medium tracking-wide">Gemini ENGINE EXTRACTING BIOMARKERS</p>
                            </div>
                            <div className="space-y-4 bg-[#FFFFFF] dark:bg-[#161d28] p-6 rounded-[30px] border border-[#E2E8F0] dark:border-[#1e2e40]">
                                <div className="flex justify-between items-end px-1 text-[#1D9E75]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Progress</p>
                                    <p className="text-lg font-black">{progress}%</p>
                                </div>
                                <div className="w-full h-1.5 bg-[#1e2e40] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#1D9E75] transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {detectedValues.length > 0 ? detectedValues.map((item, idx) => (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        key={idx}
                                        className="bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] p-5 rounded-[25px] flex justify-between items-center"
                                    >
                                        <span className="text-[11px] font-bold text-slate-500 dark:text-[#4a6080] tracking-widest uppercase">{item.label}</span>
                                        <span className="text-sm font-black text-[#1E293B] dark:text-[#f0f6ff]">{item.value} <small className="text-[9px] text-[#1D9E75] font-bold ml-1">{item.unit}</small></span>
                                    </motion.div>
                                )) : (
                                    <p className="text-center text-[10px] text-slate-500 dark:text-[#4a6080] font-medium tracking-wide">Waiting for parameters...</p>
                                )}
                            </div>

                            {progress === 100 && (
                                <motion.button
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={() => setStep(3)}
                                    className="w-full bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white p-6 rounded-[30px] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(29,158,117,0.2)] transition-all mt-8"
                                >
                                    Confirm Results
                                </motion.button>
                            )}
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="results"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="space-y-8 w-full"
                        >
                            <div className="bg-[#FFFFFF] dark:bg-[#161d28] rounded-[40px] p-8 border border-[#E2E8F0] dark:border-[#1e2e40] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-[#1D9E75]/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                <div className="flex items-center gap-3 mb-8 relative z-10 border-b border-[#E2E8F0] dark:border-[#1e2e40] pb-6">
                                    <div className="w-1.5 h-6 bg-[#1D9E75] rounded-full"></div>
                                    <h2 className="text-[#1E293B] dark:text-[#f0f6ff] font-black text-[10px] uppercase tracking-[0.2em]">Diagnostic Summary</h2>
                                </div>
                                <div className="text-[#a0b0c0] text-[13px] leading-[1.9] font-medium whitespace-pre-line relative z-10">
                                    {aiResult?.explanation}
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full bg-[#1D9E75] disabled:bg-[#1e2e40] disabled:text-slate-500 dark:text-[#4a6080] text-white p-6 rounded-[30px] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(29,158,117,0.2)] transition-all"
                            >
                                {loading ? "SAVING RECORD..." : "SAVE TO PROFILE"}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* BOTTOM NAVIGATION (Dark Mode Match) */}
            <nav className="fixed bottom-0 w-full max-w-md bg-[#F8FAFC] dark:bg-[#0d1117]/95 backdrop-blur-xl border-t border-[#E2E8F0] dark:border-[#1e2e40] p-6 pb-8 flex justify-around items-center z-[100]">
                <div onClick={() => navigate('/dashboard')} className="flex flex-col items-center text-slate-500 dark:text-[#4a6080] cursor-pointer hover:text-[#1E293B] dark:hover:text-[#f0f6ff] transition-colors">
                    <Home size={20} strokeWidth={2} className="mb-2" />
                    <span className="text-[8px] font-black tracking-widest">HOME</span>
                </div>
                <div className="flex flex-col items-center text-[#1D9E75] cursor-pointer">
                    <Activity size={20} strokeWidth={2} className="mb-2" />
                    <span className="text-[8px] font-black tracking-widest">SCAN</span>
                </div>
                <div onClick={() => navigate('/history')} className="flex flex-col items-center text-slate-500 dark:text-[#4a6080] cursor-pointer hover:text-[#1E293B] dark:hover:text-[#f0f6ff] transition-colors">
                    <FileText size={20} strokeWidth={2} className="mb-2" />
                    <span className="text-[8px] font-black tracking-widest">REPORTS</span>
                </div>
                <div onClick={() => navigate('/profile')} className="flex flex-col items-center text-slate-500 dark:text-[#4a6080] cursor-pointer hover:text-[#1E293B] dark:hover:text-[#f0f6ff] transition-colors">
                    <User size={20} strokeWidth={2} className="mb-2" />
                    <span className="text-[8px] font-black tracking-widest">PROFILE</span>
                </div>
            </nav>
        </div>
    );
}