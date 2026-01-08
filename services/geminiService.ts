import { GoogleGenerativeAI } from "@google/generative-ai";
import { MungerResponse } from "../types";
import { MUNGER_SYSTEM_INSTRUCTION } from "../constants";

// 获取 API Key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      systemInstruction: MUNGER_SYSTEM_INSTRUCTION 
    });

    const result = await model.generateContent(userInput);
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
