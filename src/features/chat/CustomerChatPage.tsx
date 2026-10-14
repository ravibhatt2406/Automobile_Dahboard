import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { chatService, Conversation, ChatMessage } from '@/services/chat.service';
import { branchService } from '@/services/branch.service';
import { Branch } from '@/types/domain';
import {
  MessageSquare,
  Send,
  Building,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  ArrowLeft,
  Loader2,
  FileText,
  ShoppingBag,
  Wrench,
  Info,
} from 'lucide-react';

export const CustomerChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const branchIdParam = searchParams.get('branchId');
  const contextTypeParam = searchParams.get('contextType');
  const contextIdParam = searchParams.get('contextId');
  const subjectParam = searchParams.get('subject');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [selectedNewBranchId, setSelectedNewBranchId] = useState<string>('');
  const [newChatSubject, setNewChatSubject] = useState<string>('');
  const [newChatInitialMessage, setNewChatInitialMessage] = useState<string>('');
  const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);
  const [createChatError, setCreateChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingTimerRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await branchService.getBranches();
        setBranches(res.data || []);
      } catch (err) {
        console.error('Failed to load branches for chat:', err);
      }
    }
    loadBranches();
  }, []);

  // Initial load of conversations and handling deep-link
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setLoadingList(true);
      try {
        const list = await chatService.getConversations();
        if (!isMounted) return;
        const validList = Array.isArray(list) ? list : [];
        setConversations(validList);

        // Check if opened via deep-link
        if (branchIdParam) {
          const payload = {
            branchId: branchIdParam,
            contextType: contextTypeParam || undefined,
            contextId: contextIdParam || undefined,
            subject: subjectParam || undefined,
          };
          const conv = await chatService.createOrGetConversation(payload);
          if (!isMounted) return;

          // Select this conversation and refresh list
          setSelectedConversation(conv);
          const updatedList = await chatService.getConversations();
          if (isMounted) setConversations(Array.isArray(updatedList) ? updatedList : []);
        } else if (validList.length > 0 && !selectedConversation) {
          // Select the first conversation if none selected
          setSelectedConversation(validList[0]);
        }
      } catch (err) {
        console.error('Failed to initialize customer chat:', err);
      } finally {
        if (isMounted) setLoadingList(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [branchIdParam, contextTypeParam, contextIdParam, subjectParam]);

  // Load messages whenever selected conversation changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    async function fetchActiveThread() {
      if (!selectedConversation) return;
      try {
        const fullConv = await chatService.getConversationById(selectedConversation.id);
        if (!isMounted) return;
        setMessages(fullConv.messages || []);
        // update conversation in list to clear unread count
        setConversations((prev) =>
          prev.map((c) => (c.id === fullConv.id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    }

    setLoadingMessages(true);
    fetchActiveThread().finally(() => {
      if (isMounted) {
        setLoadingMessages(false);
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedConversation?.id]);

  // Polling for new messages and conversation list updates every 3.5 seconds
  useEffect(() => {
    pollingTimerRef.current = setInterval(async () => {
      try {
        // Poll active thread if open
        if (selectedConversation) {
          const updated = await chatService.getConversationById(selectedConversation.id);
          setMessages(updated.messages || []);
        }

        // Poll conversation list
        const latestList = await chatService.getConversations();
        setConversations(latestList);
      } catch {
        // Silent error on background poll
      }
    }, 3500);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [selectedConversation]);

  // Auto-scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConversation || isSending) return;

    const messageText = inputText.trim();
    setIsSending(true);
    setSendError(null);

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderType: 'CUSTOMER',
      senderUserId: 'me',
      message: messageText,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');

    try {
      const persisted = await chatService.sendMessage(selectedConversation.id, messageText);
      // Replace optimistic message with actual persisted record
      setMessages((prev) => prev.map((m) => (m.id === tempId ? persisted : m)));

      // Refresh list to bump timestamp
      const latestList = await chatService.getConversations();
      setConversations(latestList);
    } catch (err: any) {
      setSendError(err.message || 'Failed to send message. Please retry.');
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewBranchId) {
      setCreateChatError('Please select a dealership branch to message.');
      return;
    }

    setIsCreatingChat(true);
    setCreateChatError(null);

    try {
      const conv = await chatService.createOrGetConversation({
        branchId: selectedNewBranchId,
        subject: newChatSubject.trim() || undefined,
        initialMessage: newChatInitialMessage.trim() || undefined,
      });

      const updatedList = await chatService.getConversations();
      setConversations(updatedList);
      setSelectedConversation(conv);
      setShowNewChatModal(false);
      setSelectedNewBranchId('');
      setNewChatSubject('');
      setNewChatInitialMessage('');
    } catch (err: any) {
      setCreateChatError(err.message || 'Could not start conversation with branch.');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const filteredConversations = (Array.isArray(conversations) ? conversations : []).filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const branchName = c.branch?.name?.toLowerCase() || '';
    const subject = c.subject?.toLowerCase() || '';
    const lastMsg = c.messages?.[0]?.message?.toLowerCase() || '';
    return branchName.includes(q) || subject.includes(q) || lastMsg.includes(q);
  });

  const getContextBadge = (type?: string | null, id?: string | null) => {
    if (!type) return null;
    let Icon = Info;
    let label = type;
    if (type === 'QUOTATION') {
      Icon = FileText;
      label = `Quotation Enquiry`;
    } else if (type === 'BOOKING') {
      Icon = ShoppingBag;
      label = `Booking Order`;
    } else if (type === 'SERVICE') {
      Icon = Wrench;
      label = `Service Job`;
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-800 border border-amber-500/20">
        <Icon className="w-3 h-3 text-[#F5A800]" />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dealership Branch Chat"
        subtitle="Direct human-to-human communication with authorized Titan Auto branch advisors"
        breadcrumbItems={[
          { label: 'Customer Portal', href: '/dashboard' },
          { label: 'Contact Branch & Live Chat' },
        ]}
        actions={
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Message a Branch
          </button>
        }
      />

      {/* Main Chat Container */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden flex flex-col md:flex-row h-[720px]">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-zinc-200 flex flex-col bg-zinc-50/50 ${
            selectedConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* List Header & Search */}
          <div className="p-4 border-b border-zinc-200 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#F5A800]" />
                <h3 className="font-bold text-sm text-zinc-900">Your Branch Conversations</h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                {conversations.length}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search branches or messages..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:border-[#F5A800] text-zinc-900 placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#F5A800]" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 space-y-3">
                <Building className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="font-medium text-zinc-700">No conversations yet</p>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  Connect directly with any Titan Auto dealership branch for quotations, orders, or service questions.
                </p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-[#F5A800] font-bold text-xs rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Start First Chat
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                const lastMsg = conv.messages?.[0];
                const unread = conv.unreadCount || 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 hover:bg-zinc-100/70 ${
                      isSelected ? 'bg-amber-500/10 border-l-4 border-[#F5A800]' : 'bg-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 text-[#F5A800] flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-xs">
                      {conv.branch?.code?.slice(0, 3) || 'BRN'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-zinc-900 truncate">
                          {conv.branch?.name || 'Dealership Branch'}
                        </span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      {conv.subject && (
                        <p className="text-[11px] font-semibold text-zinc-700 truncate mb-1">
                          {conv.subject}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-zinc-500 truncate flex-1">
                          {lastMsg ? (
                            <>
                              <span className="font-medium text-zinc-700">
                                {lastMsg.senderType === 'CUSTOMER' ? 'You: ' : 'Branch: '}
                              </span>
                              {lastMsg.message}
                            </>
                          ) : (
                            <span className="italic text-zinc-400">No messages yet</span>
                          )}
                        </p>

                        {unread > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F5A800] text-black shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Pane */}
        <div
          className={`flex-1 flex flex-col bg-white ${
            !selectedConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Conversation Top Header */}
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-zinc-900 text-[#F5A800] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    {selectedConversation.branch?.code?.slice(0, 3) || 'BRN'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-zinc-900">
                        {selectedConversation.branch?.name}
                      </h4>
                      {getContextBadge(
                        selectedConversation.contextType,
                        selectedConversation.contextId
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                      <span>Branch Code: {selectedConversation.branch?.code}</span>
                      {selectedConversation.assignedEmployee && (
                        <span>
                          • Assigned Advisor: {selectedConversation.assignedEmployee.user?.fullName}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Live Dealership Desk
                  </span>
                </div>
              </div>

              {/* Message Thread Scroll View */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-zinc-50/30">
                {/* Context banner if associated with booking/quotation/service */}
                {selectedConversation.contextType && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 max-w-xl mx-auto shadow-xs">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">
                        Linked Context: {selectedConversation.contextType}
                      </span>
                      {selectedConversation.subject && (
                        <p className="mt-0.5 text-amber-800">{selectedConversation.subject}</p>
                      )}
                    </div>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-zinc-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#F5A800]" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 text-zinc-300" />
                    <p className="font-medium text-zinc-600">No messages in this conversation yet</p>
                    <p className="text-[11px] max-w-sm">
                      Send a message below to inquire about inventory availability, booking contracts, or service jobs.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderType === 'CUSTOMER';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-semibold text-zinc-500">
                            {isMe
                              ? 'You'
                              : msg.sender?.fullName ||
                                `${selectedConversation.branch?.name} Representative`}
                          </span>
                          {!isMe && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 font-mono font-medium">
                              BRANCH
                            </span>
                          )}
                        </div>

                        <div
                          className={`max-w-[85%] md:max-w-md lg:max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-[#111111] text-white rounded-tr-none'
                              : 'bg-white border border-zinc-200 text-zinc-900 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <div
                            className={`flex items-center justify-end gap-1.5 mt-1.5 text-[9px] font-mono ${
                              isMe ? 'text-zinc-400' : 'text-zinc-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && (
                              <span>
                                {msg.id.startsWith('temp-') ? (
                                  <Clock className="w-2.5 h-2.5 text-zinc-400 inline" />
                                ) : msg.isRead ? (
                                  <CheckCheck className="w-3 h-3 text-[#F5A800] inline" />
                                ) : (
                                  <Check className="w-3 h-3 text-zinc-400 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <div className="p-4 border-t border-zinc-200 bg-white">
                {sendError && (
                  <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{sendError}</span>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message to dealership branch..."
                    disabled={isSending}
                    className="flex-1 px-4 py-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl focus:outline-hidden focus:border-[#F5A800] focus:bg-white text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="px-4 py-2.5 bg-[#111111] hover:bg-black text-[#F5A800] rounded-xl font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-zinc-800 text-base">Select a conversation</h4>
              <p className="text-xs text-zinc-500 max-w-sm">
                Choose a conversation from the sidebar or click "Message a Branch" to contact an authorized Titan Auto dealership representative.
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2 bg-[#111111] text-[#F5A800] font-bold text-xs rounded-xl shadow-xs"
              >
                Start New Branch Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#F5A800]" />
                Start Conversation with Branch
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {createChatError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createChatError}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewChat} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Select Dealership Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedNewBranchId}
                  onChange={(e) => setSelectedNewBranchId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-[#F5A800]"
                >
                  <option value="">-- Choose Branch Location --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) - {b.city || 'Commercial Hub'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Topic / Subject</label>
                <input
                  type="text"
                  value={newChatSubject}
                  onChange={(e) => setNewChatSubject(e.target.value)}
                  placeholder="e.g. Quotation Enquiry, Delivery Update, Fleet Service"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-[#F5A800]"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Initial Message</label>
                <textarea
                  rows={3}
                  value={newChatInitialMessage}
                  onChange={(e) => setNewChatInitialMessage(e.target.value)}
                  placeholder="Write your query or message here..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-[#F5A800]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-3 py-1.5 text-zinc-600 hover:text-zinc-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingChat || !selectedNewBranchId}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreatingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Chat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
