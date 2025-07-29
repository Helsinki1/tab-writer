import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy OpenAI client initialization
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Tone prompts configuration
const TONE_PROMPTS = {
  professional: "professional, business-appropriate tone. Keep it formal and polished.",
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
  persuasive: "with the purpose of persuading the reader. Use compelling and persuasive language.",
  informative: "with the purpose of informing the reader. Provide factual and useful information.",
  descriptive: "with the purpose of describing a vivid picture. Use rich details and sensory language.",
  flattering: "with the purpose of complimenting and praising. Use appreciative and admiring language.",
  narrative: "with the purpose of telling a story or recounting events. Use narrative techniques and engaging storytelling."
} as const;

// Genre prompts configuration
const GENRE_PROMPTS = {
  email: "in the tone of an email. Use appropriate email professional style.",
  essay: "in an essay format. Use academic structure with clear arguments, evidence, and formal language.",
  "social post": "as a social media post. Keep it engaging and concise for social platforms.",
  report: "in a report format. Use factual, objective language with clear presentation.",
  story: "as a story or narrative. Use storytelling elements and engaging plot structure.",
  research: "in a research format. Use scholarly language, evidence-based arguments, and rigor.",
  sales: "as sales content. Use persuasive techniques, highlight benefits, and compelling calls-to-action.",
  education: "in an educational format. Use clear explanations, examples, and structured learning approaches."
} as const;

// Structure prompts configuration
const STRUCTURE_PROMPTS = {
  chronological: "using chronological structure. Present information in a clear sequence of events.",
  "problem-solution": "using problem-solution structure. Identify issues clearly and present solutions.",
  "cause-effect": "using cause-effect structure. Show relationships between causes and effects.",
  "compare-contrast": "using compare-contrast structure. Highlight similarities and differences between concepts.",
  "question-answer": "using question-answer structure. Pose relevant questions and provide clear answers.",
  "counter-argument": "using counter-argument structure. Present opposing views and address counterpoints.",
  "for and against": "using for-and-against structure. Present balanced arguments on both sides of the issue.",
  list: "using list structure. Present information as comma-separated items or ideas.",
  "inverted pyramid": "using inverted pyramid structure. Start with the most important information first, then details.",
  narrative: "using narrative structure. Continue the narrative with compelling storytelling techniques."
} as const;

type ToneType = keyof typeof TONE_PROMPTS;
type PurposeType = keyof typeof PURPOSE_PROMPTS;
type GenreType = keyof typeof GENRE_PROMPTS;
type StructureType = keyof typeof STRUCTURE_PROMPTS;

// Request deduplication cache
const requestCache = new Map<string, { suggestion: string; timestamp: number }>();
const CACHE_EXPIRY = 60 * 1000; // 60 seconds in milliseconds

interface AutocompleteRequest {
  text: string;
  tone: string;
  purpose: string;
  genre: string;
  structure: string;
  context?: string;
}

interface AutocompleteResponse {
  suggestion?: string;
  tone?: string;
  purpose?: string;
  genre?: string;
  structure?: string;
  status?: string;
  error?: string;
  details?: string;
}

async function generateAutocomplete(text: string, tone: ToneType, purpose: PurposeType, genre: GenreType, structure: StructureType, context?: string): Promise<string> {
  try {
    // Get lazy-initialized OpenAI client
    const openai = getOpenAIClient();
    
    // Check cache first
    const cacheKey = `${text}_${tone}_${purpose}_${genre}_${structure}_${context || ''}`;
    const currentTime = Date.now();
    
    const cached = requestCache.get(cacheKey);
    if (cached && currentTime - cached.timestamp < CACHE_EXPIRY) {
      return cached.suggestion;
    }
    
    // Get tone, purpose, genre, and structure configurations
    const tonePrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.professional;
    const purposePrompt = PURPOSE_PROMPTS[purpose] || PURPOSE_PROMPTS.informative;
    const genrePrompt = GENRE_PROMPTS[genre] || GENRE_PROMPTS.email;
    const structurePrompt = STRUCTURE_PROMPTS[structure] || STRUCTURE_PROMPTS.chronological;
    
    // Create combined system prompt
    const contextPrompt = context ? `\n\nAdditional context to consider: ${context}` : '';
    const systemPrompt = `You are a writing assistant. Help the user continue writing their message in a ${tonePrompt} Write ${purposePrompt} Format it ${genrePrompt} Organize it ${structurePrompt} And it must make progress towards this goal:${contextPrompt} Provide only the next 1-2 sentences that would logically follow or complete the thought. DO NOT REPEAT THE INPUT TEXT.`;
    
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
    if (!data.text || !data.tone || !data.purpose || !data.genre || !data.structure) {
      return NextResponse.json(
        { error: 'Missing required fields: text, tone, purpose, genre, structure' },
        { status: 400 }
      );
    }
    
    const text = data.text.trim();
    const tone = data.tone.trim().toLowerCase() as ToneType;
    const purpose = data.purpose.trim().toLowerCase() as PurposeType;
    const genre = data.genre.trim().toLowerCase() as GenreType;
    const structure = data.structure.trim().toLowerCase() as StructureType;
    const context = data.context?.trim() || undefined;
    
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
    
    if (!(genre in GENRE_PROMPTS)) {
      return NextResponse.json(
        { error: `Invalid genre. Must be one of: ${Object.keys(GENRE_PROMPTS).join(', ')}` },
        { status: 400 }
      );
    }
    
    if (!(structure in STRUCTURE_PROMPTS)) {
      return NextResponse.json(
        { error: `Invalid structure. Must be one of: ${Object.keys(STRUCTURE_PROMPTS).join(', ')}` },
        { status: 400 }
      );
    }
    
    // Generate suggestion
    const suggestion = await generateAutocomplete(text, tone, purpose, genre, structure, context);
    
    return NextResponse.json({
      suggestion,
      tone,
      purpose,
      genre,
      structure,
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