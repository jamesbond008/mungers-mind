import { GoogleGenerativeAI } from "@google/generative-ai";
import { MungerResponse } from "../types";
import { MUNGER_SYSTEM_INSTRUCTION } from "../constants";

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key 缺失");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 1. 更换为更稳定且免费额度高的模型
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. 采用兼容性更好的 prompt 拼接方式，确保“芒格”人设生效
    const prompt = `${MUNGER_SYSTEM_INSTRUCTION}\n\n用户问题：${userInput}`;

    const result = await model.generateContent(prompt);
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
