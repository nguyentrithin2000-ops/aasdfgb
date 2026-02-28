"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [world, setWorld] = useState("Tu Tiên");
  const [talent, setTalent] = useState("");
  const [loading, setLoading] = useState(false);
  const [oldChars, setOldChars] = useState<any[]>([]);

  // 1. Lấy danh sách các câu chuyện (nhân vật) đã tạo trước đó
  useEffect(() => {
    const fetchOldChars = async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setOldChars(data);
    };
    fetchOldChars();
  }, []);

  const quayGacha = () => {
    const list = ["Hỏa Hệ Thiên Linh Căn", "Mắt Âm Dương", "Hệ Thống Buff", "Cơ Thể Bất Tử", "Chí Tôn Cốt", "Kiếm Thai Tiên Thiên"];
    setTalent(list[Math.floor(Math.random() * list.length)]);
  };

  const batDau = async () => {
    if (!name || !talent) return alert("Nhập tên và Quay Gacha đã!");
    setLoading(true);
    
    const { data, error } = await supabase
      .from('characters')
      .insert([{ 
        name, 
        world_type: world, 
        talent, 
        hp: 100, 
        level: 1 
      }])
      .select();

    if (error) {
      alert("Lỗi lưu DB: " + error.message);
      setLoading(false);
      return;
    }
    if (data) router.push(`/play/${data[0].id}`);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-950 text-white p-4 py-12">
      <h1 className="text-4xl font-black text-purple-400 mb-8 tracking-tighter italic">KHỞI TẠO NGHỊCH THIÊN</h1>
      
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        
        {/* CỘT TRÁI: TẠO NHÂN VẬT MỚI */}
        <div className="flex-1 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-slate-300 border-l-4 border-purple-500 pl-3">KHỞI TẠO MỚI</h2>
          <input 
            placeholder="Tên của bạn..." 
            className="w-full p-4 rounded-xl bg-slate-800 mb-4 outline-none border border-transparent focus:border-purple-500 text-white transition-all"
            onChange={e => setName(e.target.value)}
          />
          <select 
            className="w-full p-4 rounded-xl bg-slate-800 mb-4 text-white border border-transparent outline-none focus:border-purple-500" 
            onChange={e => setWorld(e.target.value)}
          >
            <option value="Tu Tiên">Xuyên Không Tu Tiên</option>
            <option value="Linh Dị">Linh Dị Sinh Tồn</option>
            <option value="Đô Thị">Đô Thị Tình Ái</option>
            <option value="Khoa Huyễn">Hệ Thống Tương Lai</option>
          </select>
          
          <button onClick={quayGacha} className="w-full py-3 bg-amber-600 rounded-xl mb-4 hover:bg-amber-500 transition font-bold shadow-lg shadow-amber-900/20">
            QUAY GACHA THIÊN PHÚ
          </button>
          
          {talent && (
            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-dashed border-yellow-500/50 mb-4 animate-bounce">
              <p className="text-yellow-400 font-black">✨ {talent} ✨</p>
            </div>
          )}
          
          <button 
            onClick={batDau} 
            disabled={loading}
            className="w-full py-5 bg-purple-600 rounded-2xl font-black text-xl hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all active:scale-95 disabled:bg-gray-600"
          >
            {loading ? "ĐANG NHẬP HỒN..." : "BẮT ĐẦU HÀNH TRÌNH"}
          </button>
        </div>

        {/* CỘT PHẢI: DANH SÁCH CÂU CHUYỆN CŨ */}
        <div className="flex-1 bg-slate-900/50 p-8 rounded-2xl border border-slate-800 max-h-[600px] overflow-y-auto custom-scrollbar">
          <h2 className="text-xl font-bold mb-6 text-slate-300 border-l-4 border-blue-500 pl-3">HÀNH TRÌNH ĐÃ LƯU</h2>
          
          {oldChars.length === 0 ? (
            <p className="text-slate-500 italic text-center py-10">Chưa có dấu chân người tiền nhiệm...</p>
          ) : (
            <div className="grid gap-4">
              {oldChars.map((char) => (
                <div 
                  key={char.id}
                  onClick={() => router.push(`/play/${char.id}`)}
                  className="group relative p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer transition-all hover:border-purple-500/50 shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-lg text-slate-100 group-hover:text-purple-400 transition-colors">{char.name}</h3>
                      <p className="text-xs text-slate-400 uppercase tracking-widest">{char.world_type}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500 font-mono">
                      Cấp {char.level}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-2 py-1 bg-slate-900 text-[10px] text-yellow-500 rounded border border-yellow-500/20">
                      {char.talent}
                    </span>
                  </div>
                  <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500 font-bold text-sm">
                    Tiếp tục →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
