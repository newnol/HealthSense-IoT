import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AIChatPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState([]) // {role:'user'|'assistant', content:string}
  const [sessionId, setSessionId] = useState('default')
  const [sessions, setSessions] = useState([]) // [{id, last_updated, last_user_message, summary}]
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const listRef = useRef(null)
  const [showSuggest, setShowSuggest] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing')
    }
  }, [user, loading, router])

  // Load sessions on mount and when user changes
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const resp = await fetch('/api/ai/sessions', { headers: { Authorization: `Bearer ${token}` } })
        const data = await resp.json()
        if (resp.ok) setSessions(Array.isArray(data) ? data : [])
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
    }
    fetchSessions()
  }, [user])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const canSend = useMemo(() => input.trim().length > 0 && !submitting, [input, submitting])

  const sendMessage = async () => {
    if (!canSend) return
    const text = input.trim()
    setInput('')
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text, history: next.slice(-6), session_id: sessionId })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.detail || 'AI error')
      const reply = data?.reply || ''
      if (data?.session_id && data.session_id !== sessionId) setSessionId(data.session_id)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      // refresh sessions list
      try {
        const sresp = await fetch('/api/ai/sessions', { headers: { Authorization: `Bearer ${token}` } })
        const sdata = await sresp.json()
        if (sresp.ok) setSessions(Array.isArray(sdata) ? sdata : [])
      } catch {}
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Xin lỗi, đã xảy ra lỗi khi gọi AI. Vui lòng thử lại.' }])
      // eslint-disable-next-line no-console
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const loadSession = async (sid) => {
    if (!user) return
    setSessionId(sid)
    try {
      const token = await user.getIdToken()
      const resp = await fetch(`/api/ai/messages?session_id=${encodeURIComponent(sid)}&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.detail || 'Load failed')
      const normalized = Array.isArray(data) ? data.map(m => ({ role: m.role || 'assistant', content: m.content || '' })) : []
      setMessages(normalized)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return <div className="ai-page"><div className="center">Đang tải...</div></div>
  }
  if (!user) return null

  return (
    <div className="ai-page">
      <header className="header">
        <div className="container">
          <h1>🧠 Trợ lý AI Sức khỏe</h1>
          <button className="btn-back" onClick={() => router.push('/dashboard')}>Quay lại Dashboard</button>
        </div>
      </header>

      <div className="container">
        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="title">Lịch sử</div>
              <button className="btn-secondary small" onClick={() => { setSessionId(`s-${Date.now()}`); setMessages([]) }}>Phiên mới</button>
            </div>
            <div className="session-list">
              {sessions.length === 0 && <div className="muted">Chưa có phiên</div>}
              {sessions.map(s => (
                <button key={s.id} className={`session-item ${sessionId === s.id ? 'active' : ''}`} onClick={() => loadSession(s.id)}>
                  <div className="session-title">{s.summary?.slice(0, 40) || s.last_user_message || s.id}</div>
                  <div className="session-time">{s.last_updated ? new Date(s.last_updated).toLocaleString() : ''}</div>
                </button>
              ))}
            </div>
          </aside>

          <div className="chat-panel">
            <div className="toolbar">
              <div className="sid">Phiên: {sessionId}</div>
              <button className="btn-secondary" onClick={() => { setSessionId(`s-${Date.now()}`); setMessages([]) }}>Tạo phiên mới</button>
            </div>
            <div className="messages" ref={listRef}>
              {messages.length === 0 && (
                <div className="empty">
                  Hãy hỏi về tình trạng sức khỏe của bạn: ví dụ "Tôi hay chóng mặt, cần lưu ý gì?"
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`message ${m.role}`}>
                  <div className="bubble">
                    {m.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              {submitting && (
                <div className="message assistant"><div className="bubble typing">AI đang trả lời...</div></div>
              )}
            </div>

            <div className="composer">
              <textarea
                placeholder="Nhập câu hỏi của bạn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
              />
              <button className="btn-send" disabled={!canSend} onClick={sendMessage}>Gửi</button>
            </div>
            <div className="suggest">
              <button onClick={() => setShowSuggest(true)} className="btn-suggest">Gợi ý câu hỏi</button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ai-page { min-height: 100vh; background: #f7f8fa; }
        .header { background: white; border-bottom: 1px solid #e9ecef; }
        .header .container { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; }
        h1 { margin: 0; font-size: 1.25rem; }
        .btn-back { background: #6c757d; color: white; border: 0; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; }
        .container { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }
        .layout { display: grid; grid-template-columns: 280px 1fr; gap: 1rem; }
        .sidebar { background: white; border: 1px solid #e5e7eb; border-radius: 12px; display: flex; flex-direction: column; height: calc(100vh - 180px); overflow: hidden; }
        .sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
        .sidebar .title { font-weight: 600; }
        .session-list { overflow-y: auto; padding: 0.5rem; }
        .session-item { width: 100%; text-align: left; border: 1px solid transparent; background: #f9fafb; padding: 0.5rem 0.6rem; border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer; }
        .session-item:hover { background: #f3f4f6; }
        .session-item.active { border-color: #a5b4fc; background: #eef2ff; }
        .session-title { font-size: 0.9rem; color: #111827; }
        .session-time { font-size: 0.75rem; color: #6b7280; }
        .chat-panel { background: white; border: 1px solid #e9ecef; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; height: calc(100vh - 180px); }
        .toolbar { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e9ecef; background: #fbfcfd; }
        .sid { color: #6b7280; font-size: 0.85rem; }
        .btn-secondary { background: transparent; color: #374151; border: 1px solid #d1d5db; padding: 0.35rem 0.6rem; border-radius: 8px; cursor: pointer; }
        .btn-secondary.small { padding: 0.25rem 0.5rem; font-size: 0.85rem; }
        .messages { flex: 1; padding: 1rem; overflow-y: auto; background: #fbfcfd; }
        .empty { color: #6b7280; text-align: center; margin-top: 2rem; }
        .message { display: flex; margin: 0.5rem 0; }
        .message.user { justify-content: flex-end; }
        .message.assistant { justify-content: flex-start; }
        .bubble { padding: 0.625rem 0.875rem; border-radius: 12px; max-width: 72%; white-space: pre-wrap; word-break: break-word; }
        .user .bubble { background: #0070f3; color: white; border-bottom-right-radius: 4px; }
        .assistant .bubble { background: #eef2ff; color: #1f2937; border-bottom-left-radius: 4px; }
        .typing { opacity: 0.8; font-style: italic; }
        .composer { display: grid; grid-template-columns: 1fr auto; gap: 0.75rem; padding: 0.75rem; border-top: 1px solid #e9ecef; }
        textarea { resize: none; border: 1px solid #dee2e6; border-radius: 8px; padding: 0.625rem 0.75rem; font-size: 0.95rem; }
        .btn-send { background: #10b981; color: white; border: 0; padding: 0 1rem; border-radius: 8px; cursor: pointer; }
        .btn-send:disabled { background: #a7f3d0; cursor: not-allowed; }
        .bubble :global(h1), .bubble :global(h2), .bubble :global(h3) { margin: 0.2rem 0; }
        .bubble :global(ul) { margin: 0.25rem 0 0.25rem 1rem; }
        .bubble :global(code) { background: #f3f4f6; padding: 0.1rem 0.25rem; border-radius: 4px; }
        .suggest { padding: 0 0.75rem 0.75rem; }
        .btn-suggest { background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 0.35rem 0.6rem; cursor: pointer; }
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .modal { width: 520px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; font-weight: 600; }
        .btn-close { background: transparent; border: none; font-size: 1.25rem; cursor: pointer; }
        .modal-body { display: grid; gap: 0.5rem; padding: 0.75rem; }
        .q { text-align: left; border: 1px solid #d1d5db; background: #f9fafb; padding: 0.6rem 0.75rem; border-radius: 8px; cursor: pointer; }
        .q:hover { background: #f3f4f6; }
      `}</style>

      {showSuggest && (
        <div className="modal-backdrop" onClick={() => setShowSuggest(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>Gợi ý câu hỏi</div>
              <button className="btn-close" onClick={() => setShowSuggest(false)}>×</button>
            </div>
            <div className="modal-body">
              <button className="q" onClick={() => { setInput('Nhịp tim và SpO₂ gần đây của tôi có bình thường không?'); setShowSuggest(false) }}>Nhịp tim và SpO₂ gần đây của tôi có bình thường không?</button>
              <button className="q" onClick={() => { setInput('Tôi hay chóng mặt, với chỉ số hiện tại thì nên làm gì?'); setShowSuggest(false) }}>Tôi hay chóng mặt, với chỉ số hiện tại thì nên làm gì?</button>
              <button className="q" onClick={() => { setInput('Bạn tóm tắt sức khỏe gần đây của tôi trong 3 ý chính.'); setShowSuggest(false) }}>Bạn tóm tắt sức khỏe gần đây của tôi trong 3 ý chính.</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


