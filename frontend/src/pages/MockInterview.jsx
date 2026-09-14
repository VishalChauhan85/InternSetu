import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';
import Navbar from '../components/Navbar';

const buildInterviewerInstructions = (targetRole) =>
  `You are acting as a professional, friendly but rigorous technical recruiter conducting a mock interview for the role of "${targetRole}". Ask one interview question at a time, wait for the candidate's answer, then react briefly and ask a relevant follow-up or new question based on their response. Keep questions realistic for an internship or entry-level candidate. Stay in character as the recruiter at all times and do not add meta commentary.`;

const buildTranscriptText = (messages) =>
  messages
    .map((m) => `${m.sender === 'ai' ? 'Recruiter' : 'Candidate'}: ${m.text}`)
    .join('\n');

const MockInterview = () => {
  const [targetRole, setTargetRole] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [starting, setStarting] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');

  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState('');
  const [evalError, setEvalError] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!targetRole.trim()) return;

    setStarting(true);
    setChatError('');
    try {
      const instructions = buildInterviewerInstructions(targetRole);
      const { data } = await aiAPI.chat({
        message: `${instructions}\n\nBegin the interview now: introduce yourself in one line and ask the first question.`,
      });
      setMessages([{ sender: 'ai', text: data.reply }]);
      setInterviewStarted(true);
    } catch (err) {
      setChatError(
        err?.response?.data?.message || 'Could not start the mock interview. Please try again.'
      );
    } finally {
      setStarting(false);
    }
  };

  const handleSendAnswer = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = { sender: 'user', text: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setSending(true);
    setChatError('');

    try {
      const instructions = buildInterviewerInstructions(targetRole);
      const transcript = buildTranscriptText(updatedMessages);
      const { data } = await aiAPI.chat({
        message: `${instructions}\n\nInterview transcript so far:\n${transcript}\n\nRespond as the recruiter: react briefly to the candidate's last answer, then ask the next interview question.`,
      });
      setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (err) {
      setChatError(
        err?.response?.data?.message || 'The recruiter is unavailable right now. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleGetFeedback = async () => {
    if (messages.length === 0) return;

    setEvaluating(true);
    setEvalError('');
    try {
      const transcript = buildTranscriptText(messages);
      const { data } = await aiAPI.evaluateInterview({ transcript, targetRole });
      setEvaluation(data.evaluation || data.analysis || 'No feedback was returned.');
    } catch (err) {
      setEvalError(
        err?.response?.data?.message || 'Could not generate feedback right now. Please try again.'
      );
    } finally {
      setEvaluating(false);
    }
  };

  const handleRestart = () => {
    setTargetRole('');
    setInterviewStarted(false);
    setMessages([]);
    setInput('');
    setChatError('');
    setEvaluation('');
    setEvalError('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">AI Mock Interview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Practice with an AI recruiter and get honest, structured feedback afterward.
          </p>
        </div>

        {/* ---------- Setup screen ---------- */}
        {!interviewStarted && !evaluation && (
          <div className="card p-6">
            <form onSubmit={handleStartInterview} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  What role are you practicing for?
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Frontend Developer Intern"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                />
              </div>

              {chatError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {chatError}
                </div>
              )}

              <button type="submit" disabled={starting || !targetRole.trim()} className="btn-primary">
                {starting ? 'Starting interview...' : 'Start Mock Interview'}
              </button>
            </form>
          </div>
        )}

        {/* ---------- Chat screen ---------- */}
        {interviewStarted && !evaluation && (
          <div className="card p-0 overflow-hidden flex flex-col" style={{ height: '65vh' }}>
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Mock Interview</p>
                <p className="text-xs text-slate-500">Role: {targetRole}</p>
              </div>
              <button
                onClick={handleGetFeedback}
                disabled={evaluating || messages.length === 0}
                className="btn-secondary !px-3 !py-2 text-xs"
              >
                {evaluating ? 'Scoring...' : 'End Interview & Get Feedback'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                      m.sender === 'user'
                        ? 'bg-indigo-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-400">
                    Recruiter is typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {chatError && (
              <div className="mx-5 mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {chatError}
              </div>
            )}
            {evalError && (
              <div className="mx-5 mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {evalError}
              </div>
            )}

            <form onSubmit={handleSendAnswer} className="border-t border-slate-200 px-4 py-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer..."
                disabled={sending}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="btn-primary !px-4 !py-2.5 text-sm"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* ---------- Feedback screen ---------- */}
        {evaluation && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Interview Feedback</h2>
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {evaluation}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleRestart} className="btn-primary">
                Start New Interview
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MockInterview;
