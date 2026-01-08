
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { MungerResponse } from "../types";

export const exportToPDF = async (query: string, data: MungerResponse) => {
  // Create a temporary element for rendering the report
  const element = document.createElement("div");
  element.style.position = "absolute";
  element.style.left = "-9999px";
  element.style.top = "0";
  element.style.width = "800px";
  element.style.padding = "40px";
  element.style.backgroundColor = "#ffffff";
  element.style.color = "#1e293b";
  element.className = "serif";
  
  const date = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  element.innerHTML = `
    <div style="border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: baseline;">
      <div>
        <h1 style="color: #059669; margin: 0; font-size: 24px;">Munger's Mind Oracle Report</h1>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">查理·芒格智慧助手 - 分析报告</p>
      </div>
      <span style="font-size: 12px; color: #64748b;">报告日期: ${date}</span>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">分析题目 (Query)</h2>
      <p style="font-size: 18px; font-weight: bold; margin: 0; color: #0f172a; border-left: 4px solid #e2e8f0; padding-left: 15px;">“${query}”</p>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 15px;">选中的思维模型格栅 (Selected Lattice Models)</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        ${data.models.map(m => `
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background-color: #f8fafc;">
            <h4 style="color: #059669; margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">${m.name}</h4>
            <p style="font-size: 12px; line-height: 1.5; color: #475569; margin: 0;">${m.explanation}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 15px;">查理的深度判断 (Munger's Advice)</h2>
      <p style="font-size: 15px; line-height: 1.8; color: #1e293b; white-space: pre-wrap;">${data.advice}</p>
    </div>

    <div style="margin-bottom: 30px; background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 0 8px 8px 0;">
      <h3 style="color: #059669; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">Lollapalooza 综合效应</h3>
      <p style="font-size: 13px; line-height: 1.6; color: #065f46; font-style: italic; margin: 0;">${data.lollapalooza}</p>
    </div>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px;">
      <h3 style="color: #dc2626; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">逆向思维建议 (Inversion: What NOT to do)</h3>
      <p style="font-size: 13px; line-height: 1.6; color: #991b1b; margin: 0;">${data.inversion}</p>
    </div>

    <div style="margin-top: 50px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
      <p style="font-size: 10px; color: #94a3b8; font-style: italic;">“反过来想，总是反过来想。” —— 查理·芒格</p>
    </div>
  `;

  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
      windowWidth: 800,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width / 2, canvas.height / 2],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`Munger_Wisdom_Report.pdf`);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("导出分析报告失败，请稍后重试。");
  } finally {
    document.body.removeChild(element);
  }
};
