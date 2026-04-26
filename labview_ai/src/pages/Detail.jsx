import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Share2, Sparkles, Calendar, Clock,
    Download, Activity, Send, Bot, User as UserIcon,
    X, MessageCircle, Zap
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function Detail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // AI Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Halo Aqsa! Ada yang ingin ditanyakan tentang hasil lab ini?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const docRef = doc(db, "lab_results", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setData(docSnap.data());
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const contextPrompt = `
                Kamu adalah LabView AI Assistant. Konteks data lab user:
                Hemoglobin: ${data?.hemoglobin}, Glucose: ${data?.glucose}, Cholesterol: ${data?.cholesterol}.
                User bertanya: "${userMsg}". 
                Jawab dengan singkat, padat, dan ramah dalam Bahasa Indonesia.
            `;
            const result = await model.generateContent(contextPrompt);
            const response = await result.response;
            setMessages(prev => [...prev, { role: 'bot', text: response.text() }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: "Maaf, koneksi AI sedang sibuk." }]);
        } finally {
            setIsTyping(false);
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] flex flex-col items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="text-[#1D9E75] mb-4">
                <Sparkles size={40} />
            </motion.div>
            <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase">Decrypting Report</p>
        </div>
    );

    const isAlert = data?.glucose > 140 || data?.hemoglobin < 10;

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500 font-['Plus_Jakarta_Sans'] pb-20">
            {/* HEADER */}
            <header className="px-8 pt-16 pb-6 flex justify-between items-center fixed top-0 w-full bg-[#F8FAFC]/90 dark:bg-[#0d1117]/90 backdrop-blur-xl z-50 border-b border-[#E2E8F0] dark:border-white/5">
                <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-2xl">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-500 dark:text-[#4a6080]">AI Diagnostic</h1>
                <button className="p-3 bg-white dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-2xl">
                    <Share2 size={20} />
                </button>
            </header>

            <main className="px-8 pt-36 space-y-8">
                {/* METADATA */}
                <div className="flex gap-6 justify-center">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-[#4a6080] text-[9px] font-black uppercase tracking-widest">
                        <Calendar size={14} className="text-[#1D9E75]" />
                        {data?.createdAt?.toDate().toLocaleDateString('id-ID')}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-[#4a6080] text-[9px] font-black uppercase tracking-widest">
                        <Clock size={14} className="text-[#1D9E75]" />
                        {data?.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* INTERPRETATION CARD */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-[#161d28] rounded-[45px] p-10 border border-[#E2E8F0] dark:border-[#1e2e40] relative overflow-hidden shadow-xl">
                    <div className="text-center mb-8 relative z-10">
                        <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase mb-4">SYSTEM ANALYTICS</p>
                        <h2 className={`text-2xl font-black italic uppercase ${isAlert ? 'text-red-500' : 'text-[#1D9E75]'}`}>
                            {isAlert ? "Attention Required" : "Condition Optimal"}
                        </h2>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-[#f0f6ff]/80 leading-[1.8] italic text-center px-4 font-medium">
                        "{data?.interpretation}"
                    </p>
                </motion.div>

                {/* METRICS GRID */}
                <div className="grid grid-cols-2 gap-4">
                    <MetricBox label="Hemoglobin" value={data?.hemoglobin} unit="g/dL" />
                    <MetricBox label="Glucose" value={data?.glucose} unit="mg/dL" highlight={data?.glucose > 140} />
                    <MetricBox label="Cholesterol" value={data?.cholesterol} unit="mg/dL" />
                    <MetricBox label="Uric Acid" value={data?.uricAcid} unit="mg/dL" />
                </div>
            </main>

            {/* --- FLOATING AI CHAT BOT --- */}
            <div className="fixed bottom-8 right-8 z-[100]">
                <AnimatePresence>
                    {isChatOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="absolute bottom-20 right-0 w-[320px] h-[450px] bg-white dark:bg-[#161d28] rounded-[35px] border border-[#E2E8F0] dark:border-[#1e2e40] shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-5 bg-[#1D9E75] text-white flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Bot size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Health Assistant</span>
                                </div>
                                <button onClick={() => setIsChatOpen(false)}><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'bot' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] ${msg.role === 'bot' ? 'bg-slate-100 dark:bg-[#0d1117] text-slate-600 dark:text-slate-300' : 'bg-[#1D9E75] text-white'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && <div className="text-[9px] font-bold text-[#1D9E75] animate-pulse">AI ANALYZING...</div>}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-white/5 flex gap-2">
                                <input
                                    value={input} onChange={(e) => setInput(e.target.value)}
                                    placeholder="Tanya hasil lab..."
                                    className="flex-1 bg-slate-50 dark:bg-[#0d1117] rounded-xl px-4 py-3 text-[11px] focus:outline-none border border-transparent focus:border-[#1D9E75]"
                                />
                                <button className="bg-[#1D9E75] p-3 rounded-xl text-white"><Send size={16} /></button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="w-16 h-16 bg-[#1D9E75] rounded-full flex items-center justify-center text-white shadow-2xl"
                >
                    {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
                </motion.button>
            </div>
        </div>
    );
}

function MetricBox({ label, value, unit, highlight }) {
    return (
        <div className={`bg-white dark:bg-[#161d28] p-7 rounded-[40px] border transition-all ${highlight ? 'border-red-500 shadow-lg' : 'border-[#E2E8F0] dark:border-[#1e2e40]'}`}>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 text-slate-500 dark:text-[#4a6080]">{label}</p>
            <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black italic ${highlight ? 'text-red-500' : 'dark:text-white'}`}>{value || '--'}</span>
                <span className="text-[9px] font-bold uppercase text-slate-500">{unit}</span>
            </div>
        </div>
    );
}