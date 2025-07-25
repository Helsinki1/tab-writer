import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tone prompts configuration
const TONE_PROMPTS = {
  professional: "professional, business-appropriate tone. Keep it formal, clear, and polished.",
  casual: "casual, friendly conversational tone. Keep it relaxed and approachable.",
  creative: "creative, engaging, and expressive tone. Be imaginative and captivating.",
  concise: "concise, direct, and brief manner. Be clear and to the point.",
  witty: "humorous, clever, and witty tone. Be amusing, intelligent, and entertaining while staying relevant.",
  instructional: "clear, educational, and explanatory tone. Be helpful, informative, and easy to understand.",
  urgent: "urgent tone with a sense of importance and immediacy. Convey time-sensitivity and critical importance.",
  reflective: "thoughtful, contemplative, and introspective tone. Be philosophical, deep, and considerate."
} as const;

// Purpose prompts configuration
const PURPOSE_PROMPTS = {
  persuasive: "with the purpose of persuading and convincing the reader. Use compelling arguments and persuasive language.",
  informative: "with the purpose of informing and educating the reader. Provide clear, factual, and useful information.",
  descriptive: "with the purpose of describing and painting a vivid picture. Use rich details and sensory language.",
  flattering: "with the purpose of complimenting and praising. Use positive, appreciative, and admiring language.",
  narrative: "with the purpose of telling a story or recounting events. Use narrative techniques and engaging storytelling."
} as const;

type ToneType = keyof typeof TONE_PROMPTS;
type PurposeType = keyof typeof PURPOSE_PROMPTS;

// Request deduplication cache
const requestCache = new Map<string, { suggestion: string; timestamp: number }>();
const CACHE_EXPIRY = 60 * 1000; // 60 seconds in milliseconds

interface AutocompleteRequest {
  text: string;
  tone: string;
  purpose: string;
}

interface AutocompleteResponse {
  suggestion?: string;
  tone?: string;
  purpose?: string;
  status?: string;
  error?: string;
  details?: string;
}

async function generateAutocomplete(text: string, tone: ToneType, purpose: PurposeType): Promise<string> {
  try {
    // Check cache first
    const cacheKey = `${text}_${tone}_${purpose}`;
    const currentTime = Date.now();
    
    const cached = requestCache.get(cacheKey);
    if (cached && currentTime - cached.timestamp < CACHE_EXPIRY) {
      return cached.suggestion;
    }
    
    // Get tone and purpose configurations
    const tonePrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.professional;
    const purposePrompt = PURPOSE_PROMPTS[purpose] || PURPOSE_PROMPTS.informative;
    
    // Create combined system prompt
    const systemPrompt = `You are a writing assistant. Continue the given text naturally in a ${tonePrompt} Write ${purposePrompt} Provide only the next few words or phrase that would logically follow. Do not repeat the input text.`;
    
    // Create OpenAI request
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Continue this text: "${text}"` }
      ],
      max_tokens: 30,
      temperature: 0.6,
      stop: ["\n", ".", "!", "?"],
      presence_penalty: 0.1
    });
    
    const suggestion = response.choices[0]?.message?.content?.trim() || '';
    
    // Cache the result
    requestCache.set(cacheKey, { suggestion, timestamp: currentTime });
    
    // Clean old cache entries
    requestCache.forEach((value, key) => {
      if (currentTime - value.timestamp >= CACHE_EXPIRY) {
        requestCache.delete(key);
      }
    });
    
    return suggestion;
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<AutocompleteResponse>> {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    let data: AutocompleteRequest;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!data.text || !data.tone || !data.purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: text, tone, purpose' },
        { status: 400 }
      );
    }
    
    const text = data.text.trim();
    const tone = data.tone.trim().toLowerCase() as ToneType;
    const purpose = data.purpose.trim().toLowerCase() as PurposeType;
    
    // Validate inputs
    if (!text) {
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 }
      );
    }
    
    if (!(tone in TONE_PROMPTS)) {
      return NextResponse.json(
        { error: `Invalid tone. Must be one of: ${Object.keys(TONE_PROMPTS).join(', ')}` },
        { status: 400 }
      );
    }
    
    if (!(purpose in PURPOSE_PROMPTS)) {
      return NextResponse.json(
        { error: `Invalid purpose. Must be one of: ${Object.keys(PURPOSE_PROMPTS).join(', ')}` },
        { status: 400 }
      );
    }
    
    // Generate suggestion
    const suggestion = await generateAutocomplete(text, tone, purpose);
    
    return NextResponse.json({
      suggestion,
      tone,
      purpose,
      status: 'success'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate suggestion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 