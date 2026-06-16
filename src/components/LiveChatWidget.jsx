import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, X, Send, User, Mail, ShieldAlert, CircleDot } from 'lucide-react';
import { getChats, getChatUsers, sendMessage } from '../api/chatApi'; 

export default function LiveChatWidget() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const [chatIdentity, setChatIdentity] = useState({ name: '', email: '' });
  const [isIdentified, setIsIdentified] = useState(false);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatUsers, setChatUsers] = useState([]); 
  const [activeChatUser, setActiveChatUser] = useState(null); 
  const [activeChatUserData, setActiveChatUserData] = useState(null); 

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setChatIdentity({
        name: user.full_name || user.name || '',
        email: user.email || ''
      });
      if (user.full_name && user.email) {
        setIsIdentified(true);
      }
    }
  }, [user]);

  useEffect(() => {
    const handleTriggerChat = (e) => {
      setIsOpen(true);
      if (e.detail?.targetUser) {
        setActiveChatUser(e.detail.targetUser);
      }
    };
    window.addEventListener('trigger-mbur-chat', handleTriggerChat);
    return () => window.removeEventListener('trigger-mbur-chat', handleTriggerChat);
  }, []);

  const fetchChatUsers = async () => {
    if (user?.role !== 'admin' || !token) return;
    try {
      const res = await getChatUsers();
      setChatUsers(res.data || []);
    } catch (err) {
      console.error("Gagal memuat daftar user chat:", err);
    }
  };

  const fetchMessages = async () => {
    if (!token || !isOpen) return;
    try {
      // Menyelaraskan target_user_id agar dibaca sempurna oleh backend
      const queryParams = user?.role === 'admin' && activeChatUser 
        ? { target_user_id: activeChatUser } 
        : {};

      const res = await getChats(queryParams);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Gagal sinkronisasi isi chat:", err);
    }
  };

  useEffect(() => {
    if (!token || !isOpen) return;

    fetchMessages();
    if (user?.role === 'admin') fetchChatUsers();

    const interval = setInterval(() => {
      fetchMessages();
      if (user?.role === 'admin') fetchChatUsers();
    }, 2000);

    return () => clearInterval(interval);
  }, [token, isOpen, activeChatUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartChat = (e) => {
    e.preventDefault();
    if (!chatIdentity.name.trim() || !chatIdentity.email.trim()) return;
    setIsIdentified(true);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    try {
      const payload = { 
        message: inputMessage.trim(), 
        client_name: chatIdentity.name,
        client_email: chatIdentity.email,
        target_user_id: user?.role === 'admin' ? activeChatUser : null 
      };

      setInputMessage('');
      await sendMessage(payload); 
      fetchMessages();
    } catch (err) {
      console.error("Gagal kirim pesan bos:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!token) return null;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {!isOpen && (
        <button
          id="live-chat-trigger-btn"
          onClick={() => setIsOpen(true)}
          className="p-4 bg-orange-500 hover:bg-orange-400 text-white rounded-full shadow-2xl transition-all flex items-center justify-center transform hover:scale-105 active:scale-95 duration-200"
        >
          <div className="relative">
            <MessageSquare size={24} />
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>
        </button>
      )}

      {isOpen && (
        <div className={`bg-white border border-gray-200 rounded-2xl shadow-2xl flex overflow-hidden animate-in slide-in-from-bottom-5 duration-300 h-[500px] ${
          isAdmin ? 'w-[750px]' : 'w-[360px]'
        }`}>
          
          {isAdmin && (
            <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h4 className="text-xs font-black tracking-widest text-gray-500 uppercase">Antrean Konsultasi</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Pilih user untuk balas chat</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
                {chatUsers.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-xs">Belum ada user chat bos.</div>
                ) : (
                  chatUsers.map((u, idx) => {
                    const isSelected = activeChatUser === u.id;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveChatUser(u.id);
                          setActiveChatUserData({
                            name: u.full_name,
                            email: u.email
                          });
                        }}
                        className={`w-full text-left p-3 flex flex-col gap-0.5 transition-all duration-150 ${
                          isSelected ? 'bg-orange-50 border-l-4 border-orange-500' : 'hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-xs font-bold text-gray-600 line-clamp-1">
                          {u.full_name}
                        </span>
                        <span className="text-[10px] text-gray-400 line-clamp-1 italic font-mono">
                          {u.email}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col bg-gray-50">
            
            <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CircleDot size={10} className="text-orange-500 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-xs font-black tracking-wider text-gray-900 uppercase">
                    {isAdmin 
                      ? (activeChatUserData ? `Chat: ${activeChatUserData.name}` : "Pilih Room") 
                      : "Konsultasi Spesifikasi Admin"
                    }
                  </span>
                  {isAdmin && activeChatUserData && (
                    <span className="text-[9px] text-gray-500 font-mono tracking-tight lowercase">
                      {activeChatUserData.email}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-500 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100"
                title="Tutup Chat"
              >
                <X size={16} />
              </button>
            </div>

            {!isAdmin && !isIdentified ? (
              
              <form onSubmit={handleStartChat} className="flex-1 p-6 flex flex-col justify-center gap-4 bg-gray-50">
                <div className="text-center mb-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-2 text-orange-500">
                    <User size={20} />
                  </div>
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Yuk Kenalan Dulu Boskuh!</h3>
                  <p className="text-[10px] text-gray-400 mt-1">Biar admin gampang cek status saldo & pinjaman lu</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Panggilan</label>
                    <div className="relative">
                      <User size={12} className="absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={chatIdentity.name}
                        onChange={(e) => setChatIdentity({...chatIdentity, name: e.target.value})}
                        placeholder="Contoh: Fadllan Rizky"
                        className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Alamat Akun Gmail</label>
                    <div className="relative">
                      <Mail size={12} className="absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={chatIdentity.email}
                        onChange={(e) => setChatIdentity({...chatIdentity, email: e.target.value})}
                        placeholder="username@gmail.com"
                        className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 mt-2 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-orange-200"
                >
                  Mulai Konsultasi Bisnis Bos!
                </button>
              </form>

            ) : (

              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
                  {isAdmin && !activeChatUser ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                      <ShieldAlert size={32} className="mb-2 text-gray-300" />
                      <p className="text-xs font-bold">Belum ada room yang dipilih</p>
                      <p className="text-[10px] text-gray-500 mt-1">Silakan klik salah satu nama user di sidebar kiri untuk membalas obrolan bos.</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-[11px] text-gray-400 pt-16 font-medium">Belum ada percakapan masuk bos.</p>
                  ) : (
                    messages.map((msg, i) => {
                      // 🔥 VALIDASI AKURAT: Menentukan balon chat kanan/kiri berdasarkan peran pengirim
                      const isMe = msg.sender_role === user?.role;
                      return (
                        <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[8px] text-gray-500 mb-0.5 font-bold uppercase tracking-widest">
                            {isMe ? 'Anda' : (msg.sender_role === 'admin' ? 'Admin' : 'Customer')}
                          </span>
                          <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs font-medium leading-relaxed shadow-md ${
                            isMe 
                              ? 'bg-orange-500 text-white rounded-tr-none' 
                              : 'bg-white text-gray-600 border border-gray-200 rounded-tl-none'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isAdmin && !activeChatUser}
                    placeholder={isAdmin && !activeChatUser ? "Pilih user dulu bos..." : "Ketik balasan konsultasi bos..."}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 text-gray-900 disabled:opacity-40 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={isAdmin && !activeChatUser}
                    className="p-2 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl transition-colors shrink-0 flex items-center justify-center"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      )}

    </div>
  );
}