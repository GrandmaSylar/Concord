'use server'

import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/utils/supabase/server'

const apiKey = process.env.GEMINI_API_KEY

// Fallback model chain — if the primary model is rate-limited or not supported, try alternatives
const MODEL_CHAIN = [
 'gemini-2.5-flash',
 'gemini-2.0-flash',
 'gemini-2.0-flash-lite',
 'gemini-1.5-flash',
]

export async function generateCampaignDrafts(
 prompt: string,
 context: { position?: string; subArea?: string }
) {
 if (!apiKey) {
 return {
 error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.',
 drafts: [],
 }
 }

 const ai = new GoogleGenAI({ apiKey })

 const systemInstruction = `You are a professional political outreach SMS assistant for the NPP (New Patriotic Party) Weija-Gbawe constituency in Ghana.
Your job is to generate exactly 3 short, impactful, and persuasive SMS message drafts based on the user's prompt.

RULES:
1. Each message MUST be under 160 characters for standard SMS.
2. Use available merge tags where appropriate: [Firstname], [Lastname], [Fullname], [Position], [SubArea], [Station]
3. Keep the tone respectful, professional, and action-oriented.
4. Do NOT include numbering like "1." or "Draft 1:" in the messages.
5. ${context.position ? `Target audience role: ${context.position}` : 'Target audience: General constituents'}
6. ${context.subArea ? `Target area: ${context.subArea}` : 'Area: Weija-Gbawe constituency'}

Return ONLY a JSON array of exactly 3 strings. No markdown, no explanation. Example:
["Message one here", "Message two here", "Message three here"]`

 // Try each model in the chain until one succeeds
 for (const model of MODEL_CHAIN) {
 try {
 const response = await ai.models.generateContent({
 model,
 contents: prompt,
 config: {
 systemInstruction,
 temperature: 0.8,
 },
 })

 const text = response.text?.trim() || '[]'

 // Extract JSON array from the response (handle possible markdown wrapping)
 const jsonMatch = text.match(/\[[\s\S]*\]/)
 if (!jsonMatch) {
 return { error: 'AI returned an unexpected format. Please try again.', drafts: [] }
 }

 const drafts: string[] = JSON.parse(jsonMatch[0])
 if (!Array.isArray(drafts) || drafts.length === 0) {
 return { error: 'AI returned empty results. Please refine your prompt.', drafts: [] }
 }

 return { error: null, drafts: drafts.slice(0, 3) }
 } catch (err: any) {
 const statusCode = err?.status || err?.error?.code || err?.code || 0
 const errMsg = err?.message || ''
 
 const isRateLimit = statusCode === 429 || errMsg.includes('RESOURCE_EXHAUSTED')
 const isNotFound = statusCode === 404 || errMsg.includes('not found') || errMsg.includes('not supported')

 // If rate-limited or model is not found/supported, log warning and try the next model
 if (isRateLimit || isNotFound) {
 console.warn(`Model ${model} failed (Rate Limit: ${isRateLimit}, Not Found/Supported: ${isNotFound}). Trying next fallback...`)
 continue
 }

 // For other structural errors, return immediately
 console.error(`Gemini API error (${model}):`, err)
 return {
 error: `AI generation failed: ${err.message || 'Unknown error'}`,
 drafts: [],
 }
 }
 }

 // All models exhausted
 return {
 error: 'AI quota exhausted across all models. Your free tier daily limit has been reached — please try again tomorrow, or upgrade to a paid Gemini API plan at ai.google.dev.',
 drafts: [],
 }
}

export async function getAIUsageStats() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return { count: 0, tokens: 0, fallback: true }

 const todayStr = new Date().toISOString().substring(0, 10) + 'T00:00:00Z'

 try {
 const { data, error, status } = await supabase
 .from('ai_usage_logs')
 .select('tokens_used')
 .eq('user_id', user.id)
 .gte('created_at', todayStr)

 if (error) {
 // PGRST116/PGRST204 or missing table errors
 if (error.code === 'PGRST116' || error.code === '42P01') {
 return { count: 0, tokens: 0, fallback: true }
 }
 throw error
 }

 const count = data.length
 const tokens = data.reduce((acc, row) => acc + (row.tokens_used || 0), 0)

 return { count, tokens, fallback: false }
 } catch (err) {
 console.warn('AI usage table check failed, falling back to localStorage:', err)
 return { count: 0, tokens: 0, fallback: true }
 }
}

export async function logAIUsage(model: string, prompt: string, tokens: number) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return { success: false }

 try {
 const { error } = await supabase
 .from('ai_usage_logs')
 .insert({
 user_id: user.id,
 model,
 prompt: prompt.substring(0, 500), // truncate for safety
 tokens_used: tokens
 })

 if (error) {
 if (error.code === '42P01') return { success: false, fallback: true }
 throw error
 }

 return { success: true }
 } catch (err) {
 console.warn('Failed to log AI usage to database:', err)
 return { success: false, fallback: true }
 }
}
