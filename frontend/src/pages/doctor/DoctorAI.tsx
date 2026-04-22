import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { Badge, Button, Empty, Spinner } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { relativeTime } from '@/lib/format';

interface Conversation {
  id: string;
  title: string | null;
  patientId: string | null;
  updatedAt: string;
  _count?: { messages: number };
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export function DoctorAI() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: aiStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ['ai-status'],
    queryFn: async () => (await api.get('/ai/status')).data,
  });

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['ai-conversations'],
    queryFn: async () => (await api.get<{ conversations: Conversation[] }>('/ai/conversations')).data.conversations,
  });

  const { data: activeConv } = useQuery<{ conversation: Conversation & { messages: Message[] } }>({
    queryKey: ['ai-conversation', activeId],
    queryFn: async () => (await api.get(`/ai/conversations/${activeId}`)).data,
    enabled: !!activeId,
  });

  useEffect(() => {
    setPendingMessages([]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pendingMessages.length, activeConv?.conversation.messages.length]);

  async function send() {
    if (!input.trim() || sending) return;
    if (!aiStatus?.enabled) {
      toast.error('AI belum dikonfigurasi. Minta admin mengaktifkan ANTHROPIC_API_KEY.');
      return;
    }
    const userMsg = input.trim();
    setInput('');
    setPendingMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setSending(true);
    try {
      const { data } = await api.post<{ reply: string; conversationId: string }>('/ai/chat', {
        message: userMsg,
        conversationId: activeId,
      });
      if (!activeId) {
        setActiveId(data.conversationId);
      }
      setPendingMessages([]);
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversation', data.conversationId] });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPendingMessages([]);
    } finally {
      setSending(false);
    }
  }

  async function deleteConv(id: string) {
    if (!confirm('Hapus percakapan ini?')) return;
    try {
      await api.delete(`/ai/conversations/${id}`);
      if (activeId === id) setActiveId(null);
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      toast.success('Percakapan dihapus');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const currentMessages = activeConv?.conversation.messages || [];
  const allMessages = [...currentMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })), ...pendingMessages];

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-180px)]">
      {/* Sidebar conversations */}
      <div className="card flex flex-col overflow-hidden">
        <div className="p-3 border-b border-stone-100">
          <Button size="sm" className="w-full" onClick={() => { setActiveId(null); setPendingMessages([]); }}>
            <Icon name="plus" size={14} /> Percakapan baru
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          {!conversations || conversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-stone-400 px-3">Belum ada percakapan.</div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`p-3 border-b border-stone-50 cursor-pointer group ${activeId === c.id ? 'bg-sage-light/40' : 'hover:bg-stone-50'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13px] font-medium text-ink truncate flex-1">{c.title || '(tanpa judul)'}</div>
                  <button onClick={(e) => { e.stopPropagation(); deleteConv(c.id); }} className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-clinical-danger">
                    <Icon name="trash" size={12} />
                  </button>
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">{relativeTime(c.updatedAt)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="card flex flex-col overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="sparkles" size={18} className="text-sage-deep" />
            <div>
              <div className="font-medium text-ink">AI Assistant</div>
              <div className="text-[11px] text-stone-400">Clinical support — non-diagnostic</div>
            </div>
          </div>
          <Badge tone={aiStatus?.enabled ? 'success' : 'warning'}>
            {aiStatus?.enabled ? 'Active' : 'Not configured'}
          </Badge>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {!aiStatus?.enabled && (
            <div className="card p-5 border-l-4 !border-l-clinical-warning">
              <div className="flex items-start gap-3">
                <Icon name="alert" size={18} className="text-clinical-warning shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-ink mb-1">AI belum dikonfigurasi</div>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Platform berfungsi penuh tanpa AI. Untuk mengaktifkan fitur AI, administrator perlu mengisi <code className="bg-stone-100 px-1 rounded">ANTHROPIC_API_KEY</code> di file environment backend.
                  </p>
                </div>
              </div>
            </div>
          )}
          {allMessages.length === 0 && aiStatus?.enabled && (
            <div className="text-center py-8 text-stone-400 text-sm">
              <Icon name="sparkles" size={32} className="mx-auto mb-3 text-sage-deep" />
              <p>Mulai percakapan dengan AI Assistant.</p>
              <p className="text-[12px] mt-1">Tip: untuk konteks pasien spesifik, gunakan tombol AI di halaman detail pasien.</p>
            </div>
          )}
          {allMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-ink text-cream' : 'ai-msg'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="ai-msg rounded-lg p-3 flex items-center gap-1.5">
                <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-stone-100 flex gap-2">
          <input
            className="input flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={aiStatus?.enabled ? 'Ketik pertanyaan klinis...' : 'AI belum dikonfigurasi'}
            disabled={!aiStatus?.enabled || sending}
          />
          <Button onClick={send} disabled={!input.trim() || sending || !aiStatus?.enabled}>
            <Icon name="send" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
