import { GoogleGenerativeAI } from "@google/generative-ai";
import { MungerResponse } from "../types";
import { MUNGER_SYSTEM_INSTRUCTION } from "../constants";

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key 缺失");

  // 这里是关键：强制使用 v1beta 接口
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 强制指定模型为 gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 采用更稳妥的 prompt 注入方式
    const fullPrompt = `${MUNGER_SYSTEM_INSTRUCTION}\n\n用户的问题是：${userInput}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
