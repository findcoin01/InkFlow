import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateLogo() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: "A professional, minimalist logo for a software called 'InkFlow'. The logo should feature a stylized fountain pen nib or an ink drop that seamlessly transitions into a digital wave or a neural network pattern, symbolizing the fusion of traditional writing and AI technology. Use a sophisticated color palette of deep ink blue, emerald green, and clean white. The design should be sleek, modern, and suitable for a high-end creative tool. White background.",
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
