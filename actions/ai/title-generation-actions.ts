"use server"

import { ActionState } from "@/types"

const CLAUDE_MODEL = "claude-sonnet-4-20250514"

// Generate a title for a chat based on the first message
export async function generateChatTitleAction(
  firstMessage: string
): Promise<ActionState<string>> {
  console.log("[Title Generation] Generating title for chat")
  
  if (!process.env.CLAUDE_API_KEY) {
    console.error("[Title Generation] CLAUDE_API_KEY not configured")
    return { 
      isSuccess: false, 
      message: "AI service not configured" 
    }
  }
  
  if (!firstMessage || firstMessage.trim().length === 0) {
    return { 
      isSuccess: false, 
      message: "No message provided for title generation" 
    }
  }
  
  try {
    const systemPrompt = `You are a chat title generator. Based on the user's first message in a conversation, generate a concise, descriptive title (3-6 words max) that captures the main topic or intent. The title should be clear and help the user identify the chat later.

Examples:
- User: "How can I validate my startup idea?" → Title: "Startup Idea Validation"
- User: "What makes a good MVP?" → Title: "Building Good MVPs"
- User: "I need help with my week 3 assignment" → Title: "Week 3 Assignment Help"
- User: "Can you review my business plan?" → Title: "Business Plan Review"

Rules:
- Keep it short (3-6 words)
- Use title case
- Be descriptive but concise
- No punctuation except necessary apostrophes
- Focus on the main topic or request`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 50,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Generate a title for this chat that starts with: "${firstMessage}"`
          }
        ]
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Title Generation] Claude API error:", errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }
    
    const data = await response.json()
    const generatedTitle = data.content?.[0]?.text?.trim() || ""
    
    if (!generatedTitle) {
      throw new Error("No title generated")
    }
    
    console.log("[Title Generation] Generated title:", generatedTitle)
    
    return {
      isSuccess: true,
      message: "Title generated successfully",
      data: generatedTitle
    }
  } catch (error) {
    console.error("[Title Generation] Error:", error)
    
    // Fallback: Create a simple title from the first few words
    const fallbackTitle = firstMessage
      .split(' ')
      .slice(0, 5)
      .join(' ')
      .replace(/[?!.,]/g, '')
      .trim()
    
    return {
      isSuccess: true,
      message: "Title generated with fallback",
      data: fallbackTitle.length > 30 
        ? fallbackTitle.substring(0, 27) + "..." 
        : fallbackTitle
    }
  }
} 