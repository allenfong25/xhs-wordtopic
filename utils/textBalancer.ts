/**
 * A heuristic helper to split text into pages.
 * In a real-world scenario, we might render off-screen to measure,
 * but for this environment, we'll use character counts and line estimation.
 */

interface SplitResult {
  pages: string[][]; // Array of pages, each page is an array of paragraphs
}

// 调整后的常量定义
// 1. 增加每页最大行数，让内容更紧凑
// 2. 将边距计算改为小数，更精确
const MAX_LINES_FIRST_PAGE = 21.5; // 第一页（含标题+头图）的预估行数容量
const MAX_LINES_OTHER_PAGE = 21.5; // 其他页面的预估行数容量
const CHARS_PER_LINE = 26.5; // 按照 1242px 宽 - 边距 / 40px字体 估算。

// 视觉参数对应的“行数”成本
const MARGIN_BOTTOM_COST = 0.6; // 段落间距约占 0.7 行的高度 (50px margin / 72px lineHeight)

const estimateLines = (text: string): number => {
  const cleanText = text.trim();
  if (!cleanText) return 0;
  
  // 计算逻辑：字符长度 / 每行字数 + 换行符带来的额外高度
  // 使用 Math.ceil 向上取整，保证不溢出
  const linesFromChars = Math.ceil(cleanText.length / CHARS_PER_LINE);
  const linesFromNewlines = (cleanText.match(/\n/g) || []).length;
  
  return linesFromChars + linesFromNewlines;
};

export const balanceText = (title: string, body: string): string[][] => {
  const paragraphs = body.split('\n').filter(p => p.trim().length > 0);
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentLines = 0;
  
  // 第一页的初始占用
  // Title 估算：标题字号大(80px)，是正文(40px)的两倍，且有大间距
  const titleLines = estimateLines(title) * 2.5 + 1.5; 
  // 头像区域 + 顶部Padding差异
  const headerLines = 4.0; 
  
  // 计算第一页剩余给正文的空间
  let maxLines = MAX_LINES_FIRST_PAGE - titleLines - headerLines;
  // 安全底线，防止 maxLines 变为负数
  if (maxLines < 4) maxLines = 4; 

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    // 计算当前段落占用的行数：文本行数 + 段落间距
    const textLines = estimateLines(para);
    const paraCost = textLines + MARGIN_BOTTOM_COST;

    // 检查是否溢出当前页
    // 使用稍微宽松的判定 (currentLines + textLines)，不包含最后一个 margin，因为最后一个段落的margin通常不影响布局边界
    if (currentLines + textLines > maxLines + 0.5) { // +0.5 作为容错缓冲
      
      // 如果当前页是空的，说明这段话太长了，必须放进去（或者切断，暂不实现切断）
      if (currentPage.length === 0) {
        pages.push([para]);
        // 重置为下一页的状态
        maxLines = MAX_LINES_OTHER_PAGE;
        currentLines = 0;
        continue;
      }

      // 否则，结束当前页，开启新的一页
      pages.push(currentPage);
      currentPage = [];
      currentLines = 0;
      maxLines = MAX_LINES_OTHER_PAGE;
      
      //重新处理当前段落
      i--; 
    } else {
      currentPage.push(para);
      currentLines += paraCost;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  // --- 简单的“孤儿行”优化 ---
  // 如果最后一页内容极少（比如只有一行），尝试把它挤到前一页，或者把前一页的一段挪下来平衡一下。
  
  if (pages.length > 1) {
    const lastPage = pages[pages.length - 1];
    const prevPage = pages[pages.length - 2];
    
    // 计算上一页的剩余空间（非常粗略）
    const prevPageLines = prevPage.reduce((acc, p) => acc + estimateLines(p) + MARGIN_BOTTOM_COST, 0);
    const lastPageLines = lastPage.reduce((acc, p) => acc + estimateLines(p) + MARGIN_BOTTOM_COST, 0);

    // 策略1：如果最后一页非常短，且上一页还有空间，尝试合并
    // (这需要前面的 maxLines 计算比较保守才行，这里不做强行合并，以免溢出)

    // 策略2：如果最后一页太短，把上一页最后一段挪下来，让版面更平衡
    if (lastPageLines < 3 && prevPageLines > 10) {
       const paraToMove = prevPage[prevPage.length - 1];
       // 简单判断挪动后上一页不会空
       if (prevPage.length > 1) {
         prevPage.pop();
         lastPage.unshift(paraToMove);
       }
    }
  }

  return pages;
};