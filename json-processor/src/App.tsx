
import { useState, useEffect } from 'react';
import ReactJson from 'react-json-view';
import { Terminal, Copy, Trash2, Code2, AlertCircle, Check, FileType, Code, FileCode, BookOpen, ExternalLink, Database, Coffee } from 'lucide-react';
import { parseRecursive } from './utils/jsonParser';
import { generateTypeScriptInterfaces, generateZodSchema, generateJavaPOJO, generateSqlDDL } from './utils/generators';
import clsx from 'clsx';

type OutputMode = 'tree' | 'typescript' | 'zod' | 'java' | 'sql';

const SAMPLE_JSON = {
  "userId": 12345,
  "username": "jdoe_dev",
  "isActive": true,
  "roles": ["admin", "editor"],
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "age": 32,
    "contact": {
      "email": "john.doe@example.com",
      "phone": "+1-555-0123"
    }
  },
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "newsletter_opt_in": false
  },
  "lastLogin": "2024-03-15T10:30:00Z",
  "loginHistory": [
    { "ip": "192.168.1.1", "device": "MacBook Pro" },
    { "ip": "10.0.0.1", "device": "iPhone 15" }
  ]
};

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
    if (outputMode === 'java') return generateJavaPOJO(parsedData);
    if (outputMode === 'sql') return generateSqlDDL(parsedData);
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

  const handleSample = () => {
    setInput(JSON.stringify(SAMPLE_JSON, null, 2));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans selection:bg-indigo-500/30">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col h-screen sticky top-0">
        {/* Logo Area */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Code2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                JSON Arch
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Advanced Parser & Code Generator</p>
        </div>

        {/* Navigation / Main Actions */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <button
            onClick={handleClear}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-all group"
          >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Clear Workspace
          </button>

          <div className="my-4 border-t border-slate-800/50" />

          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Analysis & Viz</p>
            <button
              onClick={() => setOutputMode('tree')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                outputMode === 'tree' ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <FileType className="w-4 h-4" />
              Tree View
            </button>
          </div>

          <div className="mt-6 space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Code Generation</p>
            <button
              onClick={() => setOutputMode('typescript')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                outputMode === 'typescript' ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <Code className="w-4 h-4" />
              TypeScript
            </button>
            <button
              onClick={() => setOutputMode('zod')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                outputMode === 'zod' ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <FileCode className="w-4 h-4" />
              Zod Schema
            </button>
            <button
              onClick={() => setOutputMode('java')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                outputMode === 'java' ? "bg-red-500/10 text-red-300 border border-red-500/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <Coffee className="w-4 h-4" />
              Java (Jackson)
            </button>
            <button
              onClick={() => setOutputMode('sql')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                outputMode === 'sql' ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <Database className="w-4 h-4" />
              SQL Schema
            </button>
          </div>
        </div>

        {/* Industry Standards Footer (Fixed Bottom) */}
        <div className="p-6 border-t border-slate-800/50 bg-slate-900/30">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" />
            Industry Standards
          </h3>
          <nav className="flex flex-col gap-2.5 text-xs">
            <a
              href="https://www.json.org/json-en.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-indigo-300 flex items-center gap-2 transition-colors group"
            >
              <div className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-indigo-400 transition-colors" />
              JSON.org
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
            </a>
            <a
              href="https://www.ecma-international.org/publications-and-standards/standards/ecma-404/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-indigo-300 flex items-center gap-2 transition-colors group"
            >
              <div className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-indigo-400 transition-colors" />
              ECMA-404
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
            </a>
            <a
              href="https://datatracker.ietf.org/doc/html/rfc8259"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-indigo-300 flex items-center gap-2 transition-colors group"
            >
              <div className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-indigo-400 transition-colors" />
              IETF RFC 8259
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
            </a>
          </nav>
          <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-600">
            <a href="https://github.com/gajjela521/json-processor" target="_blank" rel="noopener" className="hover:text-slate-400 transition-colors flex items-center gap-1.5">
              <Terminal className="w-3 h-3" />
              GitHub Repo
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-screen flex flex-col">
        {/* Header - Simplified */}
        <header className="px-6 h-16 flex items-center justify-between border-b border-slate-800 bg-slate-900/30">
          <h2 className="text-sm font-semibold text-slate-400">Workspace</h2>
          {!!parsedData && (
            <button
              onClick={handleCopy}
              className={clsx(
                "text-xs flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border",
                copied
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy Output'}
            </button>
          )}
        </header>

        <div className="flex-1 p-6 grid lg:grid-cols-2 gap-6 overflow-hidden min-h-0">
          {/* Input Pane */}
          <div className="flex flex-col gap-3 h-full min-h-0">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Input Payload
              </h2>
              <button
                onClick={handleSample}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-500/20 bg-indigo-500/10"
              >
                <Code className="w-3.5 h-3.5" />
                Load Sample
              </button>
            </div>

            <div className="relative flex-1 group min-h-0">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Paste your JSON here (supports nested stringified JSON)...'
                className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600 custom-scrollbar"
                spellCheck={false}
              />
              <div className="absolute inset-0 rounded-xl bg-indigo-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
            </div>
          </div>

          {/* Output Pane */}
          <div className="flex flex-col gap-3 h-full min-h-0">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                {outputMode === 'tree' ? <FileType className="w-4 h-4" /> :
                  outputMode === 'typescript' ? <Code className="w-4 h-4" /> :
                    outputMode === 'zod' ? <FileCode className="w-4 h-4" /> :
                      outputMode === 'java' ? <Coffee className="w-4 h-4" /> :
                        <Database className="w-4 h-4" />
                }
                {outputMode === 'tree' ? 'Tree Visualization' :
                  outputMode === 'typescript' ? 'TypeScript Definitions' :
                    outputMode === 'zod' ? 'Zod Validation Schema' :
                      outputMode === 'java' ? 'Java POJO (Lombok)' :
                        'SQL Table Schema'}
              </h2>
            </div>

            <div className={clsx(
              "flex-1 rounded-xl border overflow-hidden transition-all relative flex flex-col min-h-0",
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
                    <div className="p-4 overflow-auto h-full custom-scrollbar">
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
                    <pre className="p-4 overflow-auto h-full text-sm font-mono text-slate-300 leading-relaxed custom-scrollbar bg-slate-900/50">
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
        </div>
      </main>
    </div>
  );
}

export default App;
