import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FilePlus, Camera, Activity, Home, FileText, User } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

// API Key Gemini
const genAI = new GoogleGenerativeAI("AIzaSyBNPowjBHrMijHloADnyqgtXyqDM2VSO_g");


export default function Scan() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [detectedValues, setDetectedValues] = useState([]);
    const [step, setStep] = useState(1);
    const [aiResult, setAiResult] = useState(null);
    const [recentScans, setRecentScans] = useState([]);
    const navigate = useNavigate();

    // REFS: Dipisah agar bisa trigger kamera langsung
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleTakePhoto = async () => {
        try {
            const image = await CapCamera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: CameraSource.Camera
            });
            const response = await fetch(image.webPath);
            const blob = await response.blob();
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            processFile(file);
        } catch (error) {
            console.error("Camera error:", error);
        }
    };

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
                2. all_data: Cari SEMUA temuan medis lainnya.
                3. explanation: Berikan narasi interpretasi klinis mendalam minimal 3 paragraf.

                RESPON WAJIB JSON MURNI:
                {
                  "explanation": "...",
                  "main_metrics": { "glucose": 0, "hemoglobin": 0, "cholesterol": 0, "uric_acid": 0 },
                  "all_data": { "Nama Parameter": "Nilai/Hasil" }
                }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text());

        } catch (error) {
            if (error.message.includes("503") && retryCount < 2) {
                await new Promise(res => setTimeout(res, 3000));
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
                setTimeout(() => setStep(3), 600);
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
            simulateExtraction(aiData.main_metrics);
        } catch (error) {
            console.error(error);
            alert("Gagal menganalisis dokumen.");
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
        } catch (e) { alert("Gagal menyimpan."); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500 pb-32 flex flex-col items-center">
            <header className="w-full max-w-md px-6 py-6 flex flex-col sticky top-0 bg-[#F8FAFC] dark:bg-[#0d1117]/80 backdrop-blur-lg z-50 border-b border-[#E2E8F0] dark:border-[#1e2e40]">
                <div className="flex items-center justify-between w-full mb-4">
                    <button onClick={() => navigate('/dashboard')} className="text-[#1E293B] dark:text-[#f0f6ff] p-2 -ml-2 rounded-full hover:bg-white dark:hover:bg-[#161d28] transition-colors">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                </div>
                <div>
                    <h1 className="font-black text-[10px] text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase mb-1">Smart Ingestion</h1>
                    <p className="text-[#1E293B] dark:text-[#f0f6ff] text-sm font-medium tracking-wide">Upload medical reports for AI analysis</p>
                </div>
            </header>

            <main className="flex-1 w-full max-w-md px-6 flex flex-col justify-center pb-12">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="upload-hub" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full flex flex-col gap-6">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => fileInputRef.current.click()}
                                className="bg-white dark:bg-[#161d28]/80 backdrop-blur-xl border border-dashed border-[#E2E8F0] dark:border-[#1e2e40] rounded-[50px] p-8 flex flex-col items-center justify-center cursor-pointer group"
                                style={{ minHeight: '380px' }}
                            >
                                <div className="w-24 h-24 rounded-full bg-[#1e2e40]/50 flex items-center justify-center mb-8 relative">
                                    <div className="absolute inset-0 rounded-full bg-[#1D9E75] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                    <FilePlus size={40} className="text-[#1D9E75] relative z-10" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight mb-2">Select medical file</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-[#4a6080] mb-8 text-center max-w-[200px]">Supports PDF, JPG and PNG files up to 10MB</p>
                                <button className="bg-[#1D9E75] text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg">Select File</button>

                                {/* INPUT HIDDEN KHUSUS FILE/GALLERY */}
                                <input type="file" ref={fileInputRef} accept="image/*,application/pdf" onChange={(e) => processFile(e.target.files[0])} className="hidden" />

                                {/* INPUT HIDDEN KHUSUS KAMERA (Mobile) */}
                                <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={(e) => processFile(e.target.files[0])} className="hidden" />
                            </motion.div>

                            {/* AI STATUS */}
                            <div className="bg-white dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] p-4 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#1D9E75]/10 flex items-center justify-center"><Activity size={18} className="text-[#1D9E75]" /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 tracking-[0.1em] mb-1 uppercase">AI Engine Status</p>
                                        <p className="text-[11px] font-semibold text-[#1E293B] dark:text-white">GEMINI 2.5 FLASH : ACTIVE</p>
                                    </div>
                                </div>
                            </div>

                            {/* TOMBOL ACTIONS */}
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleTakePhoto} // Menggunakan Plugin Camera Capacitor
                                    className="bg-white dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] p-5 rounded-[25px] flex flex-col items-center justify-center gap-3"
                                >
                                    <Camera size={24} className="text-slate-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">TAKE PHOTO</span>
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => fileInputRef.current.click()} // Trigger Galeri/PDF
                                    className="bg-white dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] p-5 rounded-[25px] flex flex-col items-center justify-center gap-3"
                                >
                                    <FileText size={24} className="text-slate-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">IMPORT PDF</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP ANALYZING & RESULTS (Sama seperti sebelumnya) */}
                    {step === 2 && (
                        <motion.div key="analyzing" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-10 w-full">
                            <div className="text-center space-y-3 mt-10">
                                <div className="w-16 h-16 rounded-full bg-[#1e2e40] flex items-center justify-center mx-auto relative mb-6">
                                    <div className="absolute inset-0 rounded-full border-2 border-t-[#1D9E75] animate-spin"></div>
                                    <Activity size={24} className="text-[#1D9E75]" />
                                </div>
                                <h2 className="text-[#1D9E75] font-black text-xs uppercase tracking-[0.3em]">Analyzing Document</h2>
                            </div>
                            <div className="space-y-4 bg-white dark:bg-[#161d28] p-6 rounded-[30px] border dark:border-[#1e2e40]">
                                <div className="flex justify-between items-end text-[#1D9E75] px-1">
                                    <p className="text-[10px] font-black uppercase">Progress</p>
                                    <p className="text-lg font-black">{progress}%</p>
                                </div>
                                <div className="w-full h-1.5 bg-[#1e2e40] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#1D9E75] transition-all duration-700" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && aiResult && (
                        <motion.div key="results" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full flex flex-col gap-6">
                            <div className="bg-[#1D9E75] text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-black italic tracking-tighter mb-2">Analysis Complete</h2>
                                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">AI Interpretation Ready</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#161d28] p-6 rounded-[30px] border dark:border-[#1e2e40] space-y-4">
                                <h3 className="text-[10px] font-black text-[#1D9E75] uppercase tracking-[0.2em]">Key Metrics Found</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {detectedValues.map((item, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-[#0d1117] p-4 rounded-2xl border dark:border-[#1e2e40]">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{item.label}</p>
                                            <p className="text-xl font-black dark:text-white">{item.value} <span className="text-[10px] font-bold text-slate-500">{item.unit}</span></p>
                                        </div>
                                    ))}
                                </div>
                                {detectedValues.length === 0 && (
                                    <p className="text-xs text-slate-500 text-center py-4">No standard metrics detected.</p>
                                )}
                            </div>

                            <div className="bg-white dark:bg-[#161d28] p-6 rounded-[30px] border dark:border-[#1e2e40] space-y-4">
                                <h3 className="text-[10px] font-black text-[#1D9E75] uppercase tracking-[0.2em]">Clinical Interpretation</h3>
                                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                    {aiResult.explanation}
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full py-6 bg-[#1E293B] dark:bg-white text-white dark:text-[#161d28] rounded-[30px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Save to Dashboard"}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}