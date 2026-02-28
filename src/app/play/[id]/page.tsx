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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isAiTyping]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      // 1. Lấy thông tin nhân vật
      const { data: charData } = await supabase.from('characters').select('*').eq('id', id).single();
      if (!charData) {
        alert("Nhân vật không tồn tại!");
        router.push("/");
        return;
      }
      setChar(charData);

      // 2. Lấy lịch sử truyện
      const { data: logs } = await supabase
        .from('story_logs')
        .select('*')
        .eq('character_id', id)
        .order('created_at', { ascending: true });
      
      if (logs && logs.length > 0) {
        setHistory(logs);
      } else {
        // Nếu chưa có lịch sử, tự động gọi AI viết chương mở đầu
        generateAiResponse("Bắt đầu hành trình khởi đầu đại nghiệp.", charData, []);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const generateAiResponse = async (userChoice: string, character: any, currentHistory: any[]) => {
    setIsAiTyping(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userChoice,
          character: character,
          history: currentHistory.slice(-5) // Gửi 5 chương gần nhất để AI nhớ ngữ cảnh
        }),
      });

      const data = await response.json();
      const aiContent = data.content;

      // Lưu vào Database
      const { error } = await supabase.from('story_logs').insert([
        { character_id: id, content: aiContent, choice_made: userChoice }
      ]);

      if (!error) {
        setHistory(prev => [...prev, { choice_made: userChoice, content: aiContent }]);
      }
    } catch (err) {
      console.error("Lỗi AI:", err);
      alert("Thiên cơ bị nhiễu loạn (Lỗi AI), hãy thử lại!");
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input || !id || isAiTyping) return;
    const userChoice = input;
    setInput("");
    await generateAiResponse(userChoice, char, history);
  };

  if (loading) return (
    <div className="bg-slate-950 text-white h-screen flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="animate-pulse font-serif italic text-purple-300">Đang nhập hồn vào thế giới...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-serif">
      {/* Sidebar Chỉ số (Bên trái) */}
      <div className="w-72 border-r border-slate-800 p-6 bg-slate-900/50 hidden lg:flex flex-col">
        <button 
          onClick={() => router.push("/")}
          className="text-slate-500 hover:text-white mb-8 text-sm flex items-center gap-2 transition"
        >
          ← Trở về sảnh chờ
        </button>

        <h2 className="text-3xl font-black text-purple-400 mb-1 leading-none tracking-tighter">{char.name}</h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-8 border-b border-slate-800 pb-4">
          Thế giới: {char.world_type}
        </p>

        <div className="space-y-6 flex-1">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase font-sans mb-1">Cảnh giới</p>
            <p className="text-xl font-bold text-yellow-500 italic">Cấp {char.level}</p>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-500 uppercase font-sans mb-2">
              <span>Huyết khí</span>
              <span>{char.hp}/100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-orange-500 h-full transition-all duration-1000" style={{ width: `${char.hp}%` }}></div>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-[10px] text-slate-500 uppercase font-sans mb-3 tracking-widest">Thiên phú khởi đầu</p>
            <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-purple-300 text-sm italic shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              ✨ {char.talent}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-600 text-center font-sans italic">
          Định mệnh đã an bài...
        </div>
      </div>

      {/* Giao diện Đọc truyện (Chính giữa) */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        
        {/* Vùng hiển thị nội dung chương truyện */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-12 lg:p-20 space-y-16 scroll-smooth custom-scrollbar"
        >
          {history.length === 0 && !isAiTyping && (
             <p className="text-center text-slate-600 italic">Đang khởi tạo chương đầu tiên...</p>
          )}

          {history.map((log, i) => (
            <div key={i} className="max-w-3xl mx-auto group animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex items-center gap-4 mb-10 opacity-40 group-hover:opacity-100 transition-opacity">
                 <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-700"></span>
                 <span className="text-[10px] uppercase tracking-[0.3em] font-sans text-slate-400">Chương {i + 1}</span>
                 <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-700"></span>
              </div>
              
              {log.choice_made && i > 0 && (
                <div className="mb-8 flex justify-center">
                   <span className="px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs text-purple-400 italic shadow-xl">
                     Quyết định: {log.choice_made}
                   </span>
                </div>
              )}
              
              <div className="prose prose-invert max-w-none">
                <p className="text-lg md:text-xl leading-[2] text-slate-200 first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-purple-500 whitespace-pre-wrap font-serif">
                  {log.content}
                </p>
              </div>
            </div>
          ))}

          {/* Hiệu ứng AI đang viết */}
          {isAiTyping && (
            <div className="max-w-3xl mx-auto flex flex-col items-center py-10">
              <div className="flex gap-1 mb-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              </div>
              <p className="text-xs text-slate-500 italic font-sans tracking-widest animate-pulse">
                AI ĐANG SÁNG TÁC CHƯƠNG TIẾP THEO...
              </p>
            </div>
          )}
        </div>
        
        {/* Thanh nhập liệu (Dưới cùng) */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-20">
          <div className="max-w-3xl mx-auto flex gap-4 bg-slate-900/80 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-800 shadow-2xl focus-within:border-purple-500/50 transition-all">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isAiTyping}
              className="flex-1 bg-transparent px-6 py-4 rounded-2xl outline-none text-slate-200 placeholder:text-slate-600 font-sans"
              placeholder={isAiTyping ? "Vui lòng đợi chương mới..." : "Nhập hành động của bạn hoặc chọn [1, 2, 3]..."}
            />
            <button 
              onClick={handleSend}
              disabled={isAiTyping || !input}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white px-8 rounded-[1.5rem] font-black transition-all active:scale-95 flex items-center justify-center group"
            >
              <span className="group-hover:translate-x-1 transition-transform">GỬI ➔</span>
            </button>
          </div>
          <p className="text-[9px] text-center text-slate-700 mt-4 uppercase tracking-[0.2em] font-sans">
            Mỗi lựa chọn sẽ thay đổi vĩnh viễn vận mệnh của bạn
          </p>
        </div>
      </div>
    </div>
  );
}
