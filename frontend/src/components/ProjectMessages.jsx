import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import * as messageService from '../services/messageService'

function ProjectMessages({ projectId }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  function loadMessages() {
    messageService
      .listMessages(projectId)
      .then((res) => setMessages(res.messages))
      .catch(() => setError('Could not load messages'))
  }

  useEffect(loadMessages, [projectId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setError('')
    setSending(true)
    try {
      await messageService.sendMessage(projectId, content.trim())
      setContent('')
      loadMessages()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-medium text-gray-800">Messages</h2>

      {error && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((m) => {
            const isOwn = m.senderId === user?.id
            return (
              <div key={m.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {m.content}
                </div>
                <span className="mt-1 text-xs text-gray-400">
                  {m.sender?.name || 'Unknown'} · {new Date(m.createdAt).toLocaleString()}
                </span>
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  )
}

export default ProjectMessages
