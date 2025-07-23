import React, { useRef, useState, useEffect } from "react";
import { queryRCCAs } from '../services/api';

interface ChatbotProps {
  onClose?: () => void;
}

async function getGeminiResponse(message: string) {
  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  if (data.error) {
    return data.error.message || 'API error';
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response.";
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<{ text: string | JSX.Element; user: boolean; showImage?: boolean }[]>([
    { text: "Hi, how may I help you?", user: false, showImage: true }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'data' | 'general' | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const addMessage = (text: string | JSX.Element, user: boolean, showImage?: boolean) => {
    setMessages((msgs) => [...msgs, { text, user, showImage }]);
  };

  useEffect(() => {
    // Always scroll to bottom when messages change
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Flexible keyword-based parser for Data Query mode
  function parseFlexibleQuery(userText: string) {
    const text = userText.toLowerCase();
    let intent = 'list_rccas';
    let filters: any = {};
    let groupByDate = false;

    // Date-based aggregation
    if (/date.*(most|highest|top|max)/.test(text) || /(most|highest|top|max).*date/.test(text)) {
      intent = 'most_by_field';
      filters.field = 'createdAt';
      groupByDate = true;
    }
    if (/date.*(least|lowest|min)/.test(text) || /(least|lowest|min).*date/.test(text)) {
      intent = 'least_by_field';
      filters.field = 'createdAt';
      groupByDate = true;
    }
    // Factory-based aggregation
    if (/factory.*(most|highest|top|max)/.test(text)) {
      intent = 'most_by_field';
      filters.field = 'factoryName';
    }
    if (/factory.*(least|lowest|min)/.test(text)) {
      intent = 'least_by_field';
      filters.field = 'factoryName';
    }
    // Shift-based aggregation
    if (/shift.*(most|highest|top|max)/.test(text)) {
      intent = 'most_by_field';
      filters.field = 'problemNoticedShift';
      if (/dpl ?1/.test(text)) filters.factoryName = 'DPL 1';
      if (/dpl ?2/.test(text)) filters.factoryName = 'DPL 2';
      if (/uril/.test(text)) filters.factoryName = 'URIL';
    }
    if (/shift.*(least|lowest|min)/.test(text)) {
      intent = 'least_by_field';
      filters.field = 'problemNoticedShift';
      if (/dpl ?1/.test(text)) filters.factoryName = 'DPL 1';
      if (/dpl ?2/.test(text)) filters.factoryName = 'DPL 2';
      if (/uril/.test(text)) filters.factoryName = 'URIL';
    }
    // List by mentionProblem
    const mentionMatch = userText.match(/related to ([\w\s-]+)/i);
    if (mentionMatch) {
      intent = 'list_rccas';
      filters.mentionProblem = mentionMatch[1].trim();
    }
    // Field and value detection
    if (/department/.test(text)) {
      const match = userText.match(/department(?:\s+| of | for | in )([\w\s&-]+)/i);
      if (match) filters.department = match[1].replace(/\?|\./g, '').trim();
      const capMatch = userText.match(/in the ([A-Z][a-zA-Z ]+)/);
      if (capMatch) filters.department = capMatch[1].trim();
      if (intent === 'most_by_field' || intent === 'least_by_field') filters.field = 'department';
    }
    if (/error category|category/.test(text)) {
      const match = userText.match(/category(?:\s+| of | for | in )([\w\s&-]+)/i);
      if (match) filters.errorCategory = match[1].replace(/\?|\./g, '').trim();
      if (intent === 'most_by_field' || intent === 'least_by_field') filters.field = 'errorCategory';
    }
    if (/machine|equipment/.test(text)) {
      const match = userText.match(/(?:machine|equipment)(?:\s+| of | for | in )([\w\s&-]+)/i);
      if (match) filters.machine = match[1].replace(/\?|\./g, '').trim();
      if (intent === 'most_by_field' || intent === 'least_by_field') filters.field = 'sapEquipment';
    }
    if (/employee|user|person/.test(text)) {
      const match = userText.match(/(?:employee|user|person)(?:\s+| of | for | in )([\w\s&-]+)/i);
      if (match) filters.createdBy = match[1].replace(/\?|\./g, '').trim();
      if (intent === 'most_by_field' || intent === 'least_by_field') filters.field = 'createdBy';
    }
    if (/approved/.test(text)) filters.status = 'Approved';
    if (/rejected/.test(text)) filters.status = 'Rejected';
    if (/draft/.test(text)) filters.status = 'Draft';
    if (/pending/.test(text)) filters.status = 'Pending';
    if (/dpl ?1/.test(text)) filters.factoryName = 'DPL 1';
    if (/dpl ?2/.test(text)) filters.factoryName = 'DPL 2';
    if (/uril/.test(text)) filters.factoryName = 'URIL';
    // Date extraction (YYYY-MM-DD or DD Month)
    const dateMatch = userText.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) filters.date = dateMatch[1];
    const dayMonthMatch = userText.match(/(\d{1,2} [A-Za-z]+)/);
    if (dayMonthMatch) filters.date = dayMonthMatch[1];

    // Fallback: if asking for most/least and no field detected, guess from context
    if ((intent === 'most_by_field' || intent === 'least_by_field') && !filters.field) {
      if (/department/.test(text)) filters.field = 'department';
      else if (/category/.test(text)) filters.field = 'errorCategory';
      else if (/machine|equipment/.test(text)) filters.field = 'sapEquipment';
      else if (/employee|user|person/.test(text)) filters.field = 'createdBy';
    }
    return { intent, filters, groupByDate };
  }

  const sendMessage = async (overrideInput?: string) => {
    const messageToSend = overrideInput !== undefined ? overrideInput : input;
    if (!messageToSend.trim() || loading || !mode) return;
    const userText = messageToSend.trim();
    addMessage(userText, true);
    setInput("");
    setLoading(true);
    try {
      if (mode === 'general') {
        const botText = await getGeminiResponse(userText);
        addMessage(botText, false);
      } else if (mode === 'data') {
        // Use flexible keyword-based parser
        const { intent, filters, groupByDate } = parseFlexibleQuery(userText);
        const data = await queryRCCAs(intent, filters, groupByDate);
        if ((intent === 'most_by_field' || intent === 'least_by_field') && data.value) {
          addMessage(`The ${filters.field}${groupByDate ? ' (date)' : ''} with the ${intent === 'most_by_field' ? 'most' : 'least'} RCCAs is "${data.value}" (${data.count} RCCAs).`, false);
        } else if (intent === 'count') {
          addMessage(`Total RCCAs${filters.department ? ' in ' + filters.department : ''}${filters.status ? ' with status ' + filters.status : ''}: ${data.count}`, false);
        } else if (data.rccas && data.rccas.length > 0) {
          addMessage(
            <span>
              Found {data.rccas.length} RCCAs:<br />
              <ul style={{ paddingLeft: 18 }}>
                {data.rccas.slice(0, 10).map((rcca: any) => (
                  <li key={rcca._id}>
                    <a href={`/rcca/${rcca._id}`} target="_blank" rel="noopener noreferrer">
                      RCCA #{rcca.notificationNumber || rcca._id} - {rcca.problemStatement?.slice(0, 40) || 'No statement'}
                    </a>
                  </li>
                ))}
                {data.rccas.length > 10 && <li>...and more</li>}
              </ul>
            </span>,
            false
          );
        } else {
          addMessage('No RCCAs found for your query.', false);
        }
      }
    } catch {
      addMessage("Sorry, I couldn't get a response.", false);
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chatbot-container" style={{
      width: 400,
      height: '55vh',
      position: 'fixed',
      right: 0,
      bottom: 0,
      background: "#f9f9f9",
      borderRadius: '15px 0 0 15px',
      boxShadow: "-2px 0 15px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      zIndex: 1000
    }}>
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close Chatbot"
          style={{ zIndex: 10, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >×</button>
      )}
      <div className="chatbot-header" style={{
        background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", padding: 15, textAlign: "center", fontWeight: 600, borderRadius: '15px 0 0 0'
      }}>Welcome to Lance </div>
      {/* Mode selector */}
      <div style={{ padding: 10, display: 'flex', gap: 16, alignItems: 'center', background: '#f3f4f6' }}>
        <label style={{ fontWeight: 500 }}>Mode:</label>
        <label><input type="radio" name="mode" value="data" checked={mode === 'data'} onChange={() => setMode('data')} /> Data Query</label>
        <label><input type="radio" name="mode" value="general" checked={mode === 'general'} onChange={() => setMode('general')} /> General</label>
      </div>
      <div
        className="chat-messages"
        ref={chatRef}
        style={{
          flex: 1,
          padding: 15,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minHeight: 0,
          maxHeight: 'calc(55vh - 120px)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#a5b4fc #f3f4f6',
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.user ? "user" : "bot"}`} style={{
            display: "flex", alignItems: "flex-end", gap: 10, justifyContent: msg.user ? "flex-end" : "flex-start"
          }}>
            {!msg.user && msg.showImage && (
              <img 
                src="https://i.ibb.co/VWSn822K/Screenshot-2025-07-23-085357-removebg-preview.png" 
                alt="Chatbot" 
                style={{ 
                  width: 32, 
                  height: 32, 
                  objectFit: 'cover',
                  borderRadius: '50%',
                  backgroundColor: '#E91E63',
                  marginRight: 8
                }} 
              />
            )}
            <div className="message-content" style={{
              maxWidth: "70%", padding: "10px 14px", borderRadius: 15, fontSize: 14, lineHeight: 1.4,
              background: msg.user ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#e5e7eb",
              color: msg.user ? "white" : "#111827"
            }}>{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="message bot" style={{ display: "flex", alignItems: "flex-end", gap: 10, justifyContent: "flex-start" }}>
            <div className="message-content" style={{
              maxWidth: "70%", padding: "10px 14px", borderRadius: 15, fontSize: 14, lineHeight: 1.4,
              background: "#e5e7eb", color: "#111827"
            }}>...</div>
          </div>
        )}
      </div>
      <div className="chat-input-container" style={{
        padding: 10, borderTop: "1px solid #ddd", display: "flex", background: '#f9f9f9', borderRadius: '0 0 0 15px'
      }}>
        <input
          type="text"
          className="chat-input"
          style={{
            flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 20, fontSize: 14
          }}
          placeholder={mode === null ? "Select a mode to start..." : "Type a message..."}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loading || !mode}
        />
        <button
          className="send-button"
          style={{
            marginLeft: 10, background: "#4f46e5", color: "white", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: 16
          }}
          onClick={() => sendMessage()}
          disabled={loading || !mode}
        >➤</button>
      </div>
    </div>
  );
};

export default Chatbot; 