import React, { useState } from 'react';
import { Product, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { X, Sparkles, Send, Bot, User, ShoppingBag, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  products: Product[];
  currency: CurrencyCode;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  recommendedProducts?: Product[];
}

export const AIBeautyAdvisorModal: React.FC<Props> = ({
  isOpen,
  products,
  currency,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Greetings! I am your AI Royal Beauty Advisor. Tell me your skin concerns or desired look (e.g. "radiant bridal glow", "hydrating dry skin regimen", or "bold matte lip for evening"), and I will curate a personalized botanical routine for you.',
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    const userMsg: Message = { id: `u-${Date.now()}`, sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const q = userText.toLowerCase();
      let matched: Product[] = [];

      if (q.includes('gold') || q.includes('glow') || q.includes('radiance') || q.includes('saffron') || q.includes('dull')) {
        matched = products.filter((p) => p.tags.includes('Saffron') || p.tags.includes('Radiant') || p.categoryId === 'cat-skincare');
      } else if (q.includes('lip') || q.includes('lipstick') || q.includes('matte') || q.includes('rose')) {
        matched = products.filter((p) => p.categoryId === 'cat-lips' || p.tags.includes('Rose Water'));
      } else if (q.includes('eye') || q.includes('kohl') || q.includes('kajal')) {
        matched = products.filter((p) => p.categoryId === 'cat-eyes');
      } else if (q.includes('bridal') || q.includes('wedding') || q.includes('gift')) {
        matched = products.filter((p) => p.categoryId === 'cat-sets' || p.isBestSeller);
      } else if (q.includes('fragrance') || q.includes('attar') || q.includes('perfume') || q.includes('oudh')) {
        matched = products.filter((p) => p.categoryId === 'cat-fragrance');
      } else {
        matched = products.filter((p) => p.isBestSeller).slice(0, 3);
      }

      if (matched.length === 0) {
        matched = products.slice(0, 2);
      }

      const aiReply: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Based on your request for "${userText}", I have handpicked these luxury botanical formulations tailored specifically to illuminate your natural beauty:`,
        recommendedProducts: matched.slice(0, 3),
      };

      setMessages((prev) => [...prev, aiReply]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-900/10 flex flex-col h-[80vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 flex items-center justify-between border-b border-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold">Royal AI Beauty Advisor</h2>
              <p className="text-[10px] text-amber-300/80">Personalized Botanical & Skincare Concierge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-900 text-amber-300 hover:text-amber-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-amber-900 text-amber-100'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-2">
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-amber-900 text-amber-100 rounded-tr-none'
                      : 'bg-white text-neutral-800 border border-neutral-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Recommended Products */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {msg.recommendedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 bg-white rounded-xl border border-amber-900/10 shadow-xs flex items-center gap-3"
                      >
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-lg bg-amber-50"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-serif font-bold text-neutral-900 truncate">
                            {p.name}
                          </h4>
                          <p className="text-[11px] font-bold text-amber-900">
                            {formatCurrency(p.salePriceUSD ?? p.priceUSD, currency)}
                          </p>
                        </div>
                        <button
                          onClick={() => onAddToCart(p)}
                          className="p-2 bg-amber-900 hover:bg-amber-950 text-amber-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Add to Cart"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium p-2 bg-amber-100/50 rounded-xl w-fit">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Concierge is formulating recommendations...
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-neutral-200 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Recommend a night routine for dry skin..."
            className="flex-1 px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-800"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 disabled:bg-neutral-300 text-amber-100 font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
