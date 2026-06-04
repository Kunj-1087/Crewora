'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronLeft, Send, Search, CheckCheck, MoreVertical, Image as ImageIcon,
  Smile, User, Phone, MessageSquare
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import apiClient from '@crewora/api-client';

export default function InboxPage() {
  const { user, isInitialized } = useAuthStore();
  const socket = useSocket();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetChatId = searchParams ? searchParams.get('chat') : null;
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login');
    }
  }, [user, isInitialized, router]);

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      const { data } = await apiClient.get('/inbox/conversations');
      setConversations(data.data.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Fetch messages for active chat
  const fetchMessages = async (otherId: string) => {
    try {
      const { data } = await apiClient.get(`/inbox/messages/${otherId}`);
      setMessages(data.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  useEffect(() => {
    if (user && activeChatId) {
      fetchMessages(activeChatId);
      // Mark as read locally
      setConversations((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, unread: false, unreadCount: 0 } : c))
      );
    }
  }, [user, activeChatId]);

  // Setup Socket.io real-time listener
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (msg: any) => {
      const otherId = msg.senderId === user.id ? msg.receiverId : msg.senderId;

      if (activeChatId === otherId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [
            ...prev,
            {
              id: msg.id,
              sender: msg.senderId === user.id ? 'me' : 'other',
              text: msg.content,
              time: msg.createdAt
            }
          ];
        });
      }

      fetchConversations();
    };

    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, user, activeChatId]);

  // Set active chat based on query param
  useEffect(() => {
    if (targetChatId) {
      setActiveChatId(targetChatId);
    }
  }, [targetChatId]);

  // Find active chat details
  const activeChat = conversations.find(c => c.id === activeChatId);

  // Filter conversations list based on query
  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-scroll to bottom of chat pane
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!typedMessage.trim() || !activeChatId || !user || !socket) return;

    const otherConv = conversations.find(c => c.id === activeChatId);
    const otherRole = otherConv?.role === 'Client' ? 'customer' : 'worker';

    const payload = {
      senderId: user.id,
      senderRole: user.role,
      receiverId: activeChatId,
      receiverRole: otherRole,
      content: typedMessage.trim()
    };

    // Emit message to Socket.io server
    socket.emit('sendMessage', payload);
    setTypedMessage('');
  };

  const handleConversationClick = (id: string) => {
    setActiveChatId(id);
    router.replace(`/inbox?chat=${id}`);
  };

  if (!isInitialized || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-[#F8FAFC] relative overflow-hidden h-[calc(100vh-4rem)] md:h-[700px] border-b border-slate-200 select-none">
      
      {/* ─── DESKTOP SPLIT PANEL / MOBILE TOGGLED INTERFACE ─────────────────── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 w-full h-full">
        
        {/* Left Side: Conversation history index (always visible on desktop, toggled on mobile) */}
        <div className={`md:col-span-4 bg-white border-r border-slate-200/80 flex flex-col h-full ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header */}
          <div className="px-5 pt-6 pb-4 bg-white border-b border-slate-100 shrink-0 text-left space-y-1">
            <h1 className="text-xl font-extrabold text-[#0b1528] tracking-tight">Inbox</h1>
            <p className="text-xs text-slate-400 font-semibold mb-4">Chat with your active contract experts</p>
            
            {/* Search conversations */}
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-450">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs text-[#0b1528] placeholder-slate-400 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-accent-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* Conversations list scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
            {loading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading messages...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-16 px-6">
                <MessageSquare size={36} className="text-slate-350 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No chats available</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">Active contracts and booking inquiries will appear here.</p>
              </div>
            ) : (
              filteredConversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleConversationClick(c.id)}
                  className={`p-4 flex gap-3.5 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                    c.unread || c.id === activeChatId ? 'bg-accent-50/20' : ''
                  }`}
                >
                  {(c.unread || c.unreadCount > 0) && (
                    <span className="absolute top-4 left-4 w-2.5 h-2.5 bg-accent-600 rounded-full border-2 border-white"></span>
                  )}

                  {/* Profile Photo */}
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                    <img 
                      src={c.photo || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"} 
                      alt={c.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline gap-1">
                      <h3 className="text-xs font-extrabold text-[#0b1528]">{c.name}</h3>
                      <span className="text-[9px] text-slate-400 font-bold">
                        {new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="block text-[10px] text-slate-400 truncate mt-0.5">{c.role}</span>
                    <p className={`text-[11px] mt-1.5 line-clamp-1 truncate ${
                      c.unread ? 'font-extrabold text-slate-900' : 'text-slate-550'
                    }`}>{c.lastMsg}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Active chat dialogue thread (toggled on mobile, handles active selections) */}
        <div className={`md:col-span-8 bg-slate-50/50 flex flex-col h-full ${activeChatId ? 'flex' : 'hidden md:flex'}`}>
          {activeChatId && activeChat ? (
            <>
              {/* Active Chat Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200/80 h-16 px-6 flex items-center justify-between z-30 shadow-sm shrink-0 select-none">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setActiveChatId(null);
                      router.replace('/inbox'); // Clear query param
                    }} 
                    className="text-slate-800 hover:text-navy p-1 transition-colors md:hidden"
                  >
                    <ChevronLeft size={20} className="stroke-[2.5]" />
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                      <img 
                        src={activeChat.photo || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"} 
                        alt={activeChat.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black text-[#0b1528]">{activeChat.name}</h4>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">{activeChat.role}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-500">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors border-none outline-none">
                    <Phone size={15} />
                  </button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors border-none outline-none">
                    <MoreVertical size={15} />
                  </button>
                </div>
              </div>

              {/* Messages Stream Pane */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {messages.map((m, index) => {
                  const isMe = m.sender === 'me';
                  return (
                    <div 
                      key={m.id || index}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                        isMe 
                          ? 'bg-[#0b1528] text-white rounded-tr-none text-left' 
                          : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-none text-left'
                      }`}>
                        <p>{m.text}</p>
                        <div className={`flex justify-end items-center gap-1 mt-1.5 text-[8px] ${
                          isMe ? 'text-slate-400' : 'text-slate-400'
                        } font-medium`}>
                          <span>{new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <CheckCheck size={10} className="text-accent-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Text Input Panel */}
              <div className="bg-white border-t border-slate-200/80 p-4 flex items-center gap-2.5 z-30 shrink-0">
                <button className="text-slate-400 hover:text-slate-600 p-1.5 border-none outline-none bg-transparent">
                  <ImageIcon size={18} />
                </button>
                <button className="text-slate-400 hover:text-slate-600 p-1.5 border-none outline-none bg-transparent">
                  <Smile size={18} />
                </button>
                
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 bg-slate-50 text-xs text-[#0b1528] placeholder-slate-400 px-4 py-3 rounded-xl border border-slate-200 focus:bg-white focus:border-accent-500 transition-colors outline-none"
                />
                
                <button 
                  onClick={handleSendMessage}
                  className="w-10 h-10 bg-accent-600 hover:bg-accent-700 text-white rounded-xl flex items-center justify-center shadow-sm transition-colors shrink-0 border-none outline-none"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          ) : (
            // Desktop Empty State (Select a chat to begin)
            <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50/50 select-none">
              <div className="w-16 h-16 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center mb-4">
                <MessageSquare size={28} className="stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800">Select a conversation</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs text-center leading-normal">
                Choose an expert or hirer from the left panel index to review updates and negotiate project details.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
