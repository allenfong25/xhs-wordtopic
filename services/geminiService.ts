import { GoogleGenAI } from "@google/genai";
import { ContentData } from "../types";

const initGemini = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const polishContent = async (text: string): Promise<ContentData> => {
  try {
    const ai = initGemini();
    const prompt = `
    You are an expert Xiaohongshu (RedNote) copywriter. 
    Please rewrite the following text to be engaging, aesthetic, and formatted for a slide deck.
    
    1. Extract or create a catchy, short title (max 10 chars).
    2. Polish the body text. Use emotive language, correct punctuation, and ensure it flows well.
    3. The tone should be "chill", "aesthetic", and "literary".
    4. Return ONLY a valid JSON object with the following structure:
    {
      "title": "String",
      "body": "String (use \\n for line breaks)"
    }
    
    Original Text:
    ${text}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("No response from AI");

    return JSON.parse(responseText) as ContentData;
  } catch (error) {
    console.error("Gemini Polish Error:", error);
    throw error;
  }
};
