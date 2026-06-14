import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp, Activity, Heart, Loader2, Zap, Info, LayoutGrid, History as HistoryIcon, ScanLine, User } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../LanguageContext';

export default function Trends() {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState('glucose');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, trend: 0, min: 0, max: 0 });
  const { t } = useLanguage();

  const getUnit = (metric) => {
    if (metric === 'hemoglobin') return 'g/dL';
    return 'mg/dL';
  };

  const getLatestStatus = (val, metric) => {
    if (metric === 'glucose') {
      if (val > 200) return t('highest');
      if (val > 140) return t('attention');
      return t('normal');
    }
    if (metric === 'hemoglobin') {
      if (val < 8) return t('lowest');
      if (val < 12) return t('attention');
      if (val > 18) return t('highest');
      return t('optimal');
    }
    if (metric === 'cholesterol') {
      if (val > 240) return t('highest');
      if (val > 200) return t('attention');
      return t('normal');
    }
    return t('normal');
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-[#161d28]/95 backdrop-blur-md border border-slate-100 dark:border-[#1e2e40] p-4 rounded-3xl shadow-2xl">
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{payload[0].payload.date}</p>
          <p className="text-sm font-black text-[#1D9E75]">
            {payload[0].value} <span className="text-[10px] text-slate-500 dark:text-[#4a6080] font-bold">{getUnit(selectedMetric)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // --- LOGIKA PENJELASAN TREN (UNTUK LANSIA) ---
  const getTrendInsight = () => {
    if (chartData.length < 2) return t('trend_ins_insufficient');

    const latest = chartData[chartData.length - 1].val;
    const previous = chartData[chartData.length - 2].val;
    const diff = latest - previous;

    if (selectedMetric === 'glucose') {
      if (latest > 140) return t('trend_ins_glucose_high');
      if (diff > 15) return t('trend_ins_glucose_up');
      if (diff < -15) return t('trend_ins_glucose_down');
      return t('trend_ins_glucose_stable');
    }

    if (selectedMetric === 'hemoglobin') {
      if (latest < 12) return t('trend_ins_hb_low');
      if (latest >= 12 && latest <= 16) return t('trend_ins_hb_ideal');
      return t('trend_ins_hb_normal');
    }

    if (selectedMetric === 'cholesterol') {
      if (latest > 200) return t('trend_ins_chol_high');
      return t('trend_ins_chol_normal');
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "lab_results"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          createdAtDate: data.createdAt?.toDate() || new Date(0),
          date: data.createdAt?.toDate().toLocaleDateString('id-ID', { weekday: 'short' }) || '---',
          val: Number(data[selectedMetric]) || 0
        };
      }).filter(item => item.val > 0);

      // Sort chronological ascending in JS for the line/area chart
      rawData.sort((a, b) => a.createdAtDate - b.createdAtDate);

      // Keep only the last 30 scans
      const limitedData = rawData.slice(-30);

      setChartData(limitedData);

      if (limitedData.length > 0) {
        const sum = limitedData.reduce((acc, curr) => acc + curr.val, 0);
        const avg = (sum / limitedData.length).toFixed(1);
        const values = limitedData.map(item => item.val);
        const min = Math.min(...values);
        const max = Math.max(...values);

        let trendVal = 0;
        if (limitedData.length > 1) {
          const last = limitedData[limitedData.length - 1].val;
          const prev = limitedData[limitedData.length - 2].val;
          trendVal = (((last - prev) / prev) * 100).toFixed(1);
        }
        setStats({ avg, trend: trendVal, min, max });
      } else {
        setStats({ avg: 0, trend: 0, min: 0, max: 0 });
      }
      setLoading(false);
    }, (error) => {
      console.error("Trends query error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedMetric]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500 font-['Plus_Jakarta_Sans'] pb-40 overflow-x-hidden">

      {/* HEADER */}
      <header className="px-8 pt-16 pb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-[#161d28] border border-slate-100 dark:border-[#1e2e40] rounded-2xl text-slate-500 mb-6 shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <p className="text-[10px] font-black text-slate-500 dark:text-[#4a6080] tracking-[0.4em] uppercase mb-1">{t('health_intel')}</p>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#1D9E75]">{t('analytics')}</h1>
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
            {m === 'glucose' ? t('blood_sugar') : m === 'hemoglobin' ? 'Hemoglobin' : 'Cholesterol'}
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
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('average_level')}</p>
                  <h2 className="text-4xl font-black italic text-[#1E293B] dark:text-white tracking-tighter">{stats.avg}</h2>
                </div>
                <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 ${Number(stats.trend) <= 0 ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                  <TrendingUp size={14} className={Number(stats.trend) <= 0 ? 'text-green-500' : 'text-red-500'} />
                  <span className={`text-[10px] font-black ${Number(stats.trend) <= 0 ? 'text-green-600' : 'text-red-600'}`}>{stats.trend}%</span>
                </div>
              </div>

              <div className="h-64 w-full pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1D9E75" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} strokeOpacity={0.15} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 800, fill: '#64748B' }} 
                      dy={10} 
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 800, fill: '#64748B' }} 
                      width={30}
                    />
                    {selectedMetric === 'glucose' && <ReferenceArea y1={70} y2={140} fill="#1D9E75" fillOpacity={0.06} />}
                    {selectedMetric === 'hemoglobin' && <ReferenceArea y1={12} y2={16} fill="#1D9E75" fillOpacity={0.06} />}
                    {selectedMetric === 'cholesterol' && <ReferenceArea y1={0} y2={200} fill="#1D9E75" fillOpacity={0.06} />}
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="val" 
                      stroke="#1D9E75" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorMetric)" 
                      dot={{ r: 5, fill: '#1D9E75', strokeWidth: 2, stroke: '#fff' }} 
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#1D9E75' }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center opacity-30"><Activity size={48} /><p className="text-[10px] font-black uppercase mt-4">No Records Found</p></div>
          )}
        </motion.div>

        {/* STATISTICS GRID */}
        {!loading && chartData.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <GridItem 
              icon={<Heart size={18} />} 
              label={t('highest')} 
              value={`${stats.max} ${getUnit(selectedMetric)}`} 
              color="text-rose-500" 
            />
            <GridItem 
              icon={<Activity size={18} />} 
              label={t('lowest')} 
              value={`${stats.min} ${getUnit(selectedMetric)}`} 
              color="text-emerald-500" 
            />
            <GridItem 
              icon={<TrendingUp size={18} />} 
              label={t('total_records')} 
              value={`${chartData.length}x`} 
              color="text-[#1D9E75]" 
            />
            <GridItem 
              icon={<Info size={18} />} 
              label={t('last_status')} 
              value={getLatestStatus(chartData[chartData.length - 1].val, selectedMetric)} 
              color="text-blue-500" 
            />
          </div>
        )}

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
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('ai_analysis')}</h3>
          </div>

          <p className="text-sm font-bold leading-relaxed text-[#1E293B] dark:text-[#f0f6ff]/90 italic relative z-10">
            "{getTrendInsight()}"
          </p>

          <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex justify-between items-center text-center">
            <div className="flex-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('condition_label')}</p>
              <p className={`text-[10px] font-black uppercase mt-1 ${stats.trend > 0 && selectedMetric === 'glucose' ? 'text-red-500' : 'text-[#1D9E75]'}`}>
                {stats.trend > 0 && selectedMetric === 'glucose' ? t('needs_monitoring_trend') : t('stable')}
              </p>
            </div>
            <div className="w-[1px] h-8 bg-slate-100 dark:bg-white/5"></div>
            <div className="flex-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('recommendation_label')}</p>
              <p className="text-[10px] font-black text-[#1E293B] dark:text-white uppercase mt-1">{t('healthy_diet')}</p>
            </div>
          </div>
        </motion.div>

        {/* BOTTOM NAVIGATION */}
        <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 z-50 pointer-events-none">
          <nav className="max-w-md mx-auto bg-white/90 dark:bg-[#161d28]/90 backdrop-blur-xl border border-slate-200 dark:border-[#1e2e40] rounded-[35px] h-[85px] flex justify-between items-center px-6 shadow-2xl pointer-events-auto">
            <NavIcon icon={<LayoutGrid size={22} />} onClick={() => navigate('/dashboard')} label={t('nav_home')} />
            <NavIcon icon={<HistoryIcon size={22} />} onClick={() => navigate('/history')} label={t('nav_history')} />
            <div className="relative -mt-16">
              <button onClick={() => navigate('/scan')} className="w-20 h-20 bg-[#1D9E75] rounded-[30px] flex items-center justify-center text-white shadow-2xl border-[6px] border-[#F8FAFC] dark:border-[#0d1117] active:scale-90 transition-all hover:scale-105">
                <ScanLine size={30} />
              </button>
            </div>
            <NavIcon icon={<ActivityIcon />} active label={t('nav_trends')} />
            <NavIcon icon={<User size={22} />} onClick={() => navigate('/profile')} label={t('nav_profile')} />
          </nav>
        </div>
      </main>
    </div>
  );
}

function GridItem({ icon, label, value, color = "text-[#1D9E75]" }) {
  return (
    <div className="bg-white dark:bg-[#161d28] p-6 rounded-[35px] border border-slate-100 dark:border-[#1e2e40] flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
      <div className={`w-10 h-10 bg-slate-50 dark:bg-[#0d1117] rounded-xl flex items-center justify-center ${color} mb-3`}>{icon}</div>
      <p className="text-[9px] font-black text-slate-500 dark:text-[#4a6080] uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-black italic tracking-tighter text-[#1E293B] dark:text-white">{value}</p>
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