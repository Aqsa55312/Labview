import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid, ScanLine, History as HistoryIcon, User,
    Bell, Activity, Droplets, Zap, Sun, Moon,
    Pill, Clock, Plus, CheckCircle2, X, HelpCircle
} from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function Dashboard() {
    const navigate = useNavigate();
    const user = auth.currentUser;

    // --- STATES ---
    const [latestResult, setLatestResult] = useState(null);
    const [totalScans, setTotalScans] = useState(0);
    const [loading, setLoading] = useState(true);
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [showNotif, setShowNotif] = useState(false);

    // Alarm States
    const [activeAlarm, setActiveAlarm] = useState(null);
    const [alarmAudio, setAlarmAudio] = useState(null);

    // Onboarding & Persistence States
    const [showTutorial, setShowTutorial] = useState(false);
    const [dismissedAlerts, setDismissedAlerts] = useState(() => JSON.parse(localStorage.getItem('dismissed_alerts') || '[]'));
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'light' ? false : true);

    // Medication States
    const [reminders, setReminders] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [medName, setMedName] = useState('');
    const [medTime, setMedTime] = useState('');
    const [currentTime, setCurrentTime] = useState(`${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`);

    // --- LOGIKA ONBOARDING ---
    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenTutorial');
        if (!hasSeen) setShowTutorial(true);
    }, []);

    const finishTutorial = () => {
        localStorage.setItem('hasSeenTutorial', 'true');
        setShowTutorial(false);
    };

    // --- THEME & PERSISTENCE ---
    useEffect(() => {
        localStorage.setItem('dismissed_alerts', JSON.stringify(dismissedAlerts));
    }, [dismissedAlerts]);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // --- ALARM TRIGGER LOGIC ---
    const triggerAlarm = (name) => {
        setActiveAlarm(name);
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.loop = true;
        setAlarmAudio(audio);
        audio.play().catch(() => console.log("User interaction required for audio"));
        if (navigator.vibrate) navigator.vibrate([500, 300, 500]);
    };

    // --- CLOCK & ALARM CHECKER ---
    useEffect(() => {
        const timer = setInterval(() => {
            const now = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
            setCurrentTime(now);

            const hitungMundur = reminders.find(item => item.time === now && !item.isTaken);
            if (hitungMundur && activeAlarm !== hitungMundur.medicineName) {
                triggerAlarm(hitungMundur.medicineName);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [reminders, activeAlarm]);

    // --- DATA FETCHING ---
    useEffect(() => {
        if (!user) return;
        const qLab = query(collection(db, "lab_results"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubLab = onSnapshot(qLab, (snapshot) => {
            setTotalScans(snapshot.size);
            if (!snapshot.empty) {
                const latest = snapshot.docs[0].data();
                setLatestResult(latest);
                const allAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(data => (data.glucose > 110 || (data.hemoglobin > 0 && (data.hemoglobin < 13 || data.hemoglobin > 18))) && !dismissedAlerts.includes(doc.id));
                setRecentAlerts(allAlerts.slice(0, 1));
            }
            setLoading(false);
        });

        const qMed = query(collection(db, "reminders"), where("userId", "==", user.uid), orderBy("time", "asc"));
        const unsubMed = onSnapshot(qMed, (snapshot) => {
            setReminders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubLab(); unsubMed(); };
    }, [user, dismissedAlerts]);

    // --- ACTIONS ---
    const handleAddMedication = async (e) => {
        e.preventDefault();
        if (!medName || !medTime) return;
        try {
            await addDoc(collection(db, "reminders"), {
                userId: user.uid, medicineName: medName, time: medTime, isTaken: false, createdAt: serverTimestamp()
            });
            setMedName(''); setMedTime(''); setIsModalOpen(false);
        } catch (error) { console.error(error); }
    };

    const deleteReminder = async (id) => {
        if (window.confirm("Hapus jadwal obat ini?")) {
            try {
                await deleteDoc(doc(db, "reminders", id));
                if (alarmAudio) {
                    alarmAudio.pause();
                    setAlarmAudio(null);
                }
                setActiveAlarm(null);
            } catch (error) { console.error("Error deleting:", error); }
        }
    };

    const handleMedicineTaken = async () => {
        // 1. Matikan suara & Getar secara manual (No Refresh)
        if (alarmAudio) {
            alarmAudio.pause();
            setAlarmAudio(null);
        }

        // 2. Cari ID reminder yang sedang aktif bunyinya
        const currentReminder = reminders.find(r => r.medicineName === activeAlarm);

        if (currentReminder) {
            try {
                const docRef = doc(db, "reminders", currentReminder.id);
                // 3. Update database dulu
                await updateDoc(docRef, { isTaken: true });
            } catch (e) {
                console.error("Update failed", e);
            }
        }

        // 4. Tutup modal alarm
        setActiveAlarm(null);
    };

    // --- RENDER LOGIC ---
    const calculateScore = () => {
        if (!latestResult) return 0;
        let score = 100;
        if (latestResult.glucose > 140) score -= 30;
        if (latestResult.hemoglobin > 0 && latestResult.hemoglobin < 12) score -= 30;
        return Math.max(score, 10);
    };

    const healthScore = calculateScore();
    const strokeOffset = 534 - (534 * healthScore) / 100;

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] font-['Plus_Jakarta_Sans'] pb-40 transition-colors duration-500">
            <div className="fixed top-[-10%] right-[-10%] w-80 h-80 bg-[#1D9E75]/10 rounded-full blur-[120px] -z-10 hidden dark:block"></div>

            {/* HEADER - z-index dinaikkan agar tombol lonceng bisa diklik */}
            <header className="px-8 pt-16 pb-6 flex justify-between items-center z-[100] relative pointer-events-auto">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.3em] uppercase italic">System Active</p>
                    <h1 className="text-xl font-black italic tracking-tighter uppercase text-[#1D9E75]">{user?.displayName?.split(' ')[0] || ""}</h1>
                </motion.div>

                <div className="flex gap-3 relative z-[110]">
                    <button onClick={() => setShowTutorial(true)} className="p-3 bg-white dark:bg-[#161d28] border border-slate-200 dark:border-[#1e2e40] rounded-2xl text-[#1D9E75] shadow-sm hover:scale-110 active:scale-95 transition-all"><HelpCircle size={20} /></button>
                    <button onClick={() => setIsDark(!isDark)} className="p-3 bg-white dark:bg-[#161d28] border border-slate-200 dark:border-[#1e2e40] rounded-2xl shadow-sm hover:scale-110 active:scale-95 transition-all">
                        {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowNotif(!showNotif)}
                            className="p-3 bg-white dark:bg-[#161d28] border border-slate-200 dark:border-[#1e2e40] rounded-2xl text-slate-500 shadow-sm relative z-[120] hover:scale-110 active:scale-95 transition-all"
                        >
                            <Bell size={20} />
                            {recentAlerts.length > 0 && <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#161d28]"></div>}
                        </button>

                        {/* NOTIF DROP-DOWN */}
                        <AnimatePresence>
                            {showNotif && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-[#161d28] border border-slate-200 dark:border-[#1e2e40] rounded-[25px] shadow-2xl z-[130] p-4"
                                >
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#4a6080] mb-3 px-2 italic">Recent Alerts</h3>
                                    <div className="space-y-2">
                                        {recentAlerts.map(alert => (
                                            <div key={alert.id} className="relative group">
                                                <div onClick={() => navigate(`/detail/${alert.id}`)} className="p-3 bg-slate-50 dark:bg-[#0d1117] rounded-2xl border border-white/5 cursor-pointer pr-8">
                                                    <p className="text-[8px] font-black text-red-500 uppercase">Attention Required</p>
                                                    <p className="text-[10px] leading-tight mt-1 italic line-clamp-2">"{alert.interpretation}"</p>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setDismissedAlerts([...dismissedAlerts, alert.id]); }} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"><X size={14} /></button>
                                            </div>
                                        ))}
                                        {recentAlerts.length === 0 && <p className="text-[9px] text-center py-4 opacity-50 uppercase font-bold">No New Notifications</p>}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            <main className="px-6 space-y-8 z-10 relative">
                {/* HERO INDEX */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#161d28] rounded-[50px] p-10 border border-slate-100 dark:border-[#1e2e40] text-center shadow-xl relative overflow-hidden">
                    <p className="text-[9px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase mb-8">System Health Index</p>
                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="85" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-[#0d1117]" />
                            <motion.circle cx="96" cy="96" r="85" fill="transparent" stroke="#1D9E75" strokeWidth="12" strokeDasharray="534" initial={{ strokeDashoffset: 534 }} animate={{ strokeDashoffset: strokeOffset }} strokeLinecap="round" transition={{ duration: 1.5 }} />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-6xl font-black italic tracking-tighter">{healthScore}</span>
                            <span className={`text-[10px] font-black uppercase mt-1 ${healthScore === 0 ? 'text-slate-400' : 'text-[#1D9E75]'}`}>{healthScore === 0 ? "No Data" : "Optimal"}</span>
                        </div>
                    </div>
                    <div className="mt-8 bg-slate-50 dark:bg-[#0d1117]/50 rounded-[25px] p-4 flex items-center justify-between border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#1D9E75]/10 rounded-xl text-[#1D9E75]"><Zap size={16} /></div>
                            <div className="text-left leading-none">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnostic Link</p>
                                <p className="text-[10px] font-bold">Processed {totalScans} file(s)</p>
                            </div>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-[#1D9E75] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-90 transition-transform">+ Add Med</button>
                    </div>
                </motion.div>

                {/* STATS */}
                <div className="grid grid-cols-2 gap-4">
                    <GridItem icon={<HistoryIcon size={20} />} label="Scans Total" value={loading ? '-' : totalScans} />
                    <GridItem icon={<Droplets size={20} />} label="Blood Sugar" value={loading ? '-' : (latestResult?.glucose || "--")} color="text-blue-500" />
                </div>

                {/* SCHEDULE */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 ml-2">
                        <Pill size={14} className="text-[#1D9E75]" />
                        <h3 className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.3em] uppercase italic">Medical Schedule</h3>
                    </div>
                    <div className="space-y-4">
                        {reminders.map((item) => {
                            const isTime = currentTime === item.time && !item.isTaken;
                            return (
                                <motion.div key={item.id} layout className={`p-6 rounded-[40px] border flex justify-between items-center transition-all ${isTime ? 'bg-[#1D9E75] border-transparent shadow-lg' : 'bg-white dark:bg-[#161d28] border-slate-100 dark:border-[#1e2e40]'} ${item.isTaken ? 'opacity-40 grayscale' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-[22px] ${isTime ? 'bg-white/20 text-white' : 'bg-slate-50 dark:bg-[#0d1117] text-[#1D9E75]'}`}><Pill size={24} /></div>
                                        <div>
                                            <h4 className={`text-sm font-black italic ${isTime ? 'text-white' : ''}`}>{item.medicineName}</h4>
                                            <p className={`text-[9px] font-bold flex items-center gap-1 ${isTime ? 'text-white/70' : 'text-slate-400'}`}><Clock size={12} /> {item.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => deleteReminder(item.id)} className={`p-3 rounded-xl transition-colors ${isTime ? 'text-white/50' : 'text-slate-300 hover:text-red-500'}`}><X size={18} /></button>
                                        <button onClick={() => updateDoc(doc(db, "reminders", item.id), { isTaken: !item.isTaken })} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.isTaken ? 'bg-[#1D9E75] text-white shadow-md' : 'bg-slate-100 dark:bg-[#0d1117] text-slate-300 hover:scale-105'}`}><CheckCircle2 size={24} /></button>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {reminders.length === 0 && <p className="text-center text-[10px] uppercase font-black opacity-30 py-10 tracking-widest">No Schedule Found</p>}
                    </div>
                </section>
            </main>

            {/* EMERGENCY ALARM MODAL */}
            <AnimatePresence>
                {activeAlarm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-red-600 flex flex-col items-center justify-center p-10 text-white text-center">
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-8">
                            <Bell size={60} className="animate-bounce text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Peringatan Obat!</h2>
                        <p className="text-xl font-bold opacity-90 mb-10 leading-relaxed">Waktunya minum obat: <br /> <span className="text-4xl italic underline tracking-tighter block mt-4">{activeAlarm}</span></p>
                        <button
                            onClick={handleMedicineTaken}
                            className="bg-white text-red-600 px-12 py-6 rounded-[30px] font-black uppercase text-xl shadow-2xl active:scale-95 transition-all hover:bg-slate-100"
                        >
                            SAYA SUDAH MINUM
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TUTORIAL MODAL */}
            <AnimatePresence>
                {showTutorial && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0d1117]/95 backdrop-blur-xl" onClick={finishTutorial} />
                        <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="relative w-full max-w-sm bg-white dark:bg-[#161d28] rounded-[50px] p-10 border border-[#1D9E75]/30 shadow-2xl">
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-[#1D9E75]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ScanLine size={40} className="text-[#1D9E75] animate-pulse" />
                                </div>
                                <h2 className="text-xl font-black italic uppercase tracking-tighter text-[#1D9E75]">Panduan Aplikasi</h2>
                                <div className="space-y-6 text-left">
                                    <TutorialStep num="1" title="Foto Laporan" desc="Potret kertas hasil lab Anda." />
                                    <TutorialStep num="2" title="Pantau Skor" desc="Semakin tinggi angka semakin baik." />
                                    <TutorialStep num="3" title="Ingat Obat" desc="Aplikasi menyala jika waktunya minum obat." />
                                </div>
                                <button onClick={finishTutorial} className="w-full py-6 bg-[#1D9E75] text-white rounded-[30px] font-black uppercase tracking-widest shadow-xl mt-6 active:scale-95 transition-transform">Dimengerti</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* NAVIGATION */}
            <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 z-50 pointer-events-none">
                <nav className="max-w-md mx-auto bg-white/90 dark:bg-[#161d28]/90 backdrop-blur-xl border border-slate-200 dark:border-[#1e2e40] rounded-[35px] h-[85px] flex justify-between items-center px-6 shadow-2xl pointer-events-auto">
                    <NavIcon icon={<LayoutGrid size={22} />} active label="Home" />
                    <NavIcon icon={<HistoryIcon size={22} />} onClick={() => navigate('/history')} label="Riwayat" />
                    <div className="relative -mt-16">
                        <button onClick={() => navigate('/scan')} className="w-20 h-20 bg-[#1D9E75] rounded-[30px] flex items-center justify-center text-white shadow-2xl border-[6px] border-[#F8FAFC] dark:border-[#0d1117] active:scale-90 transition-all hover:scale-105"><ScanLine size={30} /></button>
                    </div>
                    <NavIcon icon={<ActivityIcon />} onClick={() => navigate('/trends')} label="Tren" />
                    <NavIcon icon={<User size={22} />} onClick={() => navigate('/profile')} label="Profil" />
                </nav>
            </div>

            {/* ADD MED MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-[#0d1117]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-sm bg-white dark:bg-[#161d28] rounded-[50px] p-10 border border-white/10 shadow-2xl">
                        <h2 className="text-center text-[10px] font-black uppercase tracking-widest text-[#1D9E75] mb-8 italic">Tambah Obat</h2>
                        <form onSubmit={handleAddMedication} className="space-y-6">
                            <input type="text" placeholder="Nama Obat" value={medName} onChange={(e) => setMedName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-100 dark:border-[#1e2e40] rounded-[25px] py-5 px-8 text-xs dark:text-white outline-none focus:border-[#1D9E75] transition-colors" />
                            <input type="time" value={medTime} onChange={(e) => setMedTime(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-100 dark:border-[#1e2e40] rounded-[25px] py-5 px-8 text-xs dark:text-white outline-none focus:border-[#1D9E75] transition-colors" />
                            <button type="submit" className="w-full py-6 bg-[#1D9E75] text-white rounded-[30px] font-black uppercase shadow-xl active:scale-95 transition-all">Simpan</button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

// --- HELPER COMPONENTS ---
function TutorialStep({ num, title, desc }) {
    return (
        <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#1D9E75] text-white flex items-center justify-center font-black flex-shrink-0 text-[10px]">{num}</div>
            <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest dark:text-white">{title}</h4>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed mt-1 italic">{desc}</p>
            </div>
        </div>
    );
}

function GridItem({ icon, label, value, color = "text-[#1D9E75]" }) {
    return (
        <div className="bg-white dark:bg-[#161d28] p-8 rounded-[40px] border border-slate-100 dark:border-[#1e2e40] flex flex-col items-center text-center shadow-sm transition-colors duration-500 hover:shadow-md">
            <div className={`w-12 h-12 bg-slate-50 dark:bg-[#0d1117] rounded-2xl flex items-center justify-center ${color} mb-4`}>{icon}</div>
            <p className="text-[9px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.3em] mb-1">{label}</p>
            <p className="text-3xl font-black italic text-[#1E293B] dark:text-white tracking-tighter">{value}</p>
        </div>
    );
}

function NavIcon({ icon, active, onClick, label }) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all hover:scale-110 active:scale-95 ${active ? 'text-[#1D9E75]' : 'text-slate-400 dark:text-[#4a6080]'}`}>
            {icon}
            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{label}</span>
        </button>
    );
}

function ActivityIcon() {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
}