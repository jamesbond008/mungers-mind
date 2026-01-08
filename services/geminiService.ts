import { GoogleGenerativeAI } from "@google/generative-ai";
import { MungerResponse } from "../types";
import { MUNGER_SYSTEM_INSTRUCTION } from "../constants";

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  // 1. 确保环境变量名正确
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 2. 使用 2.0 版本，并确保模型名称字符串无误
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 3. 将指令和用户输入拼接，避免复杂的参数导致接口 404
    const prompt = `${MUNGER_SYSTEM_INSTRUCTION}\n\nUser Question: ${userInput}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 4. 核心修复：必须返回一个包含 content 字符串的对象
    // 前端界面依赖这个结构来更新列表，如果不返回 content，.map() 就会报错
    return {
      content: text || "查理·芒格正在思考中...", 
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Gemini Service Error:", error);
    // 即使出错也返回一个固定结构的错误信息，防止 UI 崩溃
    return {
      content: "系统故障。大概是电路里掺杂了太多的废话。请检查网络并重试。",
      timestamp: new Date().toISOString()
    };
  }
};
