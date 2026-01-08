import { GoogleGenerativeAI } from "@google/generative-ai";
import { MungerResponse } from "../types";
import { MUNGER_SYSTEM_INSTRUCTION } from "../constants";

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key 缺失");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 强制使用最新的 2.0 版本
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 将指令与用户输入拼接发送
    const fullPrompt = `${MUNGER_SYSTEM_INSTRUCTION}\n\n用户的问题是：${userInput}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // 必须返回包含 content 的对象，否则前端 UI 会崩溃
    return {
      content: text || "查理·芒格正在思考中...",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
