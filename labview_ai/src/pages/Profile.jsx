import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // setDoc sudah ditambahkan di sini
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const [fullName, setFullName] = useState('');
    const [blood, setBlood] = useState('-');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                try {
                    const docRef = doc(db, "users", auth.currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setFullName(data.fullName || '');
                        setBlood(data.blood || '-');
                        setHeight(data.height || '');
                        setWeight(data.weight || '');
                        setPhone(data.phone || '');
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/login');
            }
        };
        fetchUserData();
    }, [navigate]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            if (!auth.currentUser) return;

            const userRef = doc(db, "users", auth.currentUser.uid);

            // Menggunakan setDoc dengan { merge: true } agar lebih stabil
            await setDoc(userRef, {
                fullName: fullName,
                blood: blood,
                height: height,
                weight: weight,
                phone: phone,
                updatedAt: new Date()
            }, { merge: true });

            alert("Profil berhasil diperbarui!");
        } catch (error) {
            console.error("Error detail:", error);
            alert("Gagal memperbarui profil: " + error.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white font-sans text-[#48A878] font-black italic">
            SYNCHRONIZING PROFILE...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans pb-20">

            {/* HEADER SECTION */}
            <div className="bg-gradient-to-br from-[#48A878] to-[#3a8d63] rounded-b-[60px] px-8 pt-16 pb-40 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
                    <button onClick={() => navigate('/dashboard')} className="absolute left-0 top-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/30 transition-all">←</button>

                    <div className="relative w-32 h-32 mx-auto">
                        <div className="w-full h-full bg-white rounded-[40px] shadow-2xl flex items-center justify-center border-4 border-white/50 overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=${fullName || 'U'}&background=fff&color=48A878&bold=true`} alt="p" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#48A878] border-4 border-white rounded-full flex items-center justify-center text-white text-xs shadow-lg font-bold">✓</div>
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{fullName || "USER LABVIEW"}</h2>
                        <p className="text-green-100 text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 italic">Medical ID: {auth.currentUser.uid.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>
            </div>

            {/* FORM SECTION */}
            <div className="px-8 -mt-24 relative z-20 max-w-4xl mx-auto">
                <form onSubmit={handleUpdate} className="bg-white rounded-[55px] p-10 sm:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-50 space-y-10">

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-[#F8FAFC] border border-slate-100 rounded-3xl py-5 px-8 text-sm font-bold text-[#0A1D37] focus:outline-none focus:border-[#48A878] transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Blood Type</label>
                            <select
                                value={blood}
                                onChange={(e) => setBlood(e.target.value)}
                                className="w-full bg-[#F8FAFB] border border-slate-100 rounded-3xl py-5 px-8 text-sm font-bold text-[#0A1D37] focus:outline-none focus:border-[#48A878] appearance-none"
                            >
                                <option value="-">-</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="AB">AB</option>
                                <option value="O">O</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Height (cm)</label>
                            <input
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                className="w-full bg-[#F8FAFB] border border-slate-100 rounded-3xl py-5 px-8 text-sm font-bold text-[#0A1D37] focus:outline-none focus:border-[#48A878]"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Weight (kg)</label>
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full bg-[#F8FAFB] border border-slate-100 rounded-3xl py-5 px-8 text-sm font-bold text-[#0A1D37] focus:outline-none focus:border-[#48A878]"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Phone Number</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-[#F8FAFC] border border-slate-100 rounded-3xl py-5 px-8 text-sm font-bold text-[#0A1D37] focus:outline-none focus:border-[#48A878]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={updating}
                        className="w-full bg-[#0A1D37] text-white py-6 rounded-[35px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all"
                    >
                        {updating ? "SYNCHRONIZING..." : "SAVE CHANGES"}
                    </button>
                </form>
            </div>
        </div>
    );
}