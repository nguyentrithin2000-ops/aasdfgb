"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function Game() {
  const params = useParams();
  const id = params?.id as string;
  
  const [char, setChar] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      // 1. Lấy thông tin nhân vật
      const { data: charData } = await supabase.from('characters').select('*').eq('id', id).single();
      if (charData) setChar(charData);

      // 2. Lấy lịch sử truyện
      const { data: logs } = await supabase.from('story_logs').select('*').eq('character_id', id).order('created_at', { ascending: true });
      if (logs) setHistory(logs);
      
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleSend = async () => {
    if (!input || !id) return;
    
    const userChoice = input;
    setInput("");

    // Tạm thời tạo câu trả lời mẫu (Sau này bạn sẽ lắp API AI vào đây)
    const aiResponse = `Bạn chọn: "${userChoice}". Kết quả là hành trình của bạn tiếp tục đầy kịch tính...`;

    const { error } = await supabase.from('story_logs').insert([
      { character_id: id, content: aiResponse, choice_made: userChoice }
    ]);

    if (!error) {
      setHistory([...history, { choice_made: userChoice, content: aiResponse }]);
    }
  };

  if (loading) return <div className="bg-black text-white h-screen flex items-center justify-center">Đang nhập hồn...</div>;
  if (!char) return <div className="text-white p-10 text-center">Không tìm thấy nhân vật!</div>;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      {/* Sidebar Chỉ số */}
      <div className="w-64 border-r border-slate-800 p-6 bg-slate-900 hidden md:block">
        <h2 className="text-2xl font-black text-purple-400 mb-2">{char.name}</h2>
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-6">{char.world_type}</p>
        <div className="space-y-4">
          <div className="bg-slate-800 p-3 rounded-lg">
            <p className="text-xs text-slate-400 uppercase">Tu vi</p>
            <p className="text-xl font-bold text-yellow-500">Cấp {char.level}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Huyết khí</p>
            <div className="w-full bg-slate-800 h-2 rounded-full">
              <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${char.hp}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Story */}
      <div className="flex-1 flex flex-col p-4 md:p-8">
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          <p className="italic text-slate-500 text-center border-b border-slate-800 pb-4">
            Hành trình bắt đầu với thiên phú: <span className="text-yellow-500">{char.talent}</span>
          </p>
          {history.map((log, i) => (
            <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-purple-400 text-sm mb-1 font-bold">➔ {log.choice_made}</p>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <p className="text-lg leading-relaxed text-slate-100">{log.content}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex gap-3">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl focus:border-purple-500 outline-none transition"
            placeholder="Bạn sẽ làm gì tiếp theo?"
          />
          <button 
            onClick={handleSend}
            className="bg-purple-600 px-8 rounded-2xl font-bold hover:bg-purple-500 transition active:scale-95"
          >
            GỬI
          </button>
        </div>
      </div>
    </div>
  );
}
