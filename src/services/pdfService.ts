import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // 1. 捕获 DOM 为 Canvas
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true, // 允许跨域图片
      backgroundColor: '#020617', // 确保背景色为深色 (slate-950)
      logging: false
    });

    // 2. 计算 PDF 尺寸
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 宽度
    const pageHeight = 297; // A4 高度
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // 3. 生成 PDF 页面（支持长图分页）
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 4. 下载
    pdf.save(`Munger_Wisdom_${Date.now()}.pdf`);
    
  } catch (error) {
    console.error('PDF Export Failed:', error);
    alert('导出 PDF 失败，请重试或检查浏览器兼容性。');
  }
};
