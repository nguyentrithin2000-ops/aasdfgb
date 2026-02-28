"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";



export default function GameScreen({ params }: { params: { id: string } }) {
  const [char, setChar] = useState<any>(null);
  const [story, setStory] = useState<string[]>(["Đang tải hành trình..."]);
  const [input, setInput] = useState("");

  // Load dữ liệu nhân vật vĩnh viễn từ Supabase
  useEffect(() => {
    const loadChar = async () => {
      const { data } = await supabase.from('characters').select('*').eq('id', params.id).single();
      setChar(data);
      setStory([`Chào mừng ${data.name} đến với thế giới ${data.world_type}. Thiên phú ${data.talent} đang tỏa sáng...`]);
    };
    loadChar();
  }, [params.id]);

  const handleAction = async () => {
    // 1. Gửi input cho AI (giả lập ở đây, bạn sẽ gọi API OpenAI/Gemini tại đây)
    const newScene = `Bạn vừa thực hiện: ${input}. AI đang tính toán kết quả...`;
    
    // 2. Cập nhật Log vào Database
    await supabase.from('story_logs').insert([{ character_id: params.id, content: newScene, choice_made: input }]);
    
    // 3. Cập nhật UI
    setStory(prev => [...prev, `> ${input}`, newScene]);
    setInput("");
    
    // 4. Ví dụ cập nhật Tu vi (Level) tự động lên Database
    await supabase.from('characters').update({ level: char.level + 1 }).eq('id', params.id);
  };

  if (!char) return <div className="text-white text-center mt-20">Đang khởi tạo linh căn...</div>;

  return (
    <div className="flex h-screen bg-black text-gray-300">
      {/* Sidebar: Trạng thái nhân vật */}
      <div className="w-1/4 border-r border-gray-800 p-4 bg-gray-900">
        <h2 className="text-xl font-bold text-yellow-500">{char.name}</h2>
        <p>Thế giới: {char.world_type}</p>
        <p className="text-green-400">Tu vi: Cấp {char.level}</p>
        <div className="mt-4 bg-gray-800 h-4 rounded-full overflow-hidden">
          <div className="bg-red-600 h-full" style={{ width: `${char.hp}%` }}></div>
        </div>
        <p className="text-xs mt-1">Huyết khí: {char.hp}/100</p>
      </div>

      {/* Main Game Console */}
      <div className="w-3/4 flex flex-col p-6">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {story.map((s, i) => (
            <p key={i} className={s.startsWith('>') ? "text-blue-400" : "text-white"}>{s}</p>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-gray-800 p-4 rounded border border-gray-700 focus:outline-none focus:border-purple-500" 
            placeholder="Gõ hành động của bạn (VD: Đi vào hang động)..." 
          />
          <button onClick={handleAction} className="bg-purple-600 px-8 rounded font-bold hover:bg-purple-500">GỬI</button>
        </div>
      </div>
    </div>
  );
}
