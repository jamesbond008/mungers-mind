import { GoogleGenerativeAI } from "@google/generative-ai";
import { MungerResponse } from "../types";
import { MUNGER_SYSTEM_INSTRUCTION } from "../constants";

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  // 确保在函数执行时才读取 key
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("API Key 缺失！请检查 Vercel 环境变量配置。");
    throw new Error("API Key is missing");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 某些版本的 SDK 中 systemInstruction 需要放在单独的配置对象或作为内容的一部分
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // 建议尝试更稳定的 1.5-flash
    });

    // 更加稳妥的带指令发送方式
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: MUNGER_SYSTEM_INSTRUCTION }],
        },
        {
          role: "model",
          parts: [{ text: "明白了，我将以查理·芒格的身份为你提供建议。" }],
        },
      ],
    });

    const result = await chat.sendMessage(userInput);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    // 抛出错误以便 UI 层捕获并显示具体的错误原因
    throw error;
  }
};
