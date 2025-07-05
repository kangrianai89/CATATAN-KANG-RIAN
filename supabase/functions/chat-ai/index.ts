// File: supabase/functions/chat-ai/index.ts
// PERBAIKAN FINAL DENGAN NAMA MODEL YANG BENAR

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemInstruction = `
  Anda adalah asisten AI pribadi untuk aplikasi 'DEVSTUDY-HUB' yang dibuat oleh Kang Rian.
  Nama Anda adalah Asisten AI.
  Gaya bicara Anda cerdas, ramah, proaktif, dan sedikit santai.
  Hindari jawaban yang terlalu kaku atau robotik.
  Selalu sapa pengguna dengan ramah jika ini adalah pesan pertama.
  Tujuan utama Anda adalah membantu pengguna belajar, menjadi lebih produktif, dan menjawab pertanyaan mereka terkait pengembangan perangkat lunak, studi, dan topik umum lainnya.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    const { prompt, history } = await req.json();
    if (!prompt) {
      throw new Error("Prompt is required in the request body.");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // --- PERUBAHAN DI SINI ---
    // Mengganti "gemini-pro" dengan model yang lebih baru dan direkomendasikan
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const fullHistory = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      { role: 'model', parts: [{ text: "Tentu, saya mengerti. Saya adalah Asisten AI yang siap membantu Anda dengan gaya yang ramah dan proaktif!" }] },
      ...(history || [])
    ];

    const chat = model.startChat({
      history: fullHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ response: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("An error occurred inside the Edge Function:", error);
    return new Response(JSON.stringify({ error: `Function execution failed: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});