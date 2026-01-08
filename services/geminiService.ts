import { GoogleGenerativeAI } from "@google/generative-ai";

export interface MungerResponse {
  advice: string; // 对应 App.tsx 里的字段名
  models: any[];  // 对应 App.tsx 里的字段名
  lollapalooza: string;
  inversion: string;
}

const MUNGER_SYSTEM_INSTRUCTION = `你现在扮演查理·芒格。你的回答必须极其深刻、尖锐且富有智慧。
请务必按照以下 Markdown 格式输出：
1. 你的核心回答（Deep Advice）。
2. 在回答最后，附上一个 JSON 代码块，包含以下三个字段：
   - "advice": "你的完整核心建议文本"
   - "models": [{"name": "模型名", "description": "简短解释"}] (列出用到的思维模型，最多3个)
   - "lollapalooza": "描述几种因素如何叠加产生巨大效应"
   - "inversion": "逆向思维建议：如果想失败，应该怎么做"
`;

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key 缺失");

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const fullPrompt = `${MUNGER_SYSTEM_INSTRUCTION}\n\n用户问题：${userInput}`;

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    // 尝试解析 JSON
    try {
      const jsonMatch = text.match(/```json([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
      // 如果没有 JSON，尝试手动构造
      return {
        advice: text,
        models: [{ name: "理性决策", description: "基于概率的独立思考" }],
        lollapalooza: "当无知与贪婪叠加时，毁灭是必然的。",
        inversion: "如果你想亏钱，就去追逐你看不懂的热点。"
      };
    } catch (e) {
      console.error("JSON Parse Error", e);
      return {
        advice: text,
        models: [],
        lollapalooza: "系统分析中...",
        inversion: "反过来想，总是反过来想。"
      };
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
