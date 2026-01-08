import { GoogleGenerativeAI } from "@google/generative-ai";

const MUNGER_SYSTEM_INSTRUCTION = `你现在扮演查理·芒格。你的回答必须深刻且排版极其工整。
请严格遵守以下 Markdown 输出规范：
1. 模块标题：统一使用 ## 加粗标题（如 ## 思维模型格栅）。
2. 表格规范：表格仅用于展示模型、描述、应用这三列。内容要简练，不要在单元格内写长篇大论，防止 PDF 渲染时挤压变形。
3. 深度建议：使用 1., 2., 3. 数字列表。
4. 金句：使用 > 引用块。
5. 字体：不要在正文里乱用加粗，保持页面清爽。`;

export const getMungerAdvice = async (userInput: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const fullPrompt = `${MUNGER_SYSTEM_INSTRUCTION}\n\n用户问题：${userInput}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return {
      content: response.text(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { content: "系统思维格栅暂时离线。", timestamp: new Date().toISOString() };
  }
};
