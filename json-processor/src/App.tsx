
import { useState, useEffect, useMemo } from 'react';
import { JsonView, allExpanded, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import {
  Terminal, Copy, Trash2, Code2, AlertCircle, Check, FileType, Code, FileCode,
  Database, Coffee, Leaf, Diff, FileText, Table, Minimize2, Maximize2,
  Search, Shield, Wand2, Globe, Play, Clock, Wifi, AlertTriangle
} from 'lucide-react';
import { smartParse, type ParseResult } from './utils/smartParser';
import { toYaml, toXml, toCsv } from './utils/converters';
import { generateTypeScriptInterfaces, generateZodSchema, generateJavaPOJO, generateSqlDDL, generateMongooseSchema } from './utils/generators';
import { queryJson } from './utils/queryEngine';
import { decodeJwt, isPossiblyJwt, type JwtDetails } from './utils/jwtDebugger';
import { generateMockData, SAMPLE_TEMPLATE } from './utils/mockGenerator';
import { runTransformer } from './utils/transformer';
import { toBase64, fromBase64, urlEncode, urlDecode, escapeJson, unescapeJson } from './utils/stringUtils';
import { executeRequest, type ApiResponse } from './utils/apiClient';
import clsx from 'clsx';
import * as DiffUtil from 'diff';

type OutputMode =
  // Viz
  'tree' | 'diff' |
  // Converters
  'yaml' | 'xml' | 'csv' |
  // Generators
  'typescript' | 'zod' | 'java' | 'sql' | 'mongoose' |
  // Tools
  'query' | 'jwt' | 'mock' | 'transform' | 'utils' | 'api';

const SAMPLE_JSON = {
  "userId": 12345,
  "username": "jdoe_dev",
  "isActive": true,
  "roles": ["admin", "editor"],
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "age": 32,
    "contact": { "email": "john.doe@example.com", "phone": "+1-555-0123" }
  },
  "preferences": { "theme": "dark", "notifications": true },
  "lastLogin": "2024-03-15T10:30:00Z",
  "loginHistory": [
    { "ip": "192.168.1.1", "device": "MacBook Pro" },
    { "ip": "10.0.0.1", "device": "iPhone 15" }
  ]
};

function App() {
  const [input, setInput] = useState('');
  const [secondInput, setSecondInput] = useState(''); // For Diff or Transformer Code
  const [parsedData, setParsedData] = useState<unknown>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [outputMode, setOutputMode] = useState<OutputMode>('tree');
  const [inputTab, setInputTab] = useState<'primary' | 'secondary' | 'headers' | 'params'>('primary');

  // Tool Specific States
  const [jqQuery, setJqQuery] = useState('');
  const [mockCount, setMockCount] = useState(5);
  const [jwtData, setJwtData] = useState<JwtDetails | null>(null);

  // API Client State
  const [apiMethod, setApiMethod] = useState('GET');
  const [apiUrl, setApiUrl] = useState('');
  const [apiHeaders, setApiHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiUseProxy, setApiUseProxy] = useState(false);

  // Auto-detect JWT
  useEffect(() => {
    if (input && isPossiblyJwt(input)) {
      if (outputMode !== 'jwt') {
        // Optional: Auto-switch could be annoying, maybe just show a badge prompt?
        // For now, let's just decode it silently to be ready
      }
      setJwtData(decodeJwt(input));
    } else {
      setJwtData(null);
    }
  }, [input]);

  // Main Parser Effect
  useEffect(() => {
    if (outputMode === 'mock' || outputMode === 'api') {
      // Mock and API modes handle input differently (or ignore it for API response view)
      setError(null);
      return;
    }

    if (!input.trim()) {
      setParsedData(null);
      setParseResult(null);
      setError(null);
      return;
    }

    // If parsing JWT, we don't need smartParse JSON
    if (outputMode === 'jwt') return;

    // Tools mode handles raw string too
    if (outputMode === 'utils') {
      setParsedData(input); // Just pass through
      return;
    }

    const result = smartParse(input);
    if (result.data) {
      setParsedData(result.data);
      setParseResult(result);
      setError(null);
    } else {
      setParsedData(null);
      setParseResult(result);
      // Only show error if we strictly need JSON
      if (['tree', 'diff', 'yaml', 'xml', 'csv', 'typescript', 'java', 'sql'].includes(outputMode)) {
        setError(result.error || "Invalid input format");
      }
    }
  }, [input, outputMode]);


  // Computed Outputs
  const diffResult = useMemo(() => {
    if (outputMode !== 'diff') return null;
    let obj1 = parsedData;
    let obj2 = null;
    const res2 = smartParse(secondInput);
    if (res2.data) obj2 = res2.data;

    if (obj1 && obj2) return DiffUtil.diffJson(obj1 as object | [], obj2 as object | []);
    return DiffUtil.diffLines(input, secondInput);
  }, [input, secondInput, parsedData, outputMode]);

  const transformResult = useMemo(() => {
    if (outputMode !== 'transform' || !parsedData) return null;
    if (!secondInput.trim()) return parsedData; // No code yet
    return runTransformer(parsedData, secondInput);
  }, [parsedData, secondInput, outputMode]);

  const queryResult = useMemo(() => {
    if (outputMode !== 'query' || !parsedData) return null;
    return queryJson(parsedData, jqQuery);
  }, [parsedData, jqQuery, outputMode]);

  const mockResult = useMemo(() => {
    if (outputMode !== 'mock') return null;
    return generateMockData(input, mockCount);
  }, [input, mockCount, outputMode]);

  const getOutputContent = () => {
    // Special Handling
    if (outputMode === 'diff') return '';
    if (outputMode === 'jwt') return '';
    if (outputMode === 'utils') return '';
    if (outputMode === 'api') return ''; // Handled in render

    // Viz tools that render components, handled in render:
    if (outputMode === 'tree') return JSON.stringify(parsedData, null, 2);
    if (outputMode === 'query') return JSON.stringify(queryResult, null, 2);
    if (outputMode === 'transform') return JSON.stringify(transformResult, null, 2);
    if (outputMode === 'mock') return JSON.stringify(mockResult, null, 2);

    if (!parsedData) return '';

    try {
      if (outputMode === 'typescript') return generateTypeScriptInterfaces(parsedData);
      if (outputMode === 'zod') return generateZodSchema(parsedData);
      if (outputMode === 'java') return generateJavaPOJO(parsedData);
      if (outputMode === 'sql') return generateSqlDDL(parsedData);
      if (outputMode === 'mongoose') return generateMongooseSchema(parsedData);
      if (outputMode === 'yaml') return toYaml(parsedData);
      if (outputMode === 'xml') return toXml(parsedData);
      if (outputMode === 'csv') return toCsv(parsedData);
    } catch (err) {
      return `Error generating output: ${err}`;
    }
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

  const handleApiCopyLogs = () => {
    if (apiResponse?.error) {
      navigator.clipboard.writeText(apiResponse.error);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const handleClear = () => {
    setInput('');
    setSecondInput('');
    setParsedData(null);
    setError(null);
    setJqQuery('');
    setApiResponse(null);
  };

  // Execute API Request
  const handleApiSend = async () => {
    if (!apiUrl) return;
    setApiLoading(true);
    setApiResponse(null);

    let parsedHeaders = {};
    try {
      parsedHeaders = JSON.parse(apiHeaders);
    } catch {
      // ignore invalid headers
    }

    const res = await executeRequest({
      method: apiMethod,
      url: apiUrl,
      headers: parsedHeaders,
      body: input, // Use main input as body
      useProxy: apiUseProxy
    });

    setApiResponse(res);
    setApiLoading(false);
  };

  const handleSample = () => {
    if (outputMode === 'mock') {
      setInput(SAMPLE_TEMPLATE);
      return;
    }
    if (outputMode === 'jwt') {
      setInput('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      return;
    }
    if (outputMode === 'transform') {
      setInput(JSON.stringify(SAMPLE_JSON, null, 2));
      setSecondInput('// Return list of roles\nreturn data.roles;');
      return;
    }
    if (outputMode === 'api') {
      setApiUrl('https://jsonplaceholder.typicode.com/posts/1');
      setApiMethod('GET');
      return;
    }

    setInput(JSON.stringify(SAMPLE_JSON, null, 2));
    if (outputMode === 'diff') {
      const modified = { ...SAMPLE_JSON, username: "jdoe_updated", newField: "Detected!" };
      setSecondInput(JSON.stringify(modified, null, 2));
    }
  };

  const handleFormat = (type: 'minify' | 'prettify') => {
    if (!parsedData && outputMode !== 'mock' && outputMode !== 'api') return;

    const target = outputMode === 'mock' || outputMode === 'api' ? input : JSON.stringify(parsedData);

    try {
      const obj = typeof target === 'string' ? JSON.parse(target) : target;
      const formatted = type === 'minify' ? JSON.stringify(obj) : JSON.stringify(obj, null, 2);

      if (inputTab === 'primary') setInput(formatted);
      else if (inputTab === 'secondary') setSecondInput(formatted);
      else if (inputTab === 'headers') setApiHeaders(formatted);
    } catch { }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans selection:bg-indigo-500/30">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col h-screen sticky top-0 flex-shrink-0">
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
          <p className="text-xs text-slate-500 mt-2">Dev & Data Toolkit</p>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">


          {/* Section: API Client */}
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Network</p>
            <SidebarBtn active={outputMode === 'api'} onClick={() => { setOutputMode('api'); setInputTab('primary'); }} icon={Globe} label="API Client" />
          </div>

          {/* Section: Analysis */}
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Analyze & Query</p>
            <SidebarBtn active={outputMode === 'tree'} onClick={() => setOutputMode('tree')} icon={FileType} label="Tree View" />
            <SidebarBtn active={outputMode === 'diff'} onClick={() => setOutputMode('diff')} icon={Diff} label="Diff / Compare" />
            <SidebarBtn active={outputMode === 'query'} onClick={() => setOutputMode('query')} icon={Search} label="Query (JMESPath)" />
            <SidebarBtn active={outputMode === 'jwt'} onClick={() => setOutputMode('jwt')} icon={Shield} label="JWT Debugger" />
          </div>

          {/* Section: Modify */}
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Modify & Mock</p>
            <SidebarBtn active={outputMode === 'transform'} onClick={() => setOutputMode('transform')} icon={Wand2} label="JS Transformer" />
            <SidebarBtn active={outputMode === 'mock'} onClick={() => setOutputMode('mock')} icon={GhostIcon} label="Mock Generator" />
            <SidebarBtn active={outputMode === 'utils'} onClick={() => setOutputMode('utils')} icon={WrenchIcon} label="String Utils" />
          </div>

          {/* Section: Convert */}
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Convert & Export</p>
            <SidebarBtn active={outputMode === 'yaml'} onClick={() => setOutputMode('yaml')} icon={FileText} label="To YAML" />
            <SidebarBtn active={outputMode === 'xml'} onClick={() => setOutputMode('xml')} icon={Code} label="To XML" />
            <SidebarBtn active={outputMode === 'csv'} onClick={() => setOutputMode('csv')} icon={Table} label="To CSV" />
          </div>

          {/* Section: Gen Code */}
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Code Generation</p>
            <SidebarBtn active={outputMode === 'typescript'} onClick={() => setOutputMode('typescript')} icon={FileCode} label="TypeScript" />
            <SidebarBtn active={outputMode === 'zod'} onClick={() => setOutputMode('zod')} icon={Check} label="Zod Schema" />
            <SidebarBtn active={outputMode === 'java'} onClick={() => setOutputMode('java')} icon={Coffee} label="Java (Jackson)" />
            <SidebarBtn active={outputMode === 'sql'} onClick={() => setOutputMode('sql')} icon={Database} label="SQL Schema" />
            <SidebarBtn active={outputMode === 'mongoose'} onClick={() => setOutputMode('mongoose')} icon={Leaf} label="Mongoose" />
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 h-16 flex items-center justify-between border-b border-slate-800 bg-slate-900/30 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            {outputMode === 'api' ? (
              <div className="flex items-center gap-2 w-full max-w-3xl">
                <div className="relative">
                  <input
                    list="http-methods"
                    type="text"
                    value={apiMethod}
                    onChange={(e) => setApiMethod(e.target.value.toUpperCase())}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-24 uppercase placeholder-indigo-400/50"
                    placeholder="GET"
                  />
                  <datalist id="http-methods">
                    <option value="GET" />
                    <option value="POST" />
                    <option value="PUT" />
                    <option value="DELETE" />
                    <option value="PATCH" />
                    <option value="HEAD" />
                    <option value="OPTIONS" />
                  </datalist>
                </div>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="Enter request URL (e.g. https://api.example.com/data)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleApiSend}
                  disabled={apiLoading || !apiUrl}
                  className={clsx(
                    "flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all text-white shadow-lg shadow-indigo-500/20",
                    apiLoading ? "bg-slate-700 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95"
                  )}
                >
                  {apiLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  Send
                </button>
                <button
                  onClick={() => setApiUseProxy(!apiUseProxy)}
                  className={clsx(
                    "p-2 rounded-lg border transition-all text-xs font-bold uppercase",
                    apiUseProxy ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50" : "bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300"
                  )}
                  title="Enable CORS Proxy to bypass browser restrictions"
                >
                  {apiUseProxy ? 'Proxy On' : 'Proxy Off'}
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-slate-400">
                  {outputMode === 'jwt' ? 'JWT Debugger' :
                    outputMode === 'mock' ? 'Mock Data Generator' :
                      outputMode === 'transform' ? 'Live JS Transformer' :
                        'Workspace'}
                </h2>
                {(outputMode === 'jwt' && jwtData) && (
                  <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-mono border", jwtData.isValid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
                    {jwtData.isValid ? 'Valid Token Format' : 'Invalid Token'}
                  </span>
                )}
                {(parseResult && parseResult.format !== 'unknown' && outputMode !== 'mock' && outputMode !== 'utils') && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                    Detected: {parseResult.format.toUpperCase()}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Context Actions */}
            {(!!parsedData || outputMode === 'mock' || outputMode === 'api') && (
              <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-800 mr-2">
                <button onClick={() => handleFormat('minify')} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400" title="Minify Input">
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleFormat('prettify')} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400" title="Prettify Input">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* Copy Button */}
            <button
              onClick={outputMode === 'api' && apiResponse?.error ? handleApiCopyLogs : handleCopy}
              className={clsx(
                "text-xs flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border",
                copied
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : (outputMode === 'api' && apiResponse?.error ? 'Copy Logs' : 'Copy Output')}
            </button>
          </div>
        </header>

        {/* Workspace Grid */}
        <div className="flex-1 p-6 grid lg:grid-cols-2 gap-6 overflow-hidden min-h-0">

          {/* --- INPUT PANE --- */}
          <div className="flex flex-col gap-3 h-full min-h-0">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  {outputMode === 'mock' ? 'Data Template' :
                    outputMode === 'utils' ? 'Input String' :
                      outputMode === 'jwt' ? 'Encoded Token' :
                        outputMode === 'api' ? 'Request Body' :
                          'Input Payload'}
                </h2>

                {/* Diff & Transformer Tabs */}
                {(outputMode === 'diff' || outputMode === 'transform') && (
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button
                      onClick={() => setInputTab('primary')}
                      className={clsx("px-3 py-1 text-xs rounded-md transition-all", inputTab === 'primary' ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300")}
                    >
                      {outputMode === 'transform' ? 'Data' : 'Original'}
                    </button>
                    <button
                      onClick={() => setInputTab('secondary')}
                      className={clsx("px-3 py-1 text-xs rounded-md transition-all", inputTab === 'secondary' ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300")}
                    >
                      {outputMode === 'transform' ? 'JS Code' : 'Modified'}
                    </button>
                  </div>
                )}

                {/* API Tabs */}
                {outputMode === 'api' && (
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button
                      onClick={() => setInputTab('primary')}
                      className={clsx("px-3 py-1 text-xs rounded-md transition-all", inputTab === 'primary' ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300")}
                    >
                      Body
                    </button>
                    <button
                      onClick={() => setInputTab('headers')}
                      className={clsx("px-3 py-1 text-xs rounded-md transition-all", inputTab === 'headers' ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300")}
                    >
                      Headers
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleClear} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors border border-slate-700/50 hover:border-red-500/20">
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
                <button onClick={handleSample} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-500/20 bg-indigo-500/10">
                  <Code className="w-3.5 h-3.5" /> Load Sample
                </button>
              </div>
            </div>

            <div className="relative flex-1 group min-h-0">
              <textarea
                value={
                  (outputMode === 'diff' || outputMode === 'transform') && inputTab === 'secondary' ? secondInput :
                    outputMode === 'api' && inputTab === 'headers' ? apiHeaders :
                      input
                }
                onChange={(e) => {
                  if ((outputMode === 'diff' || outputMode === 'transform') && inputTab === 'secondary') setSecondInput(e.target.value);
                  else if (outputMode === 'api' && inputTab === 'headers') setApiHeaders(e.target.value);
                  else setInput(e.target.value);
                }}
                placeholder={
                  outputMode === 'api' && inputTab === 'headers' ? '{"Content-Type": "application/json"}' :
                    'Paste content here...'
                }
                className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600 custom-scrollbar"
                spellCheck={false}
              />
            </div>
          </div>

          {/* --- OUTPUT PANE --- */}
          <div className="flex flex-col gap-3 h-full min-h-0">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <span className="capitalize">{outputMode} Result</span>
              </h2>

              {/* Tool Specific Controls in Header */}
              {outputMode === 'query' && (
                <div className="relative w-64">
                  <input
                    type="text"
                    value={jqQuery}
                    onChange={(e) => setJqQuery(e.target.value)}
                    placeholder="JMESPath query (e.g. users[].name)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  <Search className="w-3 h-3 absolute right-3 top-1.5 text-slate-500" />
                </div>
              )}
              {outputMode === 'mock' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Count:</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={mockCount}
                    onChange={(e) => setMockCount(parseInt(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>

            <div className={clsx(
              "flex-1 rounded-xl border overflow-hidden transition-all relative flex flex-col min-h-0",
              (error && outputMode !== 'api') || (outputMode === 'api' && apiResponse?.error) ? "bg-red-950/10 border-red-900/30" : "bg-slate-900/50 border-slate-800"
            )}>
              {(error && outputMode !== 'api') ? (
                <div className="flex items-center justify-center h-full text-red-400 gap-2"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>
              ) : (
                <div className="h-full overflow-auto custom-scrollbar p-0">
                  {/* VIZ: API Response */}
                  {outputMode === 'api' && (
                    apiResponse ? (
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-800 bg-slate-900/50 text-xs text-slate-400">
                          <div className={clsx("flex items-center gap-1.5 font-bold", apiResponse.success ? "text-emerald-400" : "text-red-400")}>
                            <Wifi className="w-3 h-3" />
                            {apiResponse.status} {apiResponse.statusText}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {apiResponse.duration}ms
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Database className="w-3 h-3" />
                            {apiResponse.size}
                          </div>
                        </div>

                        {apiResponse.error ? (
                          <div className="flex-1 p-6 text-red-400 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                            <div className="flex items-center gap-2 mb-4 text-red-300 font-bold border-b border-red-500/20 pb-2">
                              <AlertTriangle className="w-5 h-5" />
                              Request Failed
                            </div>
                            {apiResponse.error}

                            <div className="mt-8 p-4 bg-red-900/10 border border-red-500/20 rounded-lg text-xs text-red-300/80">
                              <strong>Note:</strong> If you are trying to reach a local backend (localhost), ensure that:
                              <ul className="list-disc ml-5 mt-2 space-y-1">
                                <li>Your backend is running.</li>
                                <li>You have enabled <strong>CORS</strong> on your backend.</li>
                                <li>You are using 'http' not 'https' if strictly local.</li>
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 overflow-auto custom-scrollbar p-0 relative">
                            {apiResponse.data && typeof apiResponse.data === 'object' ? (
                              <div className="p-4">
                                <JsonView data={apiResponse.data as object} shouldExpandNode={allExpanded} style={darkStyles} />
                              </div>
                            ) : (
                              <pre className="p-4 text-sm font-mono text-slate-300">{String(apiResponse.data)}</pre>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4 min-h-[300px]">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                          <Globe className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-sm">Enter URL and hit Send</p>
                      </div>
                    )
                  )}

                  {/* VIZ: Tree / Query / Transform / Mock */}
                  {(outputMode === 'tree' || outputMode === 'query' || outputMode === 'transform' || outputMode === 'mock') && (
                    <div className="p-4">
                      <JsonView
                        data={
                          outputMode === 'query' ? (queryResult as object) :
                            outputMode === 'transform' ? (transformResult as object) :
                              outputMode === 'mock' ? (mockResult as object) :
                                (parsedData as object)
                        }
                        shouldExpandNode={allExpanded}
                        style={darkStyles}
                      />
                    </div>
                  )}

                  {/* VIZ: Diff */}
                  {outputMode === 'diff' && (
                    <div className="p-4 text-sm font-mono leading-relaxed">
                      {diffResult?.map((part, index) => (
                        <span key={index} className={clsx(part.added ? 'bg-emerald-500/20 text-emerald-300 block' : part.removed ? 'bg-red-500/20 text-red-400 block' : 'text-slate-400')}>{part.value}</span>
                      ))}
                    </div>
                  )}

                  {/* VIZ: JWT */}
                  {outputMode === 'jwt' && jwtData && (
                    <div className="p-6 space-y-6">
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Header</h3>
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <JsonView data={jwtData.header as object} shouldExpandNode={allExpanded} style={darkStyles} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between">
                          Payload
                          {jwtData.isExpired && <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Expired {jwtData.expiresAt}</span>}
                          {!jwtData.isExpired && jwtData.expiresAt && <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Valid until {jwtData.expiresAt}</span>}
                        </h3>
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <JsonView data={jwtData.payload as object} shouldExpandNode={allExpanded} style={darkStyles} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIZ: Utils */}
                  {outputMode === 'utils' && (
                    <div className="p-6 space-y-4">
                      <UtilityRow label="Base64 Encode" value={toBase64(input)} />
                      <UtilityRow label="Base64 Decode" value={fromBase64(input)} />
                      <UtilityRow label="URL Encode" value={urlEncode(input)} />
                      <UtilityRow label="URL Decode" value={urlDecode(input)} />
                      <UtilityRow label="JSON Escape" value={escapeJson(input)} />
                      <UtilityRow label="JSON Unescape" value={unescapeJson(input)} />
                    </div>
                  )}

                  {/* Fallback Text Output */}
                  {!['tree', 'diff', 'query', 'transform', 'mock', 'jwt', 'utils', 'api'].includes(outputMode) && (
                    <pre className="p-4 text-sm font-mono text-slate-300 leading-relaxed">
                      {getOutputContent()}
                    </pre>
                  )}

                  {/* Empty State */}
                  {!parsedData && outputMode !== 'mock' && outputMode !== 'utils' && !input && outputMode !== 'api' && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4 min-h-[300px]">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                        <Code2 className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="text-sm">Waiting for input...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Icons for Sidebar
function GhostIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" /></svg> }
function WrenchIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg> }

const SidebarBtn = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all",
      active ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const UtilityRow = ({ label, value }: { label: string, value: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-bold tracking-wider">
        <span>{label}</span>
        <button onClick={handleCopy} className="hover:text-indigo-400 transition-colors flex items-center gap-1">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-300 break-all">
        {value}
      </div>
    </div>
  )
}

export default App;
