import HYLOBOT_SYSTEM_PROMPT from './hyloBotSystemPrompt'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-20250514'

// Extract navigation links from bot response text
// Matches patterns like [Label](/path) and converts to structured links
function extractLinks (text) {
  const linkRegex = /\[([^\]]+)\]\(\/([^)]+)\)/g
  const links = []
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    links.push({
      label: match[1],
      url: '/' + match[2],
      description: match[1]
    })
  }

  return links
}

// Extract suggestion prompts from bot response
// Looks for lines starting with "- " that could be follow-up questions
function extractSuggestions (text) {
  const suggestions = []
  const lines = text.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- **') || trimmed.startsWith('- ')) {
      const suggestion = trimmed.replace(/^- \*\*([^*]+)\*\*.*$/, '$1').replace(/^- /, '')
      if (suggestion.length > 5 && suggestion.length < 80) {
        suggestions.push(suggestion)
      }
    }
  }

  return suggestions.slice(0, 3)
}

export async function sendHyloBotMessage (userId, message, botContext) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured. Please set it in your environment variables.')
  }

  // Build context-aware system prompt
  let systemPrompt = HYLOBOT_SYSTEM_PROMPT
  if (botContext) {
    systemPrompt += '\n\n## Current User Context\n'
    if (botContext.groupSlug) {
      systemPrompt += `- Current group: ${botContext.groupSlug}\n`
      systemPrompt += `- Use "${botContext.groupSlug}" as the group slug in navigation links\n`
    }
    if (botContext.currentPath) {
      systemPrompt += `- Current page: ${botContext.currentPath}\n`
    }
  }

  // Build conversation messages
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ]

  // If conversation history provided, insert before the latest user message
  if (botContext?.conversationHistory && Array.isArray(botContext.conversationHistory)) {
    const history = botContext.conversationHistory.slice(-10) // Last 10 messages max
    messages.splice(1, 0, ...history)
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.PROTOCOL + '://' + process.env.DOMAIN,
      'X-Title': 'HyloBot'
    },
    body: JSON.stringify({
      model: process.env.HYLOBOT_MODEL || DEFAULT_MODEL,
      messages,
      max_tokens: 1024,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('OpenRouter API error:', response.status, errorBody)
    throw new Error(`OpenRouter API returned ${response.status}`)
  }

  const data = await response.json()
  const botMessage = data.choices?.[0]?.message?.content || 'Sorry, I was unable to generate a response.'

  const links = extractLinks(botMessage)
  const suggestions = extractSuggestions(botMessage)

  return {
    message: botMessage,
    links,
    suggestions
  }
}
