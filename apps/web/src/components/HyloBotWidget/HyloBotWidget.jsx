import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { cn } from 'util/index'
import classes from './HyloBotWidget.module.scss'

const STORAGE_KEY = 'hylobot-chat-history'
const MAX_STORED_MESSAGES = 50

const SUGGESTION_CHIPS = [
  'How do I create a post?',
  'How do I invite someone to my group?',
  'What are proposals?'
]

function getGroupSlugFromPath (pathname) {
  const match = pathname.match(/^\/groups\/([^/]+)/)
  return match ? match[1] : null
}

function loadMessages () {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveMessages (messages) {
  try {
    const toStore = messages.slice(-MAX_STORED_MESSAGES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch { /* quota exceeded - silently fail */ }
}

export default function HyloBotWidget () {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(loadMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return

    const userMessage = { role: 'user', content: text.trim() }
    setInput('')
    setIsLoading(true)

    // Use functional update to capture current messages for history
    let recentHistory = []
    setMessages(prev => {
      recentHistory = prev.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))
      return [...prev, userMessage]
    })

    const groupSlug = getGroupSlugFromPath(location.pathname)

    try {
      const response = await fetch('/noo/hylobot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context: {
            groupSlug,
            currentPath: location.pathname,
            conversationHistory: recentHistory
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const botMessage = {
        role: 'assistant',
        content: data.message,
        links: data.links,
        suggestions: data.suggestions
      }
      setMessages(prev => [...prev, botMessage])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.'
      }])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, location.pathname])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input)
  }, [input, sendMessage, isLoading])

  const handleLinkClick = useCallback((e, url) => {
    e.preventDefault()
    navigate(url)
  }, [navigate])

  const handleClearChat = useCallback(() => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <div className={classes.widgetContainer}>
      {/* Chat Panel */}
      {isOpen && (
        <div className={cn(classes.chatPanel, 'bg-background text-foreground')}>
          {/* Header */}
          <div className={cn(classes.header, 'bg-card border-b border-border')}>
            <div className={classes.headerTitle}>
              <MessageCircle className='w-4 h-4' />
              <span className='font-semibold text-sm'>HyloBot</span>
            </div>
            <div className='flex items-center gap-1'>
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className={cn(classes.clearBtn, 'text-foreground/50 hover:text-foreground')}
                  title='Clear chat'
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className='text-foreground/50 hover:text-foreground p-1 transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className={classes.messagesArea}>
            {messages.length === 0 && (
              <div className={classes.emptyState}>
                <p className='text-foreground/60 text-sm mb-3'>
                  Hi! I can help you navigate and use Hylo. Try asking:
                </p>
                <div className={classes.suggestions}>
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      className={cn(classes.suggestionChip, 'bg-card border border-border text-foreground/80 hover:text-foreground hover:border-foreground/30')}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(classes.message, {
                  [classes.userMessage]: msg.role === 'user',
                  [classes.botMessage]: msg.role === 'assistant'
                })}
              >
                <div
                  className={cn(classes.bubble, {
                    'bg-primary text-primary-foreground': msg.role === 'user',
                    'bg-card text-foreground border border-border': msg.role === 'assistant'
                  })}
                >
                  <MessageContent
                    content={msg.content}
                    onLinkClick={handleLinkClick}
                  />
                </div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className={classes.suggestions}>
                    {msg.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className={cn(classes.suggestionChip, 'bg-card border border-border text-foreground/80 hover:text-foreground hover:border-foreground/30')}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className={cn(classes.message, classes.botMessage)}>
                <div className={cn(classes.bubble, 'bg-card text-foreground border border-border')}>
                  <Loader2 className='w-4 h-4 animate-spin' />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className={cn(classes.inputArea, 'bg-card border-t border-border')}>
            <input
              ref={inputRef}
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask about Hylo...'
              className={cn(classes.input, 'bg-background text-foreground placeholder:text-foreground/40 border border-border')}
              disabled={isLoading}
              maxLength={2000}
            />
            <button
              type='submit'
              disabled={!input.trim() || isLoading}
              className={cn(classes.sendBtn, 'text-primary disabled:text-foreground/30')}
            >
              <Send className='w-4 h-4' />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(classes.fab, 'bg-primary text-primary-foreground shadow-lg hover:shadow-xl')}
        title={isOpen ? 'Close HyloBot' : 'Ask HyloBot'}
      >
        {isOpen ? <X className='w-5 h-5' /> : <MessageCircle className='w-5 h-5' />}
      </button>
    </div>
  )
}

function MessageContent ({ content, onLinkClick }) {
  // Parse markdown-style links [label](/path) into clickable elements
  const parts = content.split(/(\[[^\]]+\]\(\/[^)]+\))/)

  return (
    <span className='text-sm leading-relaxed whitespace-pre-wrap'>
      {parts.map((part, i) => {
        const linkMatch = part.match(/\[([^\]]+)\]\((\/[^)]+)\)/)
        if (linkMatch) {
          return (
            <a
              key={i}
              href={linkMatch[2]}
              onClick={(e) => onLinkClick(e, linkMatch[2])}
              className='underline text-primary hover:text-primary/80 cursor-pointer'
            >
              {linkMatch[1]}
            </a>
          )
        }
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </span>
  )
}
