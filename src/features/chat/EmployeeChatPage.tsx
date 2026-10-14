import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/data-display/PageHeader';
import { chatService, Conversation, ChatMessage } from '@/services/chat.service';
import { employeeService } from '@/services/employee.service';
import { branchService } from '@/services/branch.service';
import { useAuth } from '@/app/providers/AuthContext';
import { Employee, Branch } from '@/types/domain';
import {
  MessageSquare,
  Send,
  User,
  Building,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Search,
  ArrowLeft,
  Loader2,
  FileText,
  ShoppingBag,
  Wrench,
  UserCheck,
  Filter,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';

export const EmployeeChatPage: React.FC = () => {
  const { user, activeRole, permissions } = useAuth();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get('id');

  const isManager =
    activeRole === 'BRANCH_MANAGER' ||
    activeRole === 'FRANCHISE_MANAGER' ||
    activeRole === 'FRANCHISE_OWNER' ||
    activeRole === 'SUPER_ADMIN';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [branchEmployees, setBranchEmployees] = useState<Employee[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingTimerRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initial load of conversations
  useEffect(() => {
    let isMounted = true;

    async function loadConversations() {
      setLoadingList(true);
      try {
        const list = await chatService.getConversations();
        if (!isMounted) return;
        const validList = Array.isArray(list) ? list : [];
        setConversations(validList);

        if (initialConvId) {
          const match = validList.find((c) => c.id === initialConvId);
          if (match) setSelectedConversation(match);
        } else if (validList.length > 0 && !selectedConversation) {
          setSelectedConversation(validList[0]);
        }
      } catch (err) {
        console.error('Failed to load employee conversations:', err);
      } finally {
        if (isMounted) setLoadingList(false);
      }
    }

    loadConversations();

    return () => {
      isMounted = false;
    };
  }, [initialConvId]);

  // Load messages and fetch branch employees when conversation changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    async function fetchThread() {
      if (!selectedConversation) return;
      try {
        const fullConv = await chatService.getConversationById(selectedConversation.id);
        if (!isMounted) return;
        setMessages(fullConv.messages || []);
        // update conversation in list to clear unread
        setConversations((prev) =>
          prev.map((c) => (c.id === fullConv.id ? { ...c, unreadCount: 0 } : c))
        );

        // Load employees for this branch if manager
        if (isManager && fullConv.branchId) {
          const empRes = await employeeService.getEmployees({ branchId: fullConv.branchId });
          if (isMounted) setBranchEmployees(empRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load employee chat thread:', err);
      }
    }

    setLoadingMessages(true);
    fetchThread().finally(() => {
      if (isMounted) {
        setLoadingMessages(false);
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedConversation?.id, isManager]);

  // Polling for updates every 3.5 seconds
  useEffect(() => {
    pollingTimerRef.current = setInterval(async () => {
      try {
        if (selectedConversation) {
          const updated = await chatService.getConversationById(selectedConversation.id);
          setMessages(updated.messages || []);
        }
        const latestList = await chatService.getConversations();
        setConversations(latestList);
      } catch {
        // Silent poll error
      }
    }, 3500);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConversation || isSending) return;

    const messageText = inputText.trim();
    setIsSending(true);
    setSendError(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderType: 'EMPLOYEE',
      senderUserId: user?.id || 'me',
      message: messageText,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');

    try {
      const persisted = await chatService.sendMessage(selectedConversation.id, messageText);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? persisted : m)));
      const latestList = await chatService.getConversations();
      setConversations(latestList);
    } catch (err: any) {
      setSendError(err.message || 'Failed to reply to customer. Please retry.');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleAssignConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !selectedEmployeeId) return;

    setIsAssigning(true);
    setAssignError(null);

    try {
      const updated = await chatService.assignConversation(
        selectedConversation.id,
        selectedEmployeeId
      );
      setSelectedConversation(updated);
      const latestList = await chatService.getConversations();
      setConversations(latestList);
      setShowAssignModal(false);
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign conversation to selected employee.');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredConversations = (Array.isArray(conversations) ? conversations : []).filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const custName = c.customer?.user?.fullName?.toLowerCase() || '';
    const custEmail = c.customer?.user?.email?.toLowerCase() || '';
    const subject = c.subject?.toLowerCase() || '';
    const branchName = c.branch?.name?.toLowerCase() || '';
    return custName.includes(q) || custEmail.includes(q) || subject.includes(q) || branchName.includes(q);
  });

  const totalUnread = (Array.isArray(conversations) ? conversations : []).reduce(
    (acc, curr) => acc + (curr.unreadCount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Messages & Live Inquiries"
        subtitle="Manage customer interactions, respond to vehicle enquiries, and assign conversations"
        breadcrumbItems={[
          { label: 'Operations Desk', href: '/dashboard' },
          { label: 'Customer Chat' },
        ]}
      />

      {/* Main Chat Container */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden flex flex-col md:flex-row h-[740px]">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-zinc-200 flex flex-col bg-zinc-50/50 ${
            selectedConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-zinc-200 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#F5A800]" />
                <h3 className="font-bold text-sm text-zinc-900">Branch Conversations</h3>
              </div>
              {totalUnread > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#F5A800] text-black">
                  {totalUnread} Unread
                </span>
              ) : (
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                  {conversations.length}
                </span>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {(['ALL', 'OPEN', 'ASSIGNED', 'CLOSED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors shrink-0 ${
                    statusFilter === st
                      ? 'bg-[#111111] text-[#F5A800]'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, topic..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:border-[#F5A800] text-zinc-900 placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Conversations List View */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#F5A800]" />
                <span>Loading customer conversations...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="font-semibold text-zinc-700">No conversations found</p>
                <p className="text-[11px] text-zinc-400">
                  Conversations initiated by customers for your branch will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                const lastMsg = conv.messages?.[0];
                const unread = conv.unreadCount || 0;
                const customerName = conv.customer?.user?.fullName || 'Customer';

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 hover:bg-zinc-100/70 ${
                      isSelected ? 'bg-amber-500/10 border-l-4 border-[#F5A800]' : 'bg-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 text-[#F5A800] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {customerName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-zinc-900 truncate">
                          {customerName}
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

                      <div className="flex items-center gap-2 mb-1">
                        {conv.subject && (
                          <span className="text-[11px] font-semibold text-zinc-800 truncate">
                            {conv.subject}
                          </span>
                        )}
                        {conv.contextType && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-200 text-zinc-700 uppercase">
                            {conv.contextType}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-zinc-500 truncate flex-1">
                          {lastMsg ? (
                            <>
                              <span className="font-medium text-zinc-700">
                                {lastMsg.senderType === 'EMPLOYEE' ? 'You: ' : 'Customer: '}
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
              {/* Header */}
              <div className="p-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-zinc-900 text-[#F5A800] flex items-center justify-center font-bold text-sm shrink-0 font-mono">
                    {selectedConversation.customer?.user?.fullName?.charAt(0).toUpperCase() || 'C'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-zinc-900">
                        {selectedConversation.customer?.user?.fullName || 'Customer'}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700 uppercase">
                        {selectedConversation.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                      {selectedConversation.customer?.user?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          {selectedConversation.customer.user.email}
                        </span>
                      )}
                      {selectedConversation.customer?.user?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          {selectedConversation.customer.user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assignment & Management Controls */}
                <div className="flex items-center gap-2">
                  {selectedConversation.assignedEmployee ? (
                    <div className="text-right text-xs">
                      <span className="text-[10px] text-zinc-400 block font-mono">
                        ASSIGNED ADVISOR
                      </span>
                      <span className="font-bold text-zinc-800">
                        {selectedConversation.assignedEmployee.user?.fullName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded font-medium">
                      Unassigned
                    </span>
                  )}

                  {isManager && (
                    <button
                      onClick={() => {
                        setSelectedEmployeeId(selectedConversation.assignedEmployeeId || '');
                        setShowAssignModal(true);
                      }}
                      className="px-3 py-1.5 bg-[#111111] hover:bg-black text-[#F5A800] rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {selectedConversation.assignedEmployeeId ? 'Reassign' : 'Assign'}
                    </button>
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-zinc-50/30">
                {selectedConversation.contextType && (
                  <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 flex items-start gap-2 max-w-xl mx-auto shadow-xs">
                    <FileText className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase text-[11px]">
                        Linked Entity: {selectedConversation.contextType}
                      </span>
                      {selectedConversation.subject && (
                        <p className="mt-0.5 text-zinc-700">{selectedConversation.subject}</p>
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
                    <p className="font-medium text-zinc-600">No messages yet</p>
                    <p className="text-[11px] max-w-sm">
                      Reply below to communicate directly with this customer.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isEmployee = msg.senderType === 'EMPLOYEE';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isEmployee ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-semibold text-zinc-500">
                            {isEmployee
                              ? msg.sender?.fullName || 'Dealership Employee'
                              : selectedConversation.customer?.user?.fullName || 'Customer'}
                          </span>
                          {isEmployee ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-900 text-[#F5A800] font-mono font-medium">
                              STAFF
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono font-medium">
                              CUSTOMER
                            </span>
                          )}
                        </div>

                        <div
                          className={`max-w-[85%] md:max-w-md lg:max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isEmployee
                              ? 'bg-[#111111] text-white rounded-tr-none'
                              : 'bg-white border border-zinc-200 text-zinc-900 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <div
                            className={`flex items-center justify-end gap-1.5 mt-1.5 text-[9px] font-mono ${
                              isEmployee ? 'text-zinc-400' : 'text-zinc-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isEmployee && (
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
                    placeholder="Type official reply to customer..."
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
                        <span className="hidden sm:inline">Reply</span>
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
              <h4 className="font-bold text-zinc-800 text-base">Select a customer conversation</h4>
              <p className="text-xs text-zinc-500 max-w-sm">
                Choose a conversation from the left to view customer inquiries and send responses.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Conversation Modal */}
      {showAssignModal && selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#F5A800]" />
                Assign Conversation to Staff
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {assignError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleAssignConversation} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Select Branch Employee / Advisor <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-[#F5A800]"
                >
                  <option value="">-- Select Branch Staff Member --</option>
                  {branchEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.designation || 'Staff'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Only employees belonging to branch{' '}
                  <span className="font-bold">{selectedConversation.branch?.name}</span> can be assigned.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 text-zinc-600 hover:text-zinc-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !selectedEmployeeId}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-[#F5A800] rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
