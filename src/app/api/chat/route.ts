import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// Khởi tạo OpenAI với Key từ Environment Variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt, character, history } = await req.json();

    // Cấu trúc ngữ cảnh để AI hiểu lịch sử truyện
    const chatHistory = history.map((h: any) => ([
      { role: "user", content: h.choice_made },
      { role: "assistant", content: h.content }
    ])).flat();

    const systemPrompt = ` Bạn là một đại tác giả viết truyện mạng chuyên nghiệp, phong cách hành văn lôi cuốn, kịch tính.
      Bối cảnh thế giới: ${character.world_type}. 
      Nhân vật chính: ${character.name}. 
      Thiên phú: ${character.talent}.

      NHIỆM VỤ CỦA BẠN:
      1. Viết tiếp một CHƯƠNG TRUYỆN mới dựa trên lựa chọn của người chơi: "${prompt}".
      2. Độ dài: Phải viết cực kỳ chi tiết, ít nhất 1000 chữ. Miêu tả sâu sắc nội tâm, khung cảnh và các tình tiết bất ngờ.
      3. Cấu trúc bài viết:
         - Bắt đầu bằng TIÊU ĐỀ CHƯƠNG (để trong dấu ** **).
         - Nội dung chương truyện dài.
         - Kết thúc chương bằng cách đưa ra 3 LỰA CHỌN gợi ý: [1], [2], [3] để người chơi quyết định vận mệnh tiếp theo.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Hoặc gpt-4 nếu bạn có quota
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2500, // Tăng token để AI viết được dài (1000 chữ ~ 1500-2000 tokens)
    });

    const aiContent = response.choices[0].message.content;

    return NextResponse.json({ content: aiContent });
  } catch (error: any) {
    console.error("Lỗi OpenAI API:", error);
    return NextResponse.json({ error: "Lỗi kết nối AI" }, { status: 500 });
  }
}
