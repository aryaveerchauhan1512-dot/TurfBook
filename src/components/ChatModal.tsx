import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageCircle,
  Search,
  Store,
  User as UserIcon,
  Clock,
  Sparkles,
  ChevronLeft,
  Check,
  CheckCheck,
  RefreshCw,
  Phone,
  PhoneCall,
  Copy,
  MapPin,
  Calendar
} from 'lucide-react';
import { User, Turf, Conversation, ChatMessage } from '../types';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  initialTurf?: Turf | null;
  initialOwnerId?: string;
  initialOwnerName?: string;
  initialRecipientId?: string;
  initialRecipientName?: string;
  onOpenBookingModal?: (turf: Turf) => void;
}

const PLAYER_SUGGESTED_PROMPTS = [
  '🚗 Is parking available at the venue?',
  '👟 Are football studs / spikes allowed on turf?',
  '⚽ Do you provide footballs, bats and bibs?',
  '🌧️ Is the arena covered in case of rain?',
  '⏰ Can we extend our slot if the next hour is free?',
];

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTurf,
  initialOwnerId,
  initialOwnerName,
  initialRecipientId,
  initialRecipientName,
  onOpenBookingModal,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<any>(null);

  // Auto scroll to bottom of messages
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  // Fetch all conversations for current user
  const fetchConversations = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/chat/conversations?userId=${encodeURIComponent(currentUser.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setConversations(data);
          return data;
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
    return [];
  };

  // Fetch messages for active conversation
  const fetchMessages = async (convId: string, silent = false) => {
    if (!currentUser?.id) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/chat/messages/${encodeURIComponent(convId)}?userId=${encodeURIComponent(currentUser.id)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // On open or target change, initialize chat
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const initChat = async () => {
      setLoadingConversations(true);
      const convList = await fetchConversations();
      setLoadingConversations(false);

      // Check if user clicked "Chat with Owner" for a specific turf or person
      if (initialTurf || initialRecipientId || initialOwnerId) {
        const targetOwnerId = initialTurf?.ownerId || initialOwnerId || initialRecipientId || '';
        const targetOwnerName = initialTurf?.ownerName || initialOwnerName || initialRecipientName || 'Venue Owner';
        const targetTurfId = initialTurf?.id || '';
        const targetTurfName = initialTurf?.name || 'Sports Arena';
        const targetTurfImage = initialTurf?.images?.[0] || '';

        // Find existing conversation
        const existing = convList.find(
          (c: Conversation) =>
            (c.turfId === targetTurfId && (c.ownerId === targetOwnerId || c.playerId === targetOwnerId)) ||
            (c.playerId === currentUser.id && c.ownerId === targetOwnerId) ||
            (c.ownerId === currentUser.id && c.playerId === targetOwnerId)
        );

        if (existing) {
          setActiveConversation(existing);
          fetchMessages(existing.id);
        } else {
          // Setup a temporary active draft conversation
          const isUserOwner = currentUser.role === 'owner';
          const draftConv: Conversation = {
            id: `conv_${targetTurfId || 'direct'}_${currentUser.id}_${targetOwnerId}`,
            turfId: targetTurfId,
            turfName: targetTurfName,
            turfImage: targetTurfImage,
            playerId: isUserOwner ? targetOwnerId : currentUser.id,
            playerName: isUserOwner ? targetOwnerName : currentUser.name,
            ownerId: isUserOwner ? currentUser.id : targetOwnerId,
            ownerName: isUserOwner ? currentUser.name : targetOwnerName,
            lastMessage: 'Start a new conversation',
            lastMessageAt: new Date().toISOString(),
            unreadCountPlayer: 0,
            unreadCountOwner: 0,
            updatedAt: new Date().toISOString(),
          };
          setActiveConversation(draftConv);
          setMessages([]);
        }
      } else if (convList.length > 0 && !activeConversation) {
        // Select first conversation by default on desktop
        setActiveConversation(convList[0]);
        fetchMessages(convList[0].id);
      }
    };

    initChat();
  }, [isOpen, currentUser?.id, initialTurf?.id, initialOwnerId, initialRecipientId]);

  // Periodic polling for real-time message updates
  useEffect(() => {
    if (!isOpen || !activeConversation?.id) return;

    pollTimerRef.current = setInterval(() => {
      fetchMessages(activeConversation.id, true);
      fetchConversations();
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, activeConversation?.id]);

  // Send a new message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !currentUser || !activeConversation || sending) return;

    setSending(true);
    setInputText('');

    const isUserOwner = currentUser.role === 'owner';
    const recipientId =
      currentUser.id === activeConversation.playerId
        ? activeConversation.ownerId
        : activeConversation.playerId;
    const recipientName =
      currentUser.id === activeConversation.playerId
        ? activeConversation.ownerName
        : activeConversation.playerName;

    // Optimistic message
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversation.id,
      turfId: activeConversation.turfId,
      turfName: activeConversation.turfName,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId,
      recipientName,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          turfId: activeConversation.turfId,
          turfName: activeConversation.turfName,
          turfImage: activeConversation.turfImage,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          recipientId,
          recipientName,
          text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempMessage.id ? data.message : m))
          );
        }
        if (data.conversation) {
          setActiveConversation(data.conversation);
          setConversations((prev) => {
            const filtered = prev.filter((c) => c.id !== data.conversation.id);
            return [data.conversation, ...filtered];
          });
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  if (!isOpen) return null;

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.turfName.toLowerCase().includes(q) ||
      c.playerName.toLowerCase().includes(q) ||
      c.ownerName.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  const isCurrentSenderOwner = currentUser?.role === 'owner';
  const otherPartyName = activeConversation
    ? currentUser?.id === activeConversation.playerId
      ? activeConversation.ownerName
      : activeConversation.playerName
    : '';
  const otherPartyRole = activeConversation
    ? currentUser?.id === activeConversation.playerId
      ? 'Turf Owner'
      : 'Player'
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full h-[90vh] max-h-[720px] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
        
        {/* TOP BAR */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                TurfBook Direct Chat
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold">
                  Live
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct messaging between players & venue owners
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN BODY: 2-COLUMN ON DESKTOP, SWITCHABLE ON MOBILE */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT SIDEBAR: CONVERSATION LIST */}
          <div
            className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col shrink-0 ${
              activeConversation ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Bar */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats or venues..."
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2E7D32]"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {loadingConversations ? (
                <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#2E7D32]" />
                  <span>Loading conversations...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <MessageCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    No conversations yet
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Click "Chat with Owner" on any turf listing to start enquiring.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = activeConversation?.id === conv.id;
                  const isUserOwner = currentUser?.role === 'owner';
                  const unreadCount = isUserOwner
                    ? conv.unreadCountOwner || 0
                    : conv.unreadCountPlayer || 0;
                  const partyTitle =
                    currentUser?.id === conv.playerId ? conv.ownerName : conv.playerName;
                  const partySub =
                    currentUser?.id === conv.playerId ? 'Owner' : 'Player';

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversation(conv);
                        fetchMessages(conv.id);
                      }}
                      className={`w-full p-3 text-left flex items-start gap-3 transition-colors ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-[#2E7D32]'
                          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-500">
                        {conv.turfImage ? (
                          <img
                            src={conv.turfImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {conv.turfName}
                          </h4>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {partyTitle} ({partySub}):
                          </span>{' '}
                          {conv.lastMessage || 'No messages'}
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#2E7D32] text-white text-[10px] font-black shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: CHAT THREAD */}
          {activeConversation ? (
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0">
              
              {/* Chat Thread Header */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#2E7D32] flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs">
                    {activeConversation.turfImage ? (
                      <img
                        src={activeConversation.turfImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                      {activeConversation.turfName}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-[#2E7D32] dark:text-emerald-400">
                        {otherPartyName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
                        {otherPartyRole}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {initialTurf && onOpenBookingModal && currentUser?.role === 'user' && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenBookingModal(initialTurf);
                      }}
                      className="px-3 py-1.5 bg-[#2E7D32] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#256629] flex items-center gap-1 transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Slots</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#2E7D32] mr-2" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-[#2E7D32]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Start the conversation with {otherPartyName}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs mt-1">
                        Ask questions about slot timing, footwear rules, parking, or amenities.
                      </p>
                    </div>

                    {/* Quick suggestion prompt chips */}
                    {currentUser?.role === 'user' && (
                      <div className="w-full max-w-md pt-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Suggested Questions (Click to Send):
                        </p>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {PLAYER_SUGGESTED_PROMPTS.map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(prompt)}
                              className="text-left px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#2E7D32] hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 rounded-xl text-xs text-slate-700 dark:text-slate-200 transition-all shadow-2xs"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Timestamp divider */}
                    <div className="text-center my-2">
                      <span className="px-3 py-1 bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-bold">
                        Enquiry regarding {activeConversation.turfName}
                      </span>
                    </div>

                    {messages.map((msg) => {
                      const isMe = msg.senderId === currentUser?.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {isMe ? 'You' : msg.senderName}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div
                            className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                              isMe
                                ? 'bg-[#2E7D32] text-white rounded-tr-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                            }`}
                          >
                            {msg.contactInfo || msg.messageType === 'owner_contact' || msg.messageType === 'player_contact' || msg.text.includes('CONTACT DETAILS:') ? (
                              <div className="space-y-2.5">
                                {/* Card Header */}
                                <div className={`flex items-center justify-between gap-2 pb-2 border-b ${
                                  isMe ? 'border-emerald-500/50' : 'border-slate-200 dark:border-slate-700'
                                }`}>
                                  <div className="flex items-center gap-1.5 font-black text-xs">
                                    {msg.contactInfo?.type === 'owner_contact' || msg.messageType === 'owner_contact' || msg.text.includes('OWNER CONTACT') ? (
                                      <>
                                        <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Owner Contact Shared</span>
                                      </>
                                    ) : (
                                      <>
                                        <UserIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Player Contact Shared</span>
                                      </>
                                    )}
                                  </div>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                    isMe
                                      ? 'bg-emerald-800/60 text-emerald-100'
                                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  }`}>
                                    Direct DM
                                  </span>
                                </div>

                                {/* Text Overview */}
                                <p className="whitespace-pre-wrap leading-relaxed opacity-95 text-[11px]">
                                  {msg.text}
                                </p>

                                {/* Action Buttons */}
                                {(() => {
                                  const phoneVal = msg.contactInfo?.phone || msg.text.match(/Phone[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';
                                  const cleanPhone = phoneVal.replace(/[^0-9]/g, '');
                                  const isOwnerCard = msg.contactInfo?.type === 'owner_contact' || msg.messageType === 'owner_contact' || msg.text.includes('OWNER CONTACT');

                                  if (!phoneVal) return null;

                                  return (
                                    <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-black/10 dark:border-white/10">
                                      <a
                                        href={`tel:${phoneVal}`}
                                        className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] shadow-xs transition-colors"
                                      >
                                        <PhoneCall className="w-3 h-3" />
                                        <span>Call</span>
                                      </a>
                                      <a
                                        href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(
                                          isOwnerCard
                                            ? `Hi, I sent a booking request on TurfBook for ${msg.contactInfo?.turfName || msg.turfName}.`
                                            : `Hi, this is regarding your booking request for ${msg.contactInfo?.turfName || msg.turfName}.`
                                        )}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-[10px] shadow-xs transition-colors"
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                        <span>WhatsApp</span>
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(phoneVal)}
                                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl font-bold text-[10px] transition-colors ${
                                          isMe
                                            ? 'bg-emerald-800/80 hover:bg-emerald-900 text-emerald-100'
                                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'
                                        }`}
                                      >
                                        {copiedPhone === phoneVal ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span>Copied</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}

                            <div
                              className={`flex items-center justify-end gap-1 mt-1.5 text-[9px] ${
                                isMe ? 'text-emerald-200' : 'text-slate-400'
                              }`}
                            >
                              {isMe && (
                                msg.read ? (
                                  <CheckCheck className="w-3 h-3 text-white" />
                                ) : (
                                  <Check className="w-3 h-3 opacity-80" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Quick suggestion chips (collapsible bar for active chat) */}
              {currentUser?.role === 'user' && messages.length > 0 && (
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">
                    Quick:
                  </span>
                  {PLAYER_SUGGESTED_PROMPTS.slice(0, 3).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] font-medium text-slate-700 dark:text-slate-200 shrink-0 hover:border-[#2E7D32] transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Input Box */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Type message to ${otherPartyName}...`}
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2E7D32]"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="px-4 py-2.5 bg-[#2E7D32] hover:bg-[#256629] disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center text-center p-8 bg-white dark:bg-slate-900 text-slate-400">
              <div className="space-y-2 max-w-xs">
                <MessageCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Select a Conversation
                </h4>
                <p className="text-xs text-slate-400">
                  Pick a chat thread from the left to start messaging with players or turf managers.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
