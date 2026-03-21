"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Loader2, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Magandang araw! Ako si Bayanihan Bot. Ano pong maitutulong ko sa inyo ngayon? (Halimbawa: Hotline ng NDRRMC, tulong sa trabaho, o fake news checker)" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages = [...messages, { role: "user", content: input } as Message];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      });
      const data = await res.json();
      
      if (data.message) {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: "Pasensya na po, hindi ko ma-proseso ang inyong tanong ngayon." }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Nawalan po ako ng koneksyon sa server. Paki-try ulit." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <Card className="w-[350px] sm:w-[400px] h-[500px] mb-4 flex flex-col overflow-hidden glass-card border-white/10 shadow-2xl">
          {/* Header */}
          <div className="bg-indigo-600 p-4 shrink-0 flex items-center justify-between text-white shadow-md z-10">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Bayanihan Bot</span>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20 rounded-full" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Context Notice */}
          <div className="bg-amber-500/10 px-4 py-2 flex gap-2 text-xs text-amber-200 border-b border-amber-500/20 shrink-0">
            <Info className="h-4 w-4 shrink-0 flex-none" />
            <span className="leading-tight">Para lang po ito sa Philippine public services, hotlines, at emergencies.</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0f1c]/90">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 text-sm whitespace-pre-wrap rounded-2xl ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white/10 text-white/90 border border-white/5 rounded-tl-sm"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                  <span className="text-xs text-white/60">Nag-iisip...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-[#050810] border-t border-white/10 shrink-0">
            <form onSubmit={sendMessage} className="flex gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Magtanong dito..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="rounded-full h-9 w-9 p-0 bg-indigo-600 hover:bg-indigo-700 shrink-0 flex items-center justify-center transition-all">
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <div className="relative group">
          {/* Notification Ping ping animation */}
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-rose-500 rounded-full z-20 animate-ping opacity-75"></div>
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-rose-500 rounded-full z-20"></div>
          
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg shadow-indigo-500/40 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:scale-110 transition-all duration-300 p-0 border border-white/10"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        </div>
      )}
    </div>
  );
}
