
import { useState, useEffect } from 'react';
import ReactJson from 'react-json-view';
import { Terminal, Copy, Trash2, Code2, AlertCircle, Check, FileType, Code, FileCode } from 'lucide-react';
import { parseRecursive } from './utils/jsonParser';
import { generateTypeScriptInterfaces, generateZodSchema } from './utils/generators';
import clsx from 'clsx';

type OutputMode = 'tree' | 'typescript' | 'zod';

function App() {
  const [input, setInput] = useState('');
  const [parsedData, setParsedData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [outputMode, setOutputMode] = useState<OutputMode>('tree');

  useEffect(() => {
    if (!input.trim()) {
      setParsedData(null);
      setError(null);
      return;
    }

    try {
      const result = parseRecursive(input);
      setParsedData(result);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Invalid JSON input");
    }
  }, [input]);

  const getOutputContent = () => {
    if (!parsedData) return '';
    if (outputMode === 'tree') return JSON.stringify(parsedData, null, 2);
    if (outputMode === 'typescript') return generateTypeScriptInterfaces(parsedData);
    if (outputMode === 'zod') return generateZodSchema(parsedData);
    return '';
  };

  const handleCopy = () => {
    const content = getOutputContent();
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInput('');
    setParsedData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Code2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                JSON Architect
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">Advanced Parser & Code Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <a
              href="https://github.com/gajjela521/json-processor"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid lg:grid-cols-2 gap-6 h-[calc(100vh-4rem)]">

        {/* Input Pane */}
        <div className="flex flex-col gap-3 h-full min-h-[400px]">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Input Payload
            </h2>
            <button
              onClick={handleClear}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          <div className="relative flex-1 group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Paste your JSON here (supports nested stringified JSON)...'
              className="w-full h-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
              spellCheck={false}
            />
            {/* Glow effect on hover/focus */}
            <div className="absolute inset-0 rounded-xl bg-indigo-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
          </div>
        </div>

        {/* Output Pane */}
        <div className="flex flex-col gap-3 h-full min-h-[400px]">
          <div className="flex items-center justify-between px-1">
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button
                onClick={() => setOutputMode('tree')}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all",
                  outputMode === 'tree' ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <FileType className="w-3.5 h-3.5" />
                Tree View
              </button>
              <button
                onClick={() => setOutputMode('typescript')}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all",
                  outputMode === 'typescript' ? "bg-blue-500/20 text-blue-300 shadow-sm" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Code className="w-3.5 h-3.5" />
                TypeScript
              </button>
              <button
                onClick={() => setOutputMode('zod')}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all",
                  outputMode === 'zod' ? "bg-amber-500/20 text-amber-300 shadow-sm" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <FileCode className="w-3.5 h-3.5" />
                Zod Schema
              </button>
            </div>

            <button
              onClick={handleCopy}
              disabled={!parsedData}
              className={clsx(
                "text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200",
                copied
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "hover:bg-slate-800 text-slate-400 hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className={clsx(
            "flex-1 rounded-xl border overflow-hidden transition-all relative flex flex-col",
            error
              ? "bg-red-950/10 border-red-900/30"
              : "bg-slate-900/50 border-slate-800"
          )}>
            {error ? (
              <div className="flex items-center justify-center h-full text-red-400 gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            ) : parsedData ? (
              <>
                {outputMode === 'tree' ? (
                  <div className="p-4 overflow-auto h-full">
                    <ReactJson
                      src={parsedData as object}
                      theme="ocean"
                      style={{ backgroundColor: 'transparent', fontSize: '14px' }}
                      displayDataTypes={false}
                      displayObjectSize={true}
                      enableClipboard={true}
                      collapsed={false}
                      indentWidth={4}
                    />
                  </div>
                ) : (
                  <pre className="p-4 overflow-auto h-full text-sm font-mono text-slate-300 leading-relaxed custom-scrollbar">
                    {getOutputContent()}
                  </pre>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                  <Code2 className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-sm">Waiting for input...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
