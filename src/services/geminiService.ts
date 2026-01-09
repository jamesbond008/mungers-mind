import { GoogleGenerativeAI } from "@google/generative-ai";

// 对应你 models.ts 的接口定义
export interface ModelEntry {
  id: number;
  symbol: string;
  name: string;
  category: string;
  founder: string;
  brief: string; // ⚠️ 前端卡片最关键的字段
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
请严格按照此 JSON 结构返回：
{
  "advice": "核心建议（犀利、直击要害，300字左右）",
  "models": [
    {
      "symbol": "In", 
      "name": "激励机制", 
      "category": "Psychology", 
      "founder": "Munger", 
      "brief": "这里必须填写！用一句话解释为什么这个模型适用于当前问题。" 
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
    
    console.log("Gemini Raw:", text); // 调试用

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // 暴力清洗：有时候 AI 会在 JSON 前后加 ```json
      const match = text.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : { advice: text, models: [] };
    }

    // 🛡️ 强力数据清洗 (Data Sanitization)
    // 这是修复“空白卡片”的核心逻辑
    if (data.models && Array.isArray(data.models)) {
      data.models = data.models.map((m: any, idx: number) => {
        // 1. 尝试获取 brief，如果没有，尝试 description，再没有就用 name 兜底
        let finalBrief = m.brief || m.description || m.explanation || `查理·芒格正在分析 ${m.name || '此模型'} 的具体应用...`;
        
        // 2. 确保 symbol 存在，否则样式会乱
        let finalSymbol = m.symbol || (m.name ? m.name.substring(0, 2).toUpperCase() : "Mj");

        // 3. 确保 category 存在
        let finalCategory = m.category || "General";

        return {
          id: m.id || Date.now() + idx,
          symbol: finalSymbol,
          name: m.name || '未命名模型',
          category: finalCategory,
          founder: m.founder || 'Charlie Munger',
          brief: finalBrief // 确保这个字段永远有值
        };
      });
    } else {
      data.models = [];
    }

    // 确保其他字段也不为空
    return {
      advice: data.advice || "查理正在思考...",
      models: data.models,
      lollapalooza: data.lollapalooza || "多重因素叠加效应分析中...",
      inversion: data.inversion || "反过来想，总是反过来想。"
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      advice: "思维格栅暂时断开连接。请检查网络或稍后再试。",
      models: [], // 返回空数组，前端就不会渲染空白卡片了
      lollapalooza: "无法分析",
      inversion: "无法分析"
    };
  }
};
