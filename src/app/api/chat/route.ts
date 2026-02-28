import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

// Khởi tạo Gemini với Key bắt đầu bằng AIzaSy...
const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY || ""); 

export async function POST(req: Request) {
  try {
    const { prompt, character, history } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `Bạn là một đại tác giả viết truyện mạng chuyên nghiệp.
      Bối cảnh: ${character.world_type}. Nhân vật: ${character.name}. Thiên phú: ${character.talent}.
      NHIỆM VỤ:
      1. Viết tiếp CHƯƠNG TRUYỆN mới dựa trên hành động: "${prompt}" (ít nhất 1000 chữ).
      2. Cấu trúc: 
         - ** [TÊN CHƯƠNG] **
         - Nội dung chương truyện dài.
         - Kết thúc bằng 3 lựa chọn: [1]..., [2]..., [3]...`;

    // Chuyển đổi lịch sử cho chuẩn Gemini
    const chat = model.startChat({
      history: history.map((h: any) => ({
        role: "user",
        parts: [{ text: h.choice_made }],
      })).concat(history.map((h: any) => ({
        role: "model",
        parts: [{ text: h.content }],
      }))),
    });

    const result = await chat.sendMessageStream(systemPrompt + "\n\nLựa chọn của tôi: " + prompt);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of result.stream) {
          controller.enqueue(encoder.encode(chunk.text()));
        }
        controller.close();
      },
    });

    return new Response(stream);

  } catch (error: any) {
    console.error("Lỗi Gemini:", error);
    return NextResponse.json({ error: "Lỗi kết nối AI" }, { status: 500 });
  }
}
