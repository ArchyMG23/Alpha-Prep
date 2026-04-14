import { GoogleGenAI, Type } from "@google/genai";
import { Question, TestType, TaskType, Level } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseExamDocument(fileData: string, mimeType: string, fileName: string): Promise<Partial<Question>[]> {
  const isText = mimeType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md');
  
  const prompt = `Analyze the provided document "${fileName}". 
  This document contains content for language exams (TCF Canada, TEF Canada, or IELTS).
  Identify all individual exercises, tasks, or modules present.
  For each detected exercise, extract:
  - testType: 'TCF', 'TEF', or 'IELTS'
  - type: 'WRITING', 'READING', 'LISTENING', 'SPEAKING', or 'METHODOLOGY'
  - level: 'A1', 'A2', 'B1', 'B2', 'C1', 'C2' (default to 'B2' if unsure)
  - title: A concise, professional title
  - content: The full text, instructions, and context of the exercise
  - isPremium: boolean (true for full exams or complex tasks)
  - requiredCredits: number (1 for tasks requiring human/AI correction like Writing/Speaking, 0 for others)
  
  Return a JSON array of these exercises.`;

  const contents = {
    parts: [
      { text: prompt },
      isText 
        ? { text: `Document Content:\n${fileData}` }
        : { inlineData: { mimeType, data: fileData.split(',')[1] || fileData } }
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              testType: { type: Type.STRING, enum: ['TCF', 'TEF', 'IELTS'] },
              type: { type: Type.STRING, enum: ['WRITING', 'READING', 'LISTENING', 'SPEAKING', 'METHODOLOGY'] },
              level: { type: Type.STRING, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              isPremium: { type: Type.BOOLEAN },
              requiredCredits: { type: Type.NUMBER }
            },
            required: ['testType', 'type', 'level', 'title', 'content']
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return [];
  }
}
