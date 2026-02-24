"use client"
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Trash2, Rocket, Youtube, Search, Loader2 } from 'lucide-react';

// KONFIGURASI SUPABASE (Sudah Hardcode sesuai milikmu)
const supabaseUrl = 'https://lzmroxzxzhrtcidikhrk.supabase.co';
const supabaseAnonKey = 'sb_publishable_scuopVknpzL9SKal3e9q_A_UyRb7ZXX';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GANTI INI PAKE API KEY DARI GOOGLE CLOUD CONSOLE
const YT_API_KEY = 'AQ.Ab8RN6J8eRhOjjCxPAIcCt5OgHNy9zazz8v27UOCHRJmfadz5A'; 

export default function KitaSpaceV3() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentYt, setCurrentYt] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchNobar();

    // Subscribe Realtime Chat & Nobar
    const channel = supabase.channel('room1')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchMessages)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'nobar' }, (payload) => {
        const videoId = extractVideoId(payload.new.youtube_url);
        setCurrentYt(videoId);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Auto-scroll chat ke paling bawah
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const fetchNobar = async () => {
    const { data } = await supabase.from('nobar').select('youtube_url').eq('id', 1).single();
    if (data) setCurrentYt(extractVideoId(data.youtube_url));
  };

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const searchYoutube = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${searchQuery}&type=video&key=${YT_API_KEY}`);
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch (err) {
      alert("API YouTube Bermasalah, Bre! Cek Key-nya.");
    }
    setLoading(false);
  };

  const playVideo = async (videoId) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    await supabase.from('nobar').update({ youtube_url: url }).eq('id', 1);
    setSearchResults([]);
    setSearchQuery('');
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await supabase.from('messages').insert([{ content: newMessage, sender: 'Anon' }]);
    setNewMessage('');
  };

  const deleteMessage = async (id) => {
    await supabase.from('messages').delete().eq('id', id);
    fetchMessages();
  };

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-100 overflow-hidden">
      {/* HEADER: Search Bar */}
      <div className="p-3 bg-zinc-900 border-b border-zinc-800 z-30">
        <form onSubmit={searchYoutube} className="flex gap-2 max-w-4xl mx-auto">
          <input 
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 ring-blue-500 transition-all"
            placeholder="Cari lagu atau video nobar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition active:scale-95">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search size={20} />}
          </button>
        </form>

        {/* Dropdown Hasil Search */}
        {searchResults.length > 0 && (
          <div className="absolute left-4 right-4 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-40 max-w-xl mx-auto">
            {searchResults.map((video) => (
              <div 
                key={video.id.videoId} 
                onClick={() => playVideo(video.id.videoId)}
                className="flex items-center gap-3 p-3 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800 last:border-0"
              >
                <img src={video.snippet.thumbnails.default.url} className="w-16 rounded-lg" alt="thumb" />
                <p className="text-xs font-medium line-clamp-2">{video.snippet.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAIN CONTENT: Split Screen on Desktop, Stack on Mobile */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* PLAYER SECTION */}
        <div className="w-full md:w-2/3 bg-black flex flex-col border-r border-zinc-800">
          <div className="w-full aspect-video bg-black shadow-lg">
            {currentYt ? (
              <iframe 
                className="w-full h-full" 
                src={`https://www.youtube.com/embed/${currentYt}?autoplay=1`} 
                allow="autoplay; encrypted-media" 
                allowFullScreen
              ></iframe>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-700">
                <Youtube size={64} className="mb-4 opacity-10" />
                <p className="text-sm italic">Cari video di atas untuk mulai nobar...</p>
              </div>
            )}
          </div>
          
          {/* Logo & Info (Visible on Desktop) */}
          <div className="hidden md:flex p-6 items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/20">
              <Rocket size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">KITA.SPACE</h2>
              <p className="text-xs text-zinc-500">Streaming Room & Realtime Chat</p>
            </div>
          </div>
        </div>

        {/* CHAT SECTION */}
        <div className="flex flex-col flex-1 bg-zinc-950 md:w-1/3 h-full">
          {/* List Chat */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            {messages.map((msg) => (
              <div key={msg.id} className="flex justify-between items-start group">
                <div className="bg-zinc-900 px-4 py-2 rounded-2xl rounded-tl-none border border-zinc-800 max-w-[90%] shadow-sm">
                  <p className="text-[10px] text-blue-400 font-black mb-1 uppercase tracking-widest">User_{msg.id.toString().slice(-3)}</p>
                  <p className="text-sm text-zinc-200 leading-relaxed">{msg.content}</p>
                </div>
                <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-700 hover:text-red-500 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          {/* Form Input Chat */}
          <form onSubmit={sendChat} className="p-4 bg-zinc-900/50 border-t border-zinc-800 flex gap-2 backdrop-blur-sm">
            <input 
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 transition-all"
              placeholder="Tulis pesan..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 p-2 rounded-xl hover:bg-blue-700 transition active:scale-90 shadow-lg shadow-blue-900/40">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
    }
    
