"use client"
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIG SUPABASE ---
const SUPABASE_URL = 'NEXT_PUBLIC_SUPABASE_URL_LU';
const SUPABASE_KEY = 'NEXT_PUBLIC_SUPABASE_ANON_KEY_LU';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function PrivateCinemaChat() {
  // --- STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myUsername, setMyUsername] = useState("");
  const [inputPass, setInputPass] = useState("");
  const [videos, setVideos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const chatEndRef = useRef(null);
  const SECRET_PASSWORD = "140725"; // Ganti password di sini

  // --- PERSISTENCE & REALTIME ---
  useEffect(() => {
    const session = localStorage.getItem("isAllowed");
    const savedName = localStorage.getItem("myName");
    if (session === "true") {
      setIsLoggedIn(true);
      setMyUsername(savedName || "Stranger");
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const channel = supabase
        .channel('room-chat')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchData = async () => {
    const { data: vids } = await supabase.from('video_list').select('*').order('created_at', { ascending: false });
    const { data: msgs } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(50);
    setVideos(vids || []);
    setMessages(msgs || []);
  };

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPass === SECRET_PASSWORD) {
      const name = prompt("Masukan Nama Lu (buat di chat):") || "User";
      setMyUsername(name);
      setIsLoggedIn(true);
      localStorage.setItem("isAllowed", "true");
      localStorage.setItem("myName", name);
    } else { alert("Salah Kode, Bre!"); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) return alert("Kegedean! Maks 100MB.");

    setUploading(true);
    setProgress(0);
    const fileName = `${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage.from('videos').upload(fileName, file, {
      onUploadProgress: (evt) => setProgress(Math.round((evt.loaded / evt.total) * 100))
    });

    if (data) {
      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);
      await supabase.from('video_list').insert([{ title: file.name, video_url: urlData.publicUrl }]);
      fetchData();
    }
    setUploading(false);
    setProgress(0);
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await supabase.from('messages').insert([{ username: myUsername, text: chatInput }]);
    setChatInput("");
  };

  // --- VIEW: LOGIN ---
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-800 text-center">
          <h2 className="text-3xl font-black text-white mb-6">🔒 PRIVATE SPACE</h2>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Masukan Password..." className="w-full p-4 rounded-xl bg-slate-800 text-white mb-4 border border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" 
              value={inputPass} onChange={(e) => setInputPass(e.target.value)} />
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all">MASUK</button>
          </form>
        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD ---
  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* HEADER */}
      <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <h1 className="font-black text-xl tracking-tighter text-blue-500">KITA.SPACE</h1>
        <button onClick={() => {localStorage.clear(); window.location.reload();}} className="text-xs font-bold text-red-500">LOGOUT</button>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* KIRI: VIDEO FEED */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar">
          {/* Box Upload */}
          <div className="p-6 bg-slate-900 border-2 border-dashed border-slate-700 rounded-3xl text-center">
            <input type="file" accept="video/*" onChange={handleUpload} id="up" className="hidden" disabled={uploading} />
            <label htmlFor="up" className="cursor-pointer block">
              <span className="text-3xl block mb-2">🎬</span>
              <p className="text-slate-400 font-medium text-sm">{uploading ? `Lagi Upload: ${progress}%` : "Klik buat share video baru (Maks 100MB)"}</p>
              {uploading && <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{width: `${progress}%`}}></div></div>}
            </label>
          </div>

          {/* Videos */}
          {videos.map((vid) => (
            <div key={vid.id} className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-lg">
              <video src={vid.video_url} controls className="w-full aspect-video" />
              <div className="p-4 font-bold text-slate-200">{vid.title}</div>
            </div>
          ))}
        </div>

        {/* KANAN: CHAT SIDEBAR */}
        <div className="w-full md:w-96 flex flex-col border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950">
          <div className="p-4 border-b border-slate-800 text-xs font-black uppercase tracking-widest text-slate-500">Live Chat Area</div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.username === myUsername ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-slate-500 mb-1 uppercase tracking-tighter font-bold">{m.username}</span>
                <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${m.username === myUsername ? 'bg-blue-600 rounded-tr-none' : 'bg-slate-800 rounded-tl-none border border-slate-700'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendChat} className="p-4 bg-slate-900 flex gap-2">
            <input type="text" className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-500" 
              placeholder="Tulis pesan..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
            <button className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-500 transition shadow-lg">🚀</button>
          </form>
        </div>
      </div>
    </div>
  );
      }
