"use client"
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Trash2, Rocket, Youtube, Search, Loader2 } from 'lucide-react';

const supabase = createClient(
  'https://lzmroxzxzhrtcidikhrk.supabase.co', 
  'sb_publishable_scuopVknpzL9SKal3e9q_A_UyRb7ZXX'
);

const YT_API_KEY = 'AIzaSyARPwF3b2gpJek1EE4Crsjn2Xk_gKBOHik'; // MASUKIN DISINI BRE!

export default function KitaSpaceV4() {
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

    const channel = supabase.channel('room1')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchMessages)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'nobar' }, (payload) => {
        setCurrentYt(extractVideoId(payload.new.youtube_url));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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
    } catch (err) { alert("Search Error!"); }
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
    await supabase.from('messages').insert([{ content: newMessage }]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* Search Header */}
      <div className="p-3 bg-zinc-900 border-b border-zinc-800">
        <form onSubmit={searchYoutube} className="flex gap-2 max-w-2xl mx-auto relative">
          <input 
            className="flex-1 bg-zinc-800 border-none rounded-full px-4 py-2 text-sm focus:ring-2 ring-blue-500"
            placeholder="Cari video..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="bg-blue-600 p-2 rounded-full">{loading ? <Loader2 className="animate-spin w-5" /> : <Search size={20} />}</button>
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-xl overflow-hidden shadow-2xl z-50 border border-zinc-800">
              {searchResults.map((v) => (
                <div key={v.id.videoId} onClick={() => playVideo(v.id.videoId)} className="flex items-center gap-3 p-2 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800 last:border-0">
                  <img src={v.snippet.thumbnails.default.url} className="w-16 rounded" />
                  <p className="text-xs line-clamp-2">{v.snippet.title}</p>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left: Video */}
        <div className="w-full md:w-2/3 flex flex-col border-r border-zinc-800">
          <div className="w-full aspect-video">
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${currentYt}?autoplay=1`} allow="autoplay" allowFullScreen></iframe>
          </div>
          <div className="hidden md:flex p-4 items-center gap-3">
             <Rocket className="text-blue-500" /> <span className="font-bold text-xl">KITA.SPACE</span>
          </div>
        </div>

        {/* Right: Chat */}
        <div className="flex flex-col flex-1 bg-zinc-950">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="bg-zinc-900 p-3 rounded-2xl rounded-tl-none border border-zinc-800 w-fit max-w-[85%]">
                <p className="text-[10px] text-blue-400 font-bold mb-1 uppercase">Anon</p>
                <p className="text-sm">{m.content}</p>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={sendChat} className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
            <input className="flex-1 bg-zinc-800 rounded-xl px-4 py-2 text-sm outline-none" placeholder="Tulis pesan..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
            <button className="bg-blue-600 p-2 rounded-xl"><Send size={18} /></button>
          </form>
        </div>
      </div>
    </div>
  );
                          }
