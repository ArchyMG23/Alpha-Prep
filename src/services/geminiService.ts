import { GoogleGenAI, Type } from "@google/genai";
import { Question, TestType, TaskType, Level } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI features will be disabled.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
  }
  return aiInstance;
}

export async function parseExamDocument(fileData: string, mimeType: string, fileName: string): Promise<Partial<Question>[]> {
  const ai = getAI();
  console.log(`Starting parsing for ${fileName} (${mimeType})...`);

  const isText = mimeType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md') || !mimeType;
  
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

  let contentPart;
  if (isText) {
    // ... handling text file content ...
    let rawText = fileData;
    if (fileData.startsWith('data:')) {
      try {
        const base64 = fileData.split(',')[1];
        rawText = atob(base64);
      } catch (e) {
        console.warn("Could not decode text file from data URL, using raw data.");
      }
    }
    contentPart = { text: `Document Content:\n${rawText}` };
  } else {
    const data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    contentPart = { inlineData: { mimeType: mimeType || 'application/octet-stream', data } };
  }

  const contents = {
    parts: [
      { text: prompt },
      contentPart
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
    console.log("Gemini response extracted successfully.");
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Parsing Error Details:", error);
    throw error; // Throw so UI can see 
  }
}

export async function gradeWritingTask(questionContent: string, userAnswer: string, testType: TestType, keywords?: string[]): Promise<{ scoreCLB: number; feedback: string }> {
  const ai = getAI();
  
  const prompt = `You are an expert examiner for the ${testType} exam (specifically TCF/TEF Canada or IELTS). 
  Please evaluate the candidate's response based on official criteria:
  
  For TCF/TEF:
  - Respect de la consigne (60-120 words for task 1, 120-150 for task 2, 120-180 for task 3).
  - Cohérence et cohésion (logical connectors).
  - Lexique (richness and precision).
  - Grammaire (complex structures, accuracy).
  
  For IELTS:
  - Task Response, Coherence/Cohesion, Lexical Resource, Grammatical Range/Accuracy.
  
  ${keywords && keywords.length > 0 ? `Important keywords/concepts to check: ${keywords.join(', ')}.` : ''}
  ${questionContent.includes("CONTEXTE_GENERATION_EXAMEN") ? "IMPORTANT: Generate a JSON practice exercise." : ""}

  EXAM TASK:
  ${questionContent}
  
  CANDIDATE'S WORK:
  ${userAnswer === 'CONTEXTE_GENERATION_EXAMEN' ? 'N/A' : userAnswer}
  
  Evaluate and provide a feedback in French. Return the result as JSON.
  If testType is TCF/TEF, scoreCLB is NCLC level (3 to 12).
  If testType is IELTS, scoreCLB is Band score equivalent (0-9).
  
  JSON Structure:
  {
    "scoreCLB": number,
    "feedback": "Feedback détaillé en français..."
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scoreCLB: { type: Type.NUMBER, description: "NCLC level from 1 to 12" },
            feedback: { type: Type.STRING, description: "Detailed examiner feedback" }
          },
          required: ['scoreCLB', 'feedback']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Grading Error Details:", error);
    throw error;
  }
}
