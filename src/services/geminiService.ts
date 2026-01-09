import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ModelEntry {
  symbol: string;
  name: string;
  category: string;
  brief: string; 
  founder?: string;
}

export interface MungerResponse {
  advice: string;
  models: ModelEntry[];
  lollapalooza: string;
  inversion: string;
}

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" } 
  });

  // 🚀 核心升级：深度芒格 Prompt
  const prompt = `
  你现在是查理·芒格（Charlie Munger）。你的任务是利用“普世智慧的思维格栅（Lattice of Mental Models）”来深度解剖用户的问题。
  
  ⚠️ 思考要求：
  1. **极度理性与深度**：不要给肤浅的鸡汤，要给残酷的真相。分析二阶、三阶后果。
  2. **跨学科格栅**：必须调用 4 到 6 个不同学科（心理学、经济学、物理学、生物学、工程学）的思维模型。
  3. **模型完整性**：每个模型必须解释其在当前问题中的具体运作机制。
  
  请严格返回以下 JSON 格式：
  {
    "advice": "这里写你的核心建议，语气要像芒格一样犀利、简洁、充满智慧。不少于 200 字。",
    "models": [
      {
        "name": "模型名称 (如：机会成本/复利效应/社会认同)",
        "category": "学科分类 (如：经济学/数学/心理学)",
        "symbol": "2个字母缩写 (如: Oc, Cp, Sp)",
        "brief": "详细解释该模型如何解释用户的问题，以及如何应用。不要写空话，要结合场景分析。（不少于 80 字）"
      }
    ],
    "lollapalooza": "详细分析这里出现了哪些模型的叠加效应（Lollapalooza Effect），导致了极端的后果（好或坏）。",
    "inversion": "逆向思维：如果用户想彻底失败，他应该怎么做？列出具体的‘反向清单’。"
  }`;

  try {
    const result = await model.generateContent(`${prompt}\n\n用户困惑：${userInput}`);
    const text = result.response.text();
    const data = JSON.parse(text);

    // 🛡️ 数据清洗：防止字段丢失
    if (data.models && Array.isArray(data.models)) {
      data.models = data.models.map((m: any) => ({
        ...m,
        brief: m.brief || m.description || m.explanation || "查理正在深度调动格栅分析...",
        symbol: m.symbol || m.name?.substring(0, 2).toUpperCase() || "Mm"
      }));
    }

    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      advice: "查理·芒格正在深度思考中，由于连接波动，请稍后再试...",
      models: [],
      lollapalooza: "分析暂停",
      inversion: "分析暂停"
    };
  }
};
