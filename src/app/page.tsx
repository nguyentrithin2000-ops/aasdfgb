"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [world, setWorld] = useState("Tu Tiên");
  const [talent, setTalent] = useState("");
  const [loading, setLoading] = useState(false);

  const quayGacha = () => {
    const list = ["Hỏa Hệ Thiên Linh Căn", "Mắt Âm Dương", "Hệ Thống Buff", "Cơ Thể Bất Tử"];
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
      <h1 className="text-3xl font-bold text-purple-400 mb-6 tracking-tighter">KHỞI TẠO NGHỊCH THIÊN</h1>
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-md">
        <input 
          placeholder="Tên của bạn..." 
          className="w-full p-3 rounded bg-slate-800 mb-4 outline-none border border-transparent focus:border-purple-500 text-white"
          onChange={e => setName(e.target.value)}
        />
        <select className="w-full p-3 rounded bg-slate-800 mb-4 text-white" onChange={e => setWorld(e.target.value)}>
          <option value="Tu Tiên">Xuyên Không Tu Tiên</option>
          <option value="Linh Dị">Linh Dị Sinh Tồn</option>
          <option value="Đô Thị">Đô Thị Tình Ái</option>
        </select>
        <button onClick={quayGacha} className="w-full py-2 bg-amber-600 rounded-lg mb-4 hover:bg-amber-500 transition font-bold">
          QUAY GACHA THIÊN PHÚ
        </button>
        {talent && <p className="text-center text-yellow-400 font-bold mb-4">✨ {talent} ✨</p>}
        <button 
          onClick={batDau} 
          disabled={loading}
          className="w-full py-4 bg-purple-600 rounded-xl font-black text-xl hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition disabled:bg-gray-600"
        >
          {loading ? "ĐANG KHỞI TẠO..." : "BẮT ĐẦU HÀNH TRÌNH"}
        </button>
      </div>
    </div>
  );
}
