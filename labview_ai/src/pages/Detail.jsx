import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Share2, Sparkles, Calendar, Clock,
    Download, Activity, Send, Bot, User as UserIcon,
    X, MessageCircle, Zap, AlertTriangle
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { chatWithLabAssistant } from '../services/openrouter';
import { useLanguage } from '../LanguageContext';

export default function Detail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    // AI Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Halo user! Ada yang ingin ditanyakan tentang hasil lab ini?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (isChatOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isTyping, isChatOpen]);

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
        const updatedMessages = [...messages, { role: 'user', text: userMsg }];
        setMessages(updatedMessages);
        setInput('');
        setIsTyping(true);

        try {
            const botResponse = await chatWithLabAssistant(updatedMessages, data);
            setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'bot', text: t('ai_busy_error') }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] flex flex-col items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="text-[#1D9E75] mb-4">
                <Sparkles size={40} />
            </motion.div>
            <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase">{t('decrypting_report')}</p>
        </div>
    );

    const getStatus = (data) => {
        if (!data) return { type: 'normal', title: t('optimal_condition'), textColor: "text-[#1D9E75] dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-[#1D9E75]/10", titleColor: "text-[#1D9E75]", icon: Sparkles, message: t('optimal_condition_msg') };

        let isDanger = false;
        let isWarning = false;

        if (data.overall_status === 'danger') {
            isDanger = true;
        } else if (data.overall_status === 'warning') {
            isWarning = true;
        } else if (!data.overall_status) {
            const numGlucose = Number(data.glucose || 0);
            const numHb = Number(data.hemoglobin || 0);
            const numChol = Number(data.cholesterol || 0);
            const numUric = Number(data.uricAcid || data.uric_acid || 0);

            if ((data.glucose && numGlucose > 200) || (data.hemoglobin && numHb < 8) || (data.cholesterol && numChol > 240) || (numUric > 9)) {
                isDanger = true;
            } else if ((data.glucose && numGlucose > 140) || (data.hemoglobin && numHb < 12) || (data.cholesterol && numChol > 200) || (numUric > 7)) {
                isWarning = true;
            }
        }

        if (isDanger) {
            return {
                type: 'danger',
                title: t('extra_attention'),
                textColor: "text-rose-600 dark:text-rose-400",
                bgColor: "bg-rose-50 dark:bg-rose-500/10",
                titleColor: "text-rose-500",
                icon: AlertTriangle,
                message: t('extra_attention_msg')
            };
        } else if (isWarning) {
            return {
                type: 'warning',
                title: t('needs_monitoring'),
                textColor: "text-amber-600 dark:text-amber-400",
                bgColor: "bg-amber-50 dark:bg-amber-500/10",
                titleColor: "text-amber-500",
                icon: AlertTriangle,
                message: t('needs_monitoring_msg')
            };
        } else {
            return {
                type: 'normal',
                title: t('optimal_condition'),
                textColor: "text-[#1D9E75] dark:text-emerald-400",
                bgColor: "bg-emerald-50 dark:bg-[#1D9E75]/10",
                titleColor: "text-[#1D9E75]",
                icon: Sparkles,
                message: t('optimal_condition_msg')
            };
        }
    };

    const getMetricStatus = (key, value) => {
        if (!value) return 'normal';
        const val = Number(value);
        if (key === 'hemoglobin') {
            if (val > 0 && val < 8) return 'danger';
            if (val > 0 && val < 12) return 'warning';
            return 'normal';
        }
        if (key === 'glucose') {
            if (val > 200) return 'danger';
            if (val > 140) return 'warning';
            return 'normal';
        }
        if (key === 'cholesterol') {
            if (val > 240) return 'danger';
            if (val > 200) return 'warning';
            return 'normal';
        }
        if (key === 'uricAcid') {
            if (val > 9) return 'danger';
            if (val > 7) return 'warning';
            return 'normal';
        }
        return 'normal';
    };

    const status = getStatus(data);

    const displayDate = data?.test_date ? new Date(data.test_date).toLocaleDateString('id-ID') : data?.createdAt?.toDate()?.toLocaleDateString('id-ID');
    const displayTime = data?.test_date ? null : data?.createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const flattenObject = (obj, prefix = '') => {
        return Object.keys(obj || {}).reduce((acc, k) => {
            const pre = prefix.length ? prefix + ' - ' : '';
            // Allow flattening of arrays too! Keys will become 0, 1, 2...
            if (typeof obj[k] === 'object' && obj[k] !== null) {
                Object.assign(acc, flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    };

    const flatAllData = flattenObject(data?.all_data || {});

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500 font-['Plus_Jakarta_Sans'] pb-20">
            {/* HEADER */}
            <header className="px-8 pt-16 pb-6 flex justify-between items-center fixed top-0 w-full bg-[#F8FAFC]/90 dark:bg-[#0d1117]/90 backdrop-blur-xl z-50 border-b border-[#E2E8F0] dark:border-white/5">
                <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-2xl">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-500 dark:text-[#4a6080]">{t('ai_diagnostic')}</h1>
                <button className="p-3 bg-white dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-2xl">
                    <Share2 size={20} />
                </button>
            </header>

            <main className="px-8 pt-36 space-y-8">
                {/* METADATA */}
                <div className="flex gap-6 justify-center">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-[#4a6080] text-[9px] font-black uppercase tracking-widest">
                        <Calendar size={14} className="text-[#1D9E75]" />
                        {displayDate || '--/--/----'}
                    </div>
                    {displayTime && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-[#4a6080] text-[9px] font-black uppercase tracking-widest">
                            <Clock size={14} className="text-[#1D9E75]" />
                            {displayTime}
                        </div>
                    )}
                </div>

                {/* INTERPRETATION CARD */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-[#161d28] rounded-[45px] p-8 sm:p-10 border border-[#E2E8F0] dark:border-[#1e2e40] relative overflow-hidden shadow-xl">
                    <div className="text-center mb-8 relative z-10">
                        <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase mb-4">{t('system_analytics')}</p>
                        <h2 className={`text-2xl font-black italic uppercase ${status.titleColor}`}>
                            {status.title}
                        </h2>

                        <div className={`mt-4 mx-auto w-full max-w-[280px] sm:max-w-sm flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl text-[10px] sm:text-[11px] font-bold text-center leading-relaxed ${status.bgColor} ${status.textColor}`}>
                            <status.icon size={16} className="shrink-0 mb-1 sm:mb-0" />
                            <span>{status.message}</span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-[#f0f6ff]/80 leading-[1.8] italic text-center px-2 sm:px-4 font-medium">
                        "{data?.interpretation}"
                    </p>
                </motion.div>

                {/* METRICS GRID */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {data?.hemoglobin > 0 && <MetricBox label="Hemoglobin" value={data.hemoglobin} unit="g/dL" status={getMetricStatus('hemoglobin', data.hemoglobin)} />}
                    {data?.glucose > 0 && <MetricBox label="Glucose" value={data.glucose} unit="mg/dL" status={getMetricStatus('glucose', data.glucose)} />}
                    {data?.cholesterol > 0 && <MetricBox label="Cholesterol" value={data.cholesterol} unit="mg/dL" status={getMetricStatus('cholesterol', data.cholesterol)} />}
                    {(data?.uricAcid > 0 || data?.uric_acid > 0) && <MetricBox label="Uric Acid" value={data.uricAcid || data.uric_acid} unit="mg/dL" status={getMetricStatus('uricAcid', data.uricAcid || data.uric_acid)} />}

                    {Object.entries(flatAllData).map(([key, val], idx) => (
                        <MetricBox key={idx} label={key} value={String(val)} unit="" status="normal" />
                    ))}
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
                            <div className="p-5 bg-primary text-white flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Bot size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t('health_assistant')}</span>
                                </div>
                                <button onClick={() => setIsChatOpen(false)}><X size={20} /></button>
                            </div>

                            <div className="p-3 border-b border-slate-100 dark:border-white/5 flex gap-2 justify-center bg-slate-50 dark:bg-[#0d1117]">
                                <button className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-primary dark:bg-primary/10 dark:text-blue-400 px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-transform" onClick={() => alert('Summary Exported!')}><Download size={12} /> {t('export_for_doctor')}</button>
                                <button className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-[#1D9E75] dark:bg-[#1D9E75]/10 dark:text-emerald-400 px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-transform" onClick={() => window.open('https://halodoc.com', '_blank')}><Activity size={12} /> {t('consult_telemed')}</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'bot' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] ${msg.role === 'bot' ? 'bg-slate-100 dark:bg-[#0d1117] text-slate-600 dark:text-slate-300' : 'bg-primary text-white'}`}>
                                            {i === 0 && msg.role === 'bot' && msg.text === 'Halo user! Ada yang ingin ditanyakan tentang hasil lab ini?' ? t('chat_welcome') : msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && <div className="text-[9px] font-bold text-primary animate-pulse">{t('ai_analyzing')}</div>}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-white/5 flex gap-2">
                                <input
                                    value={input} onChange={(e) => setInput(e.target.value)}
                                    placeholder={t('ask_lab_placeholder')}
                                    className="flex-1 bg-slate-50 dark:bg-[#0d1117] rounded-xl px-4 py-3 text-[16px] focus:outline-none border border-transparent focus:border-primary"
                                />
                                <button className="bg-primary p-3 rounded-xl text-white"><Send size={16} /></button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl"
                >
                    {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
                </motion.button>
            </div>
        </div>
    );
}

function MetricBox({ label, value, unit, status = 'normal' }) {
    const { t } = useLanguage();
    const isDanger = status === 'danger';
    const isWarning = status === 'warning';

    let borderColor = 'border-[#E2E8F0] dark:border-[#1e2e40]';
    let textColor = 'dark:text-white';
    let badge = null;

    if (isDanger) {
        borderColor = 'border-rose-400 shadow-lg';
        textColor = 'text-rose-500';
        badge = <span className="flex items-center gap-1 text-[8px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-full text-center"><Activity size={10} className="hidden sm:block" /> {t('check_further')}</span>;
    } else if (isWarning) {
        borderColor = 'border-amber-400 shadow-lg';
        textColor = 'text-amber-500';
        badge = <span className="flex items-center gap-1 text-[8px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full text-center"><Activity size={10} className="hidden sm:block" /> {t('attention')}</span>;
    }

    const valStr = String(value || '--');
    const isLong = valStr.length > 20;
    const textSize = isLong ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl';

    return (
        <div className={`bg-white dark:bg-[#161d28] p-5 sm:p-7 rounded-[30px] sm:rounded-[40px] border transition-all ${borderColor}`}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-[#4a6080] line-clamp-1">{label}</p>
                {badge}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
                <span className={`${textSize} font-black italic ${textColor} break-all`}>{valStr}</span>
                {unit && <span className="text-[9px] font-bold uppercase text-slate-500">{unit}</span>}
            </div>
        </div>
    );
}