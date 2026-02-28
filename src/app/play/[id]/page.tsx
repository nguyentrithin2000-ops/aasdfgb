"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function Game() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [char, setChar] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isAiTyping, streamingContent]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const { data: charData } = await supabase.from('characters').select('*').eq('id', id).single();
      if (!charData) {
        router.push("/");
        return;
      }
      setChar(charData);

      const { data: logs } = await supabase
        .from('story_logs')
        .select('*')
        .eq('character_id', id)
        .order('created_at', { ascending: true });
      
      if (logs && logs.length > 0) {
        setHistory(logs);
        // Bóc tách lựa chọn từ chương cuối cùng để hiện nút
        parseOptions(logs[logs.length - 1].content);
      } else {
        generateAiResponse("Bắt đầu hành trình khởi đầu đại nghiệp.", charData, []);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Hàm bóc tách lựa chọn [1], [2], [3] từ văn bản
  const parseOptions = (text: string) => {
    const regex = /\[\d\]\s*-\s*([^\[\n]+)|\[\d\]\s*([^\[\n]+)/g;
    const matches = [...text.matchAll(regex)];
    const options = matches.map(m => (m[1] || m[2]).trim());
    setCurrentOptions(options.slice(0, 3));
  };

  const generateAiResponse = async (userChoice: string, character: any, currentHistory: any[]) => {
    setIsAiTyping(true);
    setStreamingContent("");
    setCurrentOptions([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userChoice,
          character: character,
          history: currentHistory.slice(-5)
        }),
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        setStreamingContent(fullText); // Chữ chảy lên màn hình
      }

      // Lưu vào DB sau khi stream xong
      const { error } = await supabase.from('story_logs').insert([
        { character_id: id, content: fullText, choice_made: userChoice }
      ]);

      if (!error) {
        setHistory(prev => [...prev, { choice_made: userChoice, content: fullText }]);
        parseOptions(fullText);
      }
    } catch (err) {
      alert("Thiên cơ nhiễu loạn, hãy thử lại!");
    } finally {
      setIsAiTyping(false);
      setStreamingContent("");
    }
  };

  const handleSend = async (customInput?: string) => {
    const finalInput = customInput || input;
    if (!finalInput || !id || isAiTyping) return;
    setInput("");
    await generateAiResponse(finalInput, char, history);
  };

  if (loading) return <div className="bg-slate-950 text-white h-screen flex items-center justify-center font-serif italic">Đang nhập hồn...</div>;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-serif overflow-hidden">
      {/* Sidebar Chỉ số */}
      <div className="w-72 border-r border-slate-800 p-6 bg-slate-900/50 hidden lg:flex flex-col">
        <button onClick={() => router.push("/")} className="text-slate-500 hover:text-white mb-8 text-sm flex items-center gap-2 transition">← Trở về sảnh chờ</button>
        <h2 className="text-3xl font-black text-purple-400 mb-1 leading-none tracking-tighter">{char.name}</h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-8 border-b border-slate-800 pb-4">Thế giới: {char.world_type}</p>
        <div className="space-y-6 flex-1">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase font-sans mb-1">Cảnh giới</p>
            <p className="text-xl font-bold text-yellow-500 italic">Cấp {char.level}</p>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 uppercase font-sans mb-2"><span>Huyết khí</span><span>{char.hp}/100</span></div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-orange-500 h-full transition-all duration-1000" style={{ width: `${char.hp}%` }}></div>
            </div>
          </div>
          <div className="pt-4">
            <p className="text-[10px] text-slate-500 uppercase font-sans mb-3 tracking-widest">Thiên phú khởi đầu</p>
            <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-purple-300 text-sm italic shadow-[0_0_15px_rgba(168,85,247,0.1)]">✨ {char.talent}</div>
          </div>
        </div>
      </div>

      {/* Main Story Area */}
      <div className="flex-1 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-12 lg:p-20 space-y-16 custom-scrollbar">
          {history.map((log, i) => (
            <div key={i} className="max-w-3xl mx-auto group animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex items-center gap-4 mb-10 opacity-40 group-hover:opacity-100">
                 <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-700"></span>
                 <span className="text-[10px] uppercase tracking-[0.3em] font-sans text-slate-400">Chương {i + 1}</span>
                 <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-700"></span>
              </div>
              {log.choice_made && i > 0 && <div className="mb-8 flex justify-center"><span className="px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs text-purple-400 italic">Quyết định: {log.choice_made}</span></div>}
              <p className="text-lg md:text-xl leading-[2] text-slate-200 first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-purple-500 whitespace-pre-wrap">{log.content}</p>
            </div>
          ))}

          {/* Nội dung đang stream */}
          {isAiTyping && (
            <div className="max-w-3xl mx-auto mb-20 animate-in fade-in">
               <div className="flex items-center gap-4 mb-10 opacity-40">
                 <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-purple-900"></span>
                 <span className="text-[10px] uppercase tracking-[0.3em] font-sans text-purple-400 animate-pulse">Đang sáng tác...</span>
                 <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-purple-900"></span>
              </div>
              <p className="text-lg md:text-xl leading-[2] text-slate-200 whitespace-pre-wrap border-l-2 border-purple-500/30 pl-6">{streamingContent}<span className="inline-block w-2 h-5 bg-purple-500 ml-1 animate-pulse">|</span></p>
            </div>
          )}
        </div>
        
        {/* Input & Options Area */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-10">
          <div className="max-w-3xl mx-auto">
            {/* 3 Nút lựa chọn */}
            {currentOptions.length > 0 && !isAiTyping && (
              <div className="flex flex-wrap gap-3 mb-6 animate-in slide-in-from-bottom-4">
                {currentOptions.map((opt, idx) => (
                  <button key={idx} onClick={() => handleSend(opt)} className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/40 hover:border-purple-500 hover:bg-purple-950/50 px-5 py-2.5 rounded-2xl text-sm text-slate-200 transition-all shadow-lg flex-1 min-w-[200px] text-left">
                    <span className="text-purple-500 font-bold mr-2">{idx + 1}.</span> {opt}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-4 bg-slate-900/80 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-800 shadow-2xl focus-within:border-purple-500/50 transition-all">
              <input 
                value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isAiTyping} className="flex-1 bg-transparent px-6 py-4 rounded-2xl outline-none text-slate-200 placeholder:text-slate-600 font-sans"
                placeholder={isAiTyping ? "Vui lòng đợi chương mới..." : "Nhập hành động của bạn..."}
              />
              <button onClick={() => handleSend()} disabled={isAiTyping || !input} className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white px-8 rounded-[1.5rem] font-black transition-all active:scale-95">GỬI ➔</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
