import { GoogleGenerativeAI } from "@google/generative-ai";

// 对应你 App.tsx 需要的数据结构
export interface MungerResponse {
  advice: string;       // 查理的核心建议
  models: any[];        // 涉及的思维模型列表
  lollapalooza: string; // 综合效应分析
  inversion: string;    // 逆向思维建议
}

const MUNGER_SYSTEM_INSTRUCTION = `你现在扮演查理·芒格。你的回答必须极其深刻、尖锐且富有智慧。
请务必返回一个纯 JSON 格式的回复，不要包含 markdown 标记（如 \`\`\`json），必须包含以下字段：
{
  "advice": "你的核心回答，像芒格一样犀利，直击要害。",
  "models": [
    {"symbol": "In", "name": "激励机制", "brief": "描述这个模型如何应用在用户的问题中"}
  ],
  "lollapalooza": "描述多种因素如何叠加产生了现在的后果。",
  "inversion": "反过来想：如果想把事情彻底搞砸，应该怎么做？"
}
`;

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key 缺失");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 使用 Gemini 2.0 Flash 获得最佳速度和 JSON 能力
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" } // 强制返回 JSON
    });

    const fullPrompt = `${MUNGER_SYSTEM_INSTRUCTION}\n\n用户问题：${userInput}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // 解析 JSON
    const data = JSON.parse(text);
    return data;

  } catch (error) {
    console.error("Gemini Error:", error);
    // 发生错误时的兜底数据，防止白屏
    return {
      advice: "查理现在不想说话。大概是系统电路里掺杂了太多的废话。请稍后再试。",
      models: [],
      lollapalooza: "系统连接中断。",
      inversion: "检查你的网络连接。"
    };
  }
};
