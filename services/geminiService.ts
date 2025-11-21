import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMagicalRewardMessage = async (
  characterName: string, 
  score: number
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a magical storyteller in a fantasy kingdom. 
      A student playing as "${characterName}" just finished a math game with a score of ${score}.
      Write a very short, encouraging, and magical 2-sentence congratulatory message in Turkish suitable for a primary school student.
      Mention magical elements related to their character.
      Do not include any markdown or quotes. Just the text.`,
    });

    return response.text || "Tebrikler! Sihirli matematik yolculuğunu tamamladın!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Harika iş çıkardın ${characterName}! Matematiğin gücü seninle!`;
  }
};