import { GoogleGenerativeAI } from "@google/generative-ai";

export const getMungerAdvice = async (userInput: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" } 
  });

  const prompt = `你现在是查理·芒格。请分析用户问题，并严格返回以下 JSON 格式：
  {
    "advice": "你的深刻建议",
    "models": [
      {
        "name": "思维模型名称",
        "brief": "此处必须填写该模型在此情境下的具体应用分析（不少于50字）",
        "category": "模型类别",
        "symbol": "两个字母的缩写",
        "founder": "创始人"
      }
    ],
    "lollapalooza": "叠加效应分析",
    "inversion": "逆向思维建议"
  }`;

  const result = await model.generateContent(`${prompt}\n\n用户困惑：${userInput}`);
  const data = JSON.parse(result.response.text());

  // 🛡️ 核心修复：强制字段转换，确保 brief 字段永远有值
  if (data.models && Array.isArray(data.models)) {
    data.models = data.models.map((m: any) => ({
      ...m,
      // 兼容逻辑：即使 AI 返回了 description，也强制转为 brief
      brief: m.brief || m.description || m.explanation || "查理正在调动思维格栅进行深度分析..."
    }));
  }

  return data;
};
