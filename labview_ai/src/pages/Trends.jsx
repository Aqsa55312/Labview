import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp, Activity, Heart, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function Trends() {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState('glucose'); // default ke glucose
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, trend: 0 });

  useEffect(() => {
    if (!auth.currentUser) return;

    // Ambil 10 data terakhir milik user untuk grafik tren mingguan
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
          date: data.createdAt?.toDate().toLocaleDateString('en-US', { weekday: 'short' }) || '---',
          val: Number(data[selectedMetric]) || 0
        };
      }).filter(item => item.val > 0);

      setChartData(rawData);

      // Hitung rata-rata dan tren sederhana
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500 font-['Plus_Jakarta_Sans'] pb-32">
      {/* HEADER */}
      <header className="px-8 pt-16 pb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-2xl text-slate-500 dark:text-[#4a6080] mb-6 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase mb-1">Analytics</p>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#1D9E75]">Health Trends</h1>
      </header>

      {/* METRIC SELECTOR CHIPS */}
      <div className="flex px-8 gap-3 overflow-x-auto no-scrollbar pb-4">
        {[
          { id: 'glucose', label: 'Glucose' },
          { id: 'hemoglobin', label: 'Hemoglobin' },
          { id: 'cholesterol', label: 'Cholesterol' }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMetric(m.id)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              selectedMetric === m.id 
              ? 'bg-[#1D9E75] border-[#1D9E75] text-white shadow-[0_10px_20px_rgba(29,158,117,0.2)]' 
              : 'bg-[#FFFFFF] dark:bg-[#161d28] border-[#E2E8F0] dark:border-[#1e2e40] text-slate-500 dark:text-[#4a6080]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* CHART SECTION */}
      <main className="px-6 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FFFFFF] dark:bg-[#161d28] rounded-[40px] p-8 border border-[#E2E8F0] dark:border-[#1e2e40] shadow-xl dark:shadow-2xl transition-colors"
        >
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-[#1D9E75] mb-2" />
              <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.3em] uppercase">LOADING DATABASE...</p>
            </div>
          ) : chartData.length > 0 ? (
            <>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.2em] uppercase mb-1">Average {selectedMetric}</p>
                  <h2 className="text-4xl font-black italic tracking-tighter text-[#1E293B] dark:text-[#f0f6ff]">
                    {stats.avg} <span className="text-sm text-slate-500 dark:text-[#4a6080] not-italic font-bold">unit</span>
                  </h2>
                </div>
                <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 ${Number(stats.trend) <= 0 ? 'bg-green-100 dark:bg-green-500/10' : 'bg-red-100 dark:bg-red-500/10'}`}>
                  <TrendingUp strokeWidth={3} size={12} className={Number(stats.trend) <= 0 ? 'text-green-500' : 'text-red-500'} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${Number(stats.trend) <= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                    {stats.trend}%
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="currentColor" className="text-slate-300 dark:text-[#1e2e40]" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="currentColor" className="text-slate-400 dark:text-[#4a6080]" dy={10} />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--tw-colors-white, #FFFFFF)', border: '1px solid var(--tw-colors-slate-200, #E2E8F0)', borderRadius: '15px' }}
                      itemStyle={{ color: '#1D9E75', fontWeight: '900', fontSize: '14px', fontStyle: 'italic' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="val"
                      stroke="#1D9E75"
                      strokeWidth={4}
                      dot={{ fill: '#1D9E75', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8, strokeWidth: 4 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <Activity size={40} className="text-slate-300 dark:text-[#1e2e40] mb-4" />
              <p className="text-sm font-bold text-slate-500 dark:text-[#4a6080]">No record found for this metric.</p>
              <p className="text-[10px] text-slate-400 dark:text-[#4a6080]/50 uppercase tracking-[0.2em] mt-2">Try scanning a document first</p>
            </div>
          )}
        </motion.div>

        {/* DYNAMIC INSIGHTS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 space-y-4"
        >
          <div className="bg-[#FFFFFF] dark:bg-[#161d28] border border-[#E2E8F0] dark:border-[#1e2e40] rounded-[30px] p-6 flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 bg-[#1D9E75]/10 rounded-2xl flex items-center justify-center text-[#1D9E75]">
              <Heart size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.3em]">AI Status</p>
              <p className="text-xs font-bold text-[#1E293B] dark:text-[#f0f6ff] transition-colors leading-relaxed mt-1">
                {chartData.length > 3 ? "Database provides enough data for accurate trends." : "Add more scans for better AI analysis."}
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}