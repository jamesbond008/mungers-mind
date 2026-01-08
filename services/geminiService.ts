import { GoogleGenerativeAI } from "@google/generative-ai";
import { MungerResponse } from "../types";
import { MUNGER_SYSTEM_INSTRUCTION } from "../constants";

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key 缺失，请检查 Vercel 环境变量配置");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 强制指定使用最新的 2.0 版本
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 将芒格的人设指令和用户的提问拼接在一起
    const fullPrompt = `${MUNGER_SYSTEM_INSTRUCTION}\n\n用户当前的问题：${userInput}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // 确保返回的格式包含 content 字段，防止前端读取失败
    return {
      content: text || "查理·芒格正在沉思，请稍后再试。",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Gemini 2.0 调用失败:", error);
    return {
      content: "由于网络波动，智慧暂时掉线。请确认你的网络环境并重试。",
      timestamp: new Date().toISOString()
    };
  }
};
