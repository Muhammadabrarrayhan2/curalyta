import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { Button, Badge, Input } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import {
  FALLBACK_PUBLIC_AI_ERROR_MESSAGE,
  resolvePublicAiErrorMessage,
} from './public-ai-messages';
import {
  buildPublicAiRequestPayload,
  validatePublicAiImageFile,
  type PublicAiHistoryMessage,
} from './public-ai-upload';
import clsx from 'clsx';

type PublicChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  imagePreviewUrl?: string;
  imageName?: string;
  excludeFromHistory?: boolean;
};

const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CONTENT = 900;
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

type SelectedPublicAiImage = {
  file: File;
  previewUrl: string;
  name: string;
};

function summarizeHistoryContent(content: string) {
  const normalized = content.trim().replace(/\s+/g, ' ');
  if (normalized.length <= MAX_HISTORY_CONTENT) return normalized;

  return `${normalized.slice(0, MAX_HISTORY_CONTENT - 3).trimEnd()}...`;
}

export function PublicAISection() {
  const [messages, setMessages] = useState<PublicChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedPublicAiImage | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const toast = useToast();

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  const history = useMemo<PublicAiHistoryMessage[]>(
    () =>
      messages
        .filter(
          (message) =>
            message !== INITIAL_MESSAGE &&
            !message.excludeFromHistory &&
            message.content !== FALLBACK_PUBLIC_AI_ERROR_MESSAGE &&
            Boolean(message.content.trim())
        )
        .slice(-MAX_HISTORY_MESSAGES)
        .map((message) => ({
          role: message.role,
          content: summarizeHistoryContent(message.content),
        })),
    [messages]
  );

  function clearSelectedImage() {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function rememberPreviewUrl(url: string) {
    previewUrlsRef.current.push(url);
    return url;
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validatePublicAiImageFile({
      type: file.type,
      size: file.size,
    });

    if (!validation.ok) {
      toast.error(validation.message);
      event.target.value = '';
      return;
    }

    const previewUrl = rememberPreviewUrl(URL.createObjectURL(file));
    setSelectedImage({
      file,
      previewUrl,
      name: file.name,
    });
  }

  async function sendMessage(
    messageText: string,
    imageInput: SelectedPublicAiImage | null = selectedImage
  ) {
    const trimmed = messageText.trim();
    if ((!trimmed && !imageInput) || loading) return;

    const nextUserMessage: PublicChatMessage = {
      role: 'user',
      content: trimmed,
      imagePreviewUrl: imageInput?.previewUrl,
      imageName: imageInput?.name,
    };
    setMessages((current) => [...current, nextUserMessage]);
    setInput('');
    clearSelectedImage();
    setLoading(true);

    try {
      const request = buildPublicAiRequestPayload({
        message: trimmed,
        history,
        imageFile: imageInput?.file,
      });
      const { data } =
        request.kind === 'form-data'
          ? await api.post<{ reply: string }>('/public/ai-chat', request.data, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          : await api.post<{ reply: string }>('/public/ai-chat', request.data);

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      const message = resolvePublicAiErrorMessage(getErrorMessage(err));
      toast.error(message);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: message,
          excludeFromHistory: true,
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
                  {message.imagePreviewUrl && (
                    <div className={clsx(message.content ? 'mt-3' : '')}>
                      <img
                        src={message.imagePreviewUrl}
                        alt={message.imageName || 'Gambar keluhan pengguna'}
                        className="max-h-52 w-full rounded-xl object-cover border border-black/5"
                      />
                      {message.imageName && (
                        <div
                          className={clsx(
                            'mt-2 text-[11px]',
                            message.role === 'user' ? 'text-white/80' : 'text-stone-400'
                          )}
                        >
                          {message.imageName}
                        </div>
                      )}
                    </div>
                  )}
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
              disabled={loading}
            />

            {selectedImage && (
              <div className="mb-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
                <div className="flex items-start gap-3">
                  <img
                    src={selectedImage.previewUrl}
                    alt={selectedImage.name}
                    className="w-20 h-20 rounded-xl object-cover border border-stone-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink truncate">{selectedImage.name}</div>
                    <p className="mt-1 text-[12px] text-stone-500">
                      Foto dipakai sementara untuk membantu analisis lalu langsung dibuang dari server.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="p-2 rounded-xl text-stone-400 hover:text-ink hover:bg-white transition-colors"
                    aria-label="Hapus gambar"
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="shrink-0 px-3"
                title="Tambahkan gambar"
              >
                <Icon name="upload" size={15} />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedImage ? 'Tambahkan penjelasan singkat bila perlu...' : 'Tulis pertanyaan kesehatan umum Anda...'}
                maxLength={1500}
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={!input.trim() && !selectedImage}
                loading={loading}
              >
                <Icon name="send" size={15} />
              </Button>
            </div>
            <p className="mt-2 text-[11.5px] text-stone-400">
              Jangan kirim data medis sensitif yang sangat pribadi. Foto hanya dipakai sementara saat diproses. Untuk penanganan klinis, tetap konsultasi dengan dokter.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
