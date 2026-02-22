import { sendHyloBotMessage } from '../services/HyloBotService'

module.exports = {
  chat: async function (req, res) {
    const userId = req.session.userId
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to use HyloBot' })
    }

    const { message, context } = req.body

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' })
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message is too long (max 2000 characters)' })
    }

    try {
      const result = await sendHyloBotMessage(userId, message.trim(), context)
      return res.json(result)
    } catch (error) {
      console.error('HyloBot error:', error.message)
      return res.status(503).json({ error: 'HyloBot is temporarily unavailable. Please try again later.' })
    }
  }
}
