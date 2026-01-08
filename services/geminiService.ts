import { GoogleGenerativeAI } from "@google/generative-ai";
import { MungerResponse } from "../types";
import { MUNGER_SYSTEM_INSTRUCTION } from "../constants";

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key 缺失，请检查 Vercel 环境变量");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 升级为最新的 2.0 模型
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 采用最稳妥的 Prompt 注入方式，确保人设和回答内容完整
    const fullPrompt = `${MUNGER_SYSTEM_INSTRUCTION}\n\n用户的问题：${userInput}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // 重要：返回结构必须包含 content，否则前端 React 组件会因为无法 .map() 而白屏
    return {
      content: text,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Gemini 2.0 Error:", error);
    throw error;
  }
};
