import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ModelEntry {
  id: number;
  symbol: string;
  name: string;
  category: string;
  founder: string;
  brief: string; // 前端卡片显示的核心字段
}

export interface MungerResponse {
  advice: string;
  models: ModelEntry[];
  lollapalooza: string;
  inversion: string;
}

const MUNGER_SYSTEM_INSTRUCTION = `你现在扮演查理·芒格。
你的任务是：针对用户的问题，提供极其深刻的决策建议，并调用思维模型格栅进行分析。

【必须返回纯 JSON 格式，严禁 Markdown 标记】
结构如下：
{
  "advice": "核心建议（犀利、直击要害，300字左右）",
  "models": [
    {
      "id": 1, 
      "symbol": "In", 
      "name": "激励机制", 
      "category": "Psychology", 
      "founder": "Munger", 
      "brief": "这里必须填写！用一句话解释为什么这个模型适用于当前问题。（例如：因为销售员的提成机制导致了他们的不当行为。）" 
    }
  ],
  "lollapalooza": "描述多种因素如何叠加产生后果",
  "inversion": "反向思考建议"
}

重要约束：
1. models 数组至少包含 2 个最相关的模型。
2. "brief" 字段绝不能留空！必须结合用户问题具体分析。
3. "symbol" 必须是两个字母（如 'In', 'So', 'Oc'）。
`;

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key 缺失");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" } 
    });

    const fullPrompt = `${MUNGER_SYSTEM_INSTRUCTION}\n\n用户问题：${userInput}`;
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // 容错处理
      const match = text.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : { advice: text, models: [] };
    }

    // 🛡️ 数据清洗兜底（防止空白卡片）
    if (data.models && Array.isArray(data.models)) {
      data.models = data.models.map((m: any, idx: number) => ({
        id: m.id || idx,
        symbol: m.symbol || 'Mj',
        name: m.name || '思维模型',
        category: m.category || 'General',
        founder: m.founder || 'Munger',
        // 如果 AI 没吐出 brief，强制填入默认文案
        brief: m.brief || m.description || "查理正在审视该模型在当前局势下的具体应用威力..." 
      }));
    }

    return data;

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      advice: "思维格栅暂时断开连接。请检查网络。",
      models: [],
      lollapalooza: "无法分析",
      inversion: "无法分析"
    };
  }
};
