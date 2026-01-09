import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ModelEntry {
  id: number;
  symbol: string;
  name: string;
  category: string;
  founder: string;
  brief: string; 
}

export interface MungerResponse {
  advice: string;
  models: ModelEntry[];
  lollapalooza: string;
  inversion: string;
}

const MUNGER_SYSTEM_INSTRUCTION = `你现在扮演查理·芒格。
你的任务是针对用户问题，提供极其深刻的建议并调用思维模型分析。
必须返回纯 JSON 格式：
{
  "advice": "建议内容",
  "models": [
    { "symbol": "In", "name": "激励机制", "category": "心理学", "founder": "芒格", "brief": "此处必须填写该模型的具体应用分析" }
  ],
  "lollapalooza": "叠加效应分析",
  "inversion": "逆向思考建议"
}`;

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" } 
    });

    const result = await model.generateContent(`${MUNGER_SYSTEM_INSTRUCTION}\n\n用户问题：${userInput}`);
    const text = result.response.text();
    let data = JSON.parse(text);

    // 🛡️ 核心修复：强力清洗模型数据，解决内容空白问题
    if (data.models && Array.isArray(data.models)) {
      data.models = data.models.map((m: any, idx: number) => ({
        id: m.id || Date.now() + idx,
        symbol: m.symbol || (m.name ? m.name.substring(0, 2).toUpperCase() : "Mj"),
        name: m.name || '核心模型',
        category: m.category || "General",
        founder: m.founder || 'Munger',
        // 关键点：强制将 AI 可能返回的各种描述字段汇总到 brief 字段
        brief: m.brief || m.description || m.explanation || "正在利用格栅思维分析该模型在当前局势下的具体应用..."
      }));
    }

    return {
      advice: data.advice || "查理正在思考中...",
      models: data.models || [],
      lollapalooza: data.lollapalooza || "暂无叠加效应分析",
      inversion: data.inversion || "反过来想，总是反过来想。"
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      advice: "思维格栅连接暂时中断，请重试。",
      models: [],
      lollapalooza: "分析失败",
      inversion: "分析失败"
    };
  }
};
