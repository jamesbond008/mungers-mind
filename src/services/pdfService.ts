import html2pdf from 'html2pdf.js';
import { MungerResponse } from './geminiService';

// 修改导出函数，使其接受 Element ID，这样能做到“所见即所得”的高清截图
export const exportToPDF = async (elementId: string, data?: MungerResponse) => {
  // 获取原本的 HTML 元素
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error("找不到要导出的报告元素:", elementId);
    return;
  }

  const opt = {
    margin: 0.2, // 窄边距
    filename: `Munger_Report_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 3, // 3倍缩放，保证文字极其清晰
      useCORS: true,
      scrollY: 0
    },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  await html2pdf().set(opt).from(element).save();
};
