"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini. Make sure GEMINI_API_KEY is in .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function scanImageWithGemini(formData: FormData, prompt: string = "Ano ang nakikita mo sa image na ito? I-describe nang maigi.") {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { error: "Wala pa kayong GEMINI_API_KEY sa .env.local niyo." };
    }

    const file = formData.get("image") as File;
    if (!file) {
      return { error: "Walang image file na nai-upload." };
    }

    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    // We use gemini-1.5-flash as it is fast and excellent for vision tasks
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type || "image/jpeg",
        },
      },
    ]);

    return { text: result.response.text(), error: null };
  } catch (error: any) {
    console.error("Error scanning image with Gemini:", error);
    return { text: null, error: error.message || "May naging problema sa pag-scan gamit ang Gemini API." };
  }
}
