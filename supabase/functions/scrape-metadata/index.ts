// File: supabase/functions/scrape-metadata/index.ts
// VERSI FINAL DENGAN CORS HEADERS

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

// Headers untuk mengizinkan CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getMetaContent = (doc, selector) => {
  const element = doc.querySelector(selector);
  return element ? (element.getAttribute("content") || element.textContent) : null;
};

serve(async (req) => {
  // Handle preflight request untuk CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let url;
  try {
    const body = await req.json();
    url = body.url;
    if (!url) throw new Error("URL is required.");
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request body. " + error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        }
    });
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Could not parse HTML document.");

    const title = getMetaContent(doc, "title") || getMetaContent(doc, 'meta[property="og:title"]');
    const description = getMetaContent(doc, 'meta[name="description"]') || getMetaContent(doc, 'meta[property="og:description"]');
    const image = getMetaContent(doc, 'meta[property="og:image"]');

    const data = {
      title: title ? title.trim() : null,
      description: description ? description.trim() : null,
      image: image,
    };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});