import { GoogleGenerativeAI } from "@google/generative-ai";

export interface MungerResponse {
  content: string;
  timestamp: string;
}

// 芒格人设指令：强制 AI 返回结构化的 Markdown
const MUNGER_SYSTEM_INSTRUCTION = `你现在扮演查理·芒格。你的回答必须极其深刻、尖锐且富有智慧。
请务必按照以下 Markdown 格式输出：
1. 使用二级标题 ## 表示模块（如：## 思维模型格栅）。
2. 使用表格展现模型分析。
3. 使用 ## 查理的深度判断 提供最终建议。
4. 使用 ## 逆向思维建议 提供反向警告。`;

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key 缺失");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const fullPrompt = `${MUNGER_SYSTEM_INSTRUCTION}\n\n用户的问题：${userInput}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: text || "查理正在沉思，请稍后再试。",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      content: "系统故障。大概是电路里掺杂了太多的废话。请检查网络并重试。",
      timestamp: new Date().toISOString()
    };
  }
};
