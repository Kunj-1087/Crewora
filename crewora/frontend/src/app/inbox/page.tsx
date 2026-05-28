{/* Inbox temporarily disabled
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronLeft, Send, Search, CheckCheck, MoreVertical, Image as ImageIcon,
  Smile, User, Phone, Check, Info, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const MOCK_CONVERSATIONS = [
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', // Sarah Jenkins
    name: 'Sarah Jenkins',
    role: 'Master Carpenter',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    unread: true,
    lastMsg: "Sure, let's schedule our site visit tomorrow at 10 AM. I have updated the woodwork cabinet layout...",
    time: '10:42 AM',
    messages: [
      { sender: 'other', text: 'Hi! Thanks for reaching out about the custom woodwork installation.', time: '09:15 AM' },
      { sender: 'me', text: 'Hello Sarah! Yes, we have a few kitchen areas we need measured and custom cabinet doors installed.', time: '09:30 AM' },
      { sender: 'other', text: 'Perfect. I can certainly help with that. Do you have the dimensions or drawing plans?', time: '09:35 AM' },
      { sender: 'me', text: 'Yes, just sent the design drafts over. We need it sorted out within a week.', time: '09:45 AM' },
      { sender: 'other', text: "Sure, let's schedule our site visit tomorrow at 10 AM. I have updated the woodwork cabinet layout draft for review.", time: '10:42 AM' }
    ]
  },
  {
    id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', // David Chen
    name: 'David Chen',
    role: 'Master Electrician',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    unread: false,
    lastMsg: 'I finished the wiring checks. Everything is fully functional and safe.',
    time: 'Yesterday',
    messages: [
      { sender: 'me', text: 'Hi David, are you available for an emergency inspection?', time: 'Yesterday 3:00 PM' },
      { sender: 'other', text: 'Yes, I can head over in 30 minutes. What seems to be the issue?', time: 'Yesterday 3:10 PM' },
      { sender: 'me', text: 'We have sparks flying from the main kitchen outlet box.', time: 'Yesterday 3:12 PM' },
      { sender: 'other', text: 'Understood. Please keep away from it and turn off the kitchen breaker if possible. I am on my way.', time: 'Yesterday 3:15 PM' },
      { sender: 'other', text: 'I finished the wiring checks. Everything is fully functional and safe.', time: 'Yesterday 4:45 PM' }
    ]
  }
];

export default function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetChatId = searchParams.get('chat');
  
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set active chat based on query param
  useEffect(() => {
    if (targetChatId) {
      setActiveChatId(targetChatId);
      // Mark as read
      setConversations(prev => 
        prev.map(c => c.id === targetChatId ? { ...c, unread: false } : c)
      );
    }
  }, [targetChatId]);

  // Find active chat data
  const activeChat = conversations.find(c => c.id === activeChatId);

  // Filter conversations list
  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSendMessage = () => {
    if (!typedMessage.trim() || !activeChatId) return;
    
    const newMsg = {
      sender: 'me',
      text: typedMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => 
      prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMsg: newMsg.text,
            time: 'Just now',
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      })
    );

    setTypedMessage('');
  };

  const handleConversationClick = (id: string) => {
    setActiveChatId(id);
    setConversations(prev => 
      prev.map(c => c.id === id ? { ...c, unread: false } : c)
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] relative animate-fadeIn select-none overflow-hidden h-[calc(100vh-4rem)] md:h-[600px]">
      
      {/* ─── CASE A: CONVERSATION LIST VIEW ──────────────────────────────────── */}
      {!activeChatId ? (
        <div className="flex-1 flex flex-col h-full bg-[#F8FAFC]">
          {/* Header */}
          <div className="px-5 pt-6 pb-4 bg-white border-b border-slate-100 shrink-0">
            <h1 className="text-xl font-extrabold text-[#0b1528] tracking-tight">Inbox</h1>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">Chat with your active contract experts</p>
            
            {/* Search conversations */}
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-[#0b1528] placeholder-slate-400 pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all outline-none"
              />
            </div>
          </div>

          {/* Conversations list scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-16 px-6">
                <User size={36} className="text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No chats available</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">Active contracts and booking inquiries will appear here.</p>
              </div>
            ) : (
              filteredConversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleConversationClick(c.id)}
                  className={`p-4 flex gap-3.5 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                    c.unread ? 'bg-emerald-50/5' : ''
                  }`}
                >
                  {c.unread && (
                    <span className="absolute top-4 left-4 w-2.5 h-2.5 bg-[#10b981] rounded-full border-2 border-white"></span>
                  )}

                  {/* Profile Photo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={c.photo} 
                    alt={c.name} 
                    className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-100"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <h3 className="text-xs font-extrabold text-[#0b1528]">{c.name}</h3>
                      <span className="text-[9px] text-slate-400 font-bold">{c.time}</span>
                    </div>
                    <span className="block text-[10px] text-slate-400 truncate mt-0.5">{c.role}</span>
                    <p className={`text-[11px] mt-1.5 line-clamp-1 truncate ${
                      c.unread ? 'font-extrabold text-slate-900' : 'text-slate-500'
                    }`}>{c.lastMsg}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full bg-[#F8FAFC]">
          {/* ─── CASE B: CONVERSATION DIALOG VIEW ────────────────────────────────── */}
          
          {/* Active Chat Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 h-14 px-4 flex items-center justify-between z-30 shadow-sm shrink-0 select-none">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setActiveChatId(null);
                  router.replace('/inbox'); // Clear query param
                }} 
                className="text-slate-800 hover:text-navy p-1 transition-colors"
              >
                <ChevronLeft size={20} className="stroke-[2.5]" />
              </button>
              
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={activeChat?.photo} 
                  alt={activeChat?.name} 
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <div className="text-left">
                  <h4 className="text-xs font-black text-[#0b1528]">{activeChat?.name}</h4>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">{activeChat?.role}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-500">
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">
                <Phone size={15} />
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">
                <MoreVertical size={15} />
              </button>
            </div>
          </div>

          {/* Messages Stream Pane */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {activeChat?.messages.map((m, index) => {
              const isMe = m.sender === 'me';
              return (
                <div 
                  key={index}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                    isMe 
                      ? 'bg-[#0b1528] text-white rounded-tr-none text-left' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none text-left'
                  }`}>
                    <p>{m.text}</p>
                    <div className={`flex justify-end items-center gap-1 mt-1.5 text-[8px] ${
                      isMe ? 'text-slate-400' : 'text-slate-400'
                    } font-medium`}>
                      <span>{m.time}</span>
                      {isMe && <CheckCheck size={10} className="text-[#10b981]" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Text Input Panel */}
          <div className="bg-white border-t border-slate-100 p-3 flex items-center gap-2 z-30 shrink-0">
            <button className="text-slate-400 hover:text-slate-600 p-1.5">
              <ImageIcon size={18} />
            </button>
            <button className="text-slate-400 hover:text-slate-600 p-1.5">
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
              className="flex-1 bg-slate-50 text-xs text-[#0b1528] placeholder-slate-400 px-3.5 py-3 rounded-xl border border-slate-250 focus:border-[#10b981] transition-colors outline-none"
            />
            
            <button 
              onClick={handleSendMessage}
              className="w-10 h-10 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl flex items-center justify-center shadow-sm transition-colors shrink-0"
            >
              <Send size={15} />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
*/
