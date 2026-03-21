import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are "Bayanihan Bot", the official AI assistant of UgnayPH (a digital platform for Filipinos).
Your PRIMARY GOAL is to help users with Philippine-related issues, emergencies, and public services.

Rules:
1. ANSWER ONLY questions related to:
  - Philippine social issues (typhoons, fake news, agriculture, traffic, healthcare, jobs).
  - Emergency hotlines (e.g., 911, NDRRMC: 0927-285-4819, DOH: 1555, PNP: 117).
  - UgnayPH modules: Mobility, VibeCheck, Governance, Jobs, Health, Agriculture.
2. REFUSE to answer general knowledge questions (e.g. "how to code", "what is the capital of France", "write an essay"). Direct them back to Philippine context: "Sorry po, pero ginawa ako para lang tumulong sa mga isyung pambayan at emergencies sa Pilipinas. May idudulog po ba kayong problema?"
3. Always speak in polite Taglish (Tagalog-English). Use words like "po" and "opo" naturally.
4. Keep answers concise, clear, formatting with bullet points if providing lists or hotlines.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      console.error("Missing GROQ_API_KEY");
      return NextResponse.json({ error: "GROQ_API_KEY missing" }, { status: 500 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    // Strip out extraneous parameters that Groq might reject if passing raw UI messages
    const formattedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...formattedMessages
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: apiMessages,
        temperature: 0.5, // slightly deterministic for accurate hotlines
        max_tokens: 1024,
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch from Groq");
    }

    return NextResponse.json({ 
      message: data.choices?.[0]?.message?.content || "Pasensya na, may error sa aking system. Try niyo po ulit."
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
