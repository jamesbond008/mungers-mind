
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MungerResponse } from "../types";
import { MUNGER_SYSTEM_INSTRUCTION } from "../constants";

export const getMungerAdvice = async (userInput: string): Promise<MungerResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: userInput }] }],
    config: {
      systemInstruction: MUNGER_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          advice: {
            type: Type.STRING,
            description: "The primary, brutally honest advice from Charlie Munger.",
          },
          models: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["name", "explanation"]
            },
            description: "3-5 mental models relevant to the query."
          },
          lollapalooza: {
            type: Type.STRING,
            description: "How the models interact to create a massive effect."
          },
          inversion: {
            type: Type.STRING,
            description: "What NOT to do (Invert, always invert)."
          }
        },
        required: ["advice", "models", "lollapalooza", "inversion"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from the oracle.");
  
  try {
    return JSON.parse(text) as MungerResponse;
  } catch (e) {
    console.error("Failed to parse Munger's response", e);
    throw new Error("Munger's thoughts were too complex for the machine to handle.");
  }
};
