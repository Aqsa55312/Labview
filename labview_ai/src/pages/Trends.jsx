import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp, Activity, Heart, Loader2, Zap, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function Trends() {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState('glucose');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, trend: 0 });

  // --- LOGIKA PENJELASAN TREN (UNTUK LANSIA) ---
  const getTrendInsight = () => {
    if (chartData.length < 2) return "Lakukan scan minimal 2 kali untuk melihat perkembangan kesehatan Anda.";

    const latest = chartData[chartData.length - 1].val;
    const previous = chartData[chartData.length - 2].val;
    const diff = latest - previous;

    if (selectedMetric === 'glucose') {
      if (latest > 140) return "Gula darah Anda tinggi (di atas 140 mg/dL). Disarankan untuk membatasi nasi putih, roti, dan minuman manis. Cobalah jalan santai selama 15 menit.";
      if (diff > 15) return "Terjadi kenaikan gula darah dari data sebelumnya. Periksa kembali apakah Anda mengonsumsi makanan manis berlebih akhir-akhir ini.";
      if (diff < -15) return "Bagus! Gula darah Anda menunjukkan penurunan yang sehat. Pertahankan pola makan saat ini.";
      return "Kadar gula darah Anda stabil dan terkontrol dengan baik. Terus jaga pola hidup sehat Anda.";
    }

    if (selectedMetric === 'hemoglobin') {
      if (latest < 12) return "Hb Anda rendah (Anemia). Anda mungkin merasa mudah lelah atau pusing. Perbanyak makan bayam, hati ayam, atau daging merah.";
      if (latest >= 12 && latest <= 16) return "Hb Anda berada di angka yang sangat ideal. Oksigen dalam darah Anda tersalurkan dengan sempurna ke seluruh tubuh.";
      return "Kadar Hemoglobin Anda normal. Tetap konsumsi nutrisi seimbang untuk menjaga energi Anda.";
    }

    if (selectedMetric === 'cholesterol') {
      if (latest > 200) return "Kolesterol Anda cukup tinggi. Batasi makanan gorengan dan bersantan. Perbanyak konsumsi buah dan sayuran segar.";
      return "Kadar kolesterol Anda terpantau aman. Ini sangat baik untuk kesehatan jantung dan pembuluh darah Anda.";
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "lab_results"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "asc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          date: data.createdAt?.toDate().toLocaleDateString('id-ID', { weekday: 'short' }) || '---',
          val: Number(data[selectedMetric]) || 0
        };
      }).filter(item => item.val > 0);

      setChartData(rawData);

      if (rawData.length > 0) {
        const sum = rawData.reduce((acc, curr) => acc + curr.val, 0);
        const avg = (sum / rawData.length).toFixed(1);
        let trendVal = 0;
        if (rawData.length > 1) {
          const last = rawData[rawData.length - 1].val;
          const prev = rawData[rawData.length - 2].val;
          trendVal = (((last - prev) / prev) * 100).toFixed(1);
        }
        setStats({ avg, trend: trendVal });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedMetric]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500 font-['Plus_Jakarta_Sans'] pb-32 overflow-x-hidden">

      {/* HEADER */}
      <header className="px-8 pt-16 pb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-[#161d28] border border-slate-100 dark:border-[#1e2e40] rounded-2xl text-slate-500 mb-6 shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase mb-1">Health Intel</p>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#1D9E75]">Analytics</h1>
      </header>

      {/* METRIC SELECTOR */}
      <div className="flex px-8 gap-3 overflow-x-auto no-scrollbar pb-6">
        {['glucose', 'hemoglobin', 'cholesterol'].map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMetric(m)}
            className={`px-6 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all border ${selectedMetric === m
                ? 'bg-[#1D9E75] border-[#1D9E75] text-white shadow-lg'
                : 'bg-white dark:bg-[#161d28] border-slate-100 dark:border-[#1e2e40] text-slate-400'
              }`}
          >
            {m}
          </button>
        ))}
      </div>

      <main className="px-6 space-y-6">
        {/* CHART CARD */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#161d28] rounded-[50px] p-8 border border-slate-100 dark:border-[#1e2e40] shadow-xl relative overflow-hidden transition-all duration-500">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-[#1D9E75] mb-2" />
              <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Accessing Database...</p>
            </div>
          ) : chartData.length > 0 ? (
            <>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Level</p>
                  <h2 className="text-4xl font-black italic text-[#1E293B] dark:text-white tracking-tighter">{stats.avg}</h2>
                </div>
                <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 ${Number(stats.trend) <= 0 ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                  <TrendingUp size={14} className={Number(stats.trend) <= 0 ? 'text-green-500' : 'text-red-500'} />
                  <span className={`text-[10px] font-black ${Number(stats.trend) <= 0 ? 'text-green-600' : 'text-red-600'}`}>{stats.trend}%</span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="val" stroke="#1D9E75" strokeWidth={5} dot={{ r: 6, fill: '#1D9E75', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center opacity-30"><Activity size={48} /><p className="text-[10px] font-black uppercase mt-4">No Records Found</p></div>
          )}
        </motion.div>

        {/* --- AI TREND INSIGHT CARD (PENJELASAN UNTUK LANSIA) --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#161d28] rounded-[40px] p-8 border border-slate-100 dark:border-[#1e2e40] shadow-xl relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 opacity-5 dark:opacity-10 rotate-12">
            <Zap size={120} className="text-[#1D9E75]" />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-[#1D9E75]/10 rounded-xl text-[#1D9E75]">
              <Info size={18} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">AI Analysis</h3>
          </div>

          <p className="text-sm font-bold leading-relaxed text-[#1E293B] dark:text-[#f0f6ff]/90 italic relative z-10">
            "{getTrendInsight()}"
          </p>

          <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex justify-between items-center text-center">
            <div className="flex-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kondisi</p>
              <p className={`text-[10px] font-black uppercase mt-1 ${stats.trend > 0 && selectedMetric === 'glucose' ? 'text-red-500' : 'text-[#1D9E75]'}`}>
                {stats.trend > 0 && selectedMetric === 'glucose' ? 'Perlu Dipantau' : 'Stabil'}
              </p>
            </div>
            <div className="w-[1px] h-8 bg-slate-100 dark:bg-white/5"></div>
            <div className="flex-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rekomendasi</p>
              <p className="text-[10px] font-black text-[#1E293B] dark:text-white uppercase mt-1">Pola Makan Sehat</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function GridItem({ icon, label, value, color = "text-[#1D9E75]" }) {
  return (
    <div className="bg-white dark:bg-[#161d28] p-8 rounded-[40px] border border-slate-100 dark:border-[#1e2e40] flex flex-col items-center text-center">
      <div className={`w-12 h-12 bg-slate-50 dark:bg-[#0d1117] rounded-2xl flex items-center justify-center ${color} mb-4`}>{icon}</div>
      <p className="text-[9px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.3em] mb-1">{label}</p>
      <p className="text-3xl font-black italic tracking-tighter">{value}</p>
    </div>
  );
}