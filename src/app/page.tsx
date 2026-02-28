"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [world, setWorld] = useState("Tu Tiên");
  const [talent, setTalent] = useState("");

  const rollTalent = () => {
    const list = ["Thiên Linh Căn", "Hệ Thống Buff", "Mắt Âm Dương", "Phàm Nhân"];
    setTalent(list[Math.floor(Math.random() * list.length)]);
  };

  const createGame = async () => {
    if (!name || !talent) return alert("Hãy nhập tên và quay Gacha!");
    
    const { data, error } = await supabase
      .from('characters')
      .insert([{ name, world_type: world, talent, hp: 100, level: 1 }])
      .select();

    if (data) router.push(`/play/${data[0].id}`);
  };

  return (
    <main className="flex flex-col items-center p-10 bg-black min-h-screen text-white">
      <h1 className="text-4xl font-bold text-purple-500 mb-8">THẾ GIỚI ẢO ẢNH</h1>
      <div className="bg-gray-900 p-6 rounded-lg border border-purple-900 w-full max-w-md">
        <input 
          className="w-full p-3 mb-4 bg-gray-800 rounded" 
          placeholder="Tên nhân vật..." 
          onChange={e => setName(e.target.value)} 
        />
        <select className="w-full p-3 mb-4 bg-gray-800" onChange={e => setWorld(e.target.value)}>
          <option>Tu Tiên</option>
          <option>Linh Dị</option>
          <option>Đô Thị</option>
        </select>
        <button onClick={rollTalent} className="w-full py-2 bg-yellow-600 mb-4 hover:bg-yellow-500">
          Quay Gacha Thiên Phú
        </button>
        {talent && <p className="text-center text-green-400 mb-4">Nhận được: {talent}</p>}
        <button onClick={createGame} className="w-full py-4 bg-purple-700 font-bold">BẮT ĐẦU</button>
      </div>
    </main>
  );
}
