import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export const maxDuration = 80; // Tăng thời gian chờ lên 60s cho truyện dài

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt, character, history } = await req.json();

    if (!character || !prompt) {
      return NextResponse.json({ error: "Thiếu thông tin khởi tạo" }, { status: 400 });
    }

    const safeHistory = Array.isArray(history) ? history : [];
    const chatHistory = safeHistory.map((h: any) => ([
      { role: "user", content: h.choice_made || "" },
      { role: "assistant", content: h.content || "" }
    ])).flat();

    const systemPrompt = `Bạn là một đại tác giả viết truyện mạng chuyên nghiệp, phong cách hành văn lôi cuốn, kịch tính.
      Bối cảnh thế giới: ${character.world_type}. 
      Nhân vật chính: ${character.name}. 
      Thiên phú: ${character.talent}.

      NHIỆM VỤ CỦA BẠN:
      1. Viết tiếp một CHƯƠNG TRUYỆN mới dựa trên lựa chọn của người chơi: "${prompt}".
      2. Độ dài: Phải viết cực kỳ chi tiết, miêu tả sâu sắc nội tâm, khung cảnh và các tình tiết bất ngờ (ít nhất 1000 chữ).
      3. Cấu trúc bài viết BẮT BUỘC:
         - Bắt đầu bằng TIÊU ĐỀ CHƯƠNG (để trong dấu ** **).
         - Nội dung chương truyện dài, lôi cuốn.
         - Kết thúc chương bằng cách đưa ra đúng 3 LỰA CHỌN gợi ý theo định dạng:
           [1] - Nội dung lựa chọn 1
           [2] - Nội dung lựa chọn 2
           [3] - Nội dung lựa chọn 3`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", 
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      stream: true, // Bật chế độ Streaming
    });

    // Tạo luồng dữ liệu trả về cho Frontend
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    return new Response(stream);

  } catch (error: any) {
    console.error("Lỗi OpenAI API:", error);
    return NextResponse.json({ error: "Thiên cơ nhiễu loạn!" }, { status: 500 });
  }
}
