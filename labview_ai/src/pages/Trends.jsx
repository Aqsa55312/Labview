import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

export default function Trends() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, "lab_results"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("createdAt", "asc")
        );
        const querySnapshot = await getDocs(q);
        const rawData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            date: data.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            glucose: Number(data.glucose) || 0,
            hemoglobin: Number(data.hemoglobin) || 0,
          };
        });
        setChartData(rawData);
      } catch (error) {
        console.error("Error fetching trends:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white font-black text-[#48A878] tracking-widest animate-pulse uppercase text-[10px]">
      Loading Data Points...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans pb-32">
      
      {/* HEADER */}
      <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-50 sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-all">
          <span className="text-slate-400 font-bold">←</span>
        </button>
        <h1 className="text-[11px] font-black uppercase tracking-[0.3em] italic text-[#0A1D37]">Biometric Trends</h1>
        <div className="w-10"></div>
      </header>

      <main className="max-w-5xl mx-auto p-6 lg:p-12 space-y-10">
        
        {/* SUMMARY CARD */}
        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Total Records Found</p>
            <h2 className="text-5xl font-black text-[#0A1D37] tracking-tighter italic">
              {chartData.length} <small className="text-sm text-slate-400 font-bold uppercase tracking-normal not-italic">Scans</small>
            </h2>
          </div>
          <div className="bg-[#E8F5EE] px-8 py-4 rounded-[25px] border border-[#D1E9DB]">
            <p className="text-[10px] text-[#2D6A4F] font-black uppercase tracking-widest italic leading-relaxed">
              {chartData.length < 2 
                ? "Insufficient data for trend mapping" 
                : "Real-time health trajectory mapped"}
            </p>
          </div>
        </div>

        {/* GLUCOSE AREA CHART */}
        <div className="bg-white rounded-[50px] p-10 shadow-sm border border-slate-50 space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-8 bg-[#3498DB] rounded-full"></div>
            <h3 className="font-black text-[#0A1D37] text-sm uppercase italic tracking-widest">Glucose Analytics</h3>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGlu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3498DB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3498DB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: '900', fill: '#CBD5E1'}} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: '900', fill: '#CBD5E1'}} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '25px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                  itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="glucose" 
                  stroke="#3498DB" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorGlu)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HEMOGLOBIN AREA CHART */}
        <div className="bg-white rounded-[50px] p-10 shadow-sm border border-slate-50 space-y-8 animate-in fade-in zoom-in duration-1000">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-8 bg-[#48A878] rounded-full"></div>
            <h3 className="font-black text-[#0A1D37] text-sm uppercase italic tracking-widest">Hemoglobin Levels</h3>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#48A878" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#48A878" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: '900', fill: '#CBD5E1'}} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: '900', fill: '#CBD5E1'}} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '25px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                  itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="hemoglobin" 
                  stroke="#48A878" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorHb)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-50 p-6 flex justify-around items-center z-[100]">
        <div onClick={() => navigate('/dashboard')} className="flex flex-col items-center opacity-30 cursor-pointer">
          <span className="text-xl">🏠</span>
          <span className="text-[8px] font-black uppercase mt-1">Home</span>
        </div>
        <div onClick={() => navigate('/scan')} className="flex flex-col items-center opacity-30 cursor-pointer">
          <span className="text-xl">📄</span>
          <span className="text-[8px] font-black uppercase mt-1">Scan</span>
        </div>
        <div className="flex flex-col items-center text-[#48A878] cursor-pointer">
          <span className="text-xl">📊</span>
          <span className="text-[8px] font-black uppercase mt-1">Trends</span>
        </div>
        <div onClick={() => navigate('/profile')} className="flex flex-col items-center opacity-30 cursor-pointer">
          <span className="text-xl">👤</span>
          <span className="text-[8px] font-black uppercase mt-1">Profile</span>
        </div>
      </nav>
    </div>
  );
}