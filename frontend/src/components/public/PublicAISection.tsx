import { useMemo, useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { Button, Badge, Input } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import clsx from 'clsx';

type PublicChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CONTENT = 900;
const FALLBACK_MESSAGE =
  'Tanya AI belum bisa menjawab saat ini. Jika konfigurasi belum aktif, tambahkan GEMINI_API_KEY. Kalau gejala Anda berat atau mendadak memburuk, segera cari bantuan medis langsung.';

const STARTER_PROMPTS = [
  'Saya batuk dan pilek 3 hari, kapan perlu periksa ke dokter?',
  'Apa beda gejala flu, alergi, dan sinusitis?',
  'Demam pada anak kapan harus dibawa ke IGD?',
  'Bagaimana cara aman menurunkan tekanan darah sehari-hari?',
];

const INITIAL_MESSAGE: PublicChatMessage = {
  role: 'assistant',
  content:
    'Halo, saya asisten kesehatan umum Curalyta. Silakan tanya gejala umum, langkah awal yang aman, atau kapan sebaiknya ke dokter. Saya tidak menggantikan diagnosis dokter.',
};

function summarizeHistoryContent(content: string) {
  const normalized = content.trim().replace(/\s+/g, ' ');
  if (normalized.length <= MAX_HISTORY_CONTENT) return normalized;

  return `${normalized.slice(0, MAX_HISTORY_CONTENT - 3).trimEnd()}...`;
}

export function PublicAISection() {
  const [messages, setMessages] = useState<PublicChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const history = useMemo(
    () =>
      messages
        .filter(
          (message) =>
            message !== INITIAL_MESSAGE && message.content !== FALLBACK_MESSAGE
        )
        .slice(-MAX_HISTORY_MESSAGES)
        .map((message) => ({
          role: message.role,
          content: summarizeHistoryContent(message.content),
        })),
    [messages]
  );

  async function sendMessage(messageText: string) {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    const nextUserMessage: PublicChatMessage = { role: 'user', content: trimmed };
    setMessages((current) => [...current, nextUserMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post<{ reply: string }>('/public/ai-chat', {
        message: trimmed,
        history,
      });
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: FALLBACK_MESSAGE,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="tanya-ai" className="max-w-7xl mx-auto px-4 lg:px-8 py-12 md:py-20">
      <div className="grid lg:grid-cols-[0.92fr_1.08fr] gap-8 lg:gap-12 items-start">
        <div>
          <Badge tone="info" className="mb-4">
            <Icon name="sparkles" size={12} /> Tanya AI
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-4">
            Tanya keluhan umum <span className="font-serif-italic text-sage-deep">tanpa login</span>
          </h2>
          <p className="text-stone-600 leading-relaxed mb-6 max-w-xl">
            Gunakan asisten AI publik untuk informasi kesehatan umum, edukasi gejala awal,
            dan saran langkah aman berikutnya. Cocok untuk pertanyaan ringan sebelum Anda
            memutuskan perlu konsultasi lebih lanjut.
          </p>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-stone-700 leading-relaxed mb-6">
            <div className="flex items-center gap-2 font-medium text-ink mb-2">
              <Icon name="alert" size={15} className="text-clinical-warning" />
              Batasan penting
            </div>
            <p>
              Jawaban AI ini hanya untuk informasi umum, bukan diagnosis atau pengganti dokter.
              Jika ada sesak napas berat, nyeri dada, penurunan kesadaran, kejang, atau perdarahan,
              segera ke IGD.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-ink">Contoh pertanyaan cepat</div>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="px-3 py-2 rounded-full border border-stone-200 bg-white text-sm text-stone-600 hover:text-ink hover:border-sage-deep/30 hover:bg-sage-light/40 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-stone-200 shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sage-light to-blue-50 text-sage-deep flex items-center justify-center">
                <Icon name="sparkles" size={18} />
              </div>
              <div>
                <div className="font-semibold text-ink">Asisten Tanya AI</div>
                <div className="text-xs text-stone-500">Informasi kesehatan umum untuk publik</div>
              </div>
            </div>
            <Badge tone="sage">Tanpa login</Badge>
          </div>

          <div className="p-4 md:p-5 space-y-3 h-[460px] overflow-y-auto bg-[linear-gradient(180deg,#fcfcfb_0%,#f7f8f7_100%)]">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={clsx(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={clsx(
                    'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                    message.role === 'user'
                      ? 'bg-sage-deep text-white rounded-br-md'
                      : 'bg-white text-stone-700 border border-stone-200 rounded-bl-md'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-stone-500 border border-stone-200 rounded-2xl rounded-bl-md px-4 py-3 text-sm shadow-sm inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-sage animate-pulse [animation-delay:120ms]" />
                  <span className="w-2 h-2 rounded-full bg-sage animate-pulse [animation-delay:240ms]" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-4 border-t border-stone-100 bg-white"
          >
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis pertanyaan kesehatan umum Anda..."
                maxLength={1500}
                disabled={loading}
              />
              <Button type="submit" disabled={!input.trim()} loading={loading}>
                <Icon name="send" size={15} />
              </Button>
            </div>
            <p className="mt-2 text-[11.5px] text-stone-400">
              Jangan kirim data medis sensitif yang sangat pribadi. Untuk penanganan klinis, tetap konsultasi dengan dokter.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
