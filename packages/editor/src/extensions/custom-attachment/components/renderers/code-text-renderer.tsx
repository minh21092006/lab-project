/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useMemo, useState } from "react";
import hljs from "highlight.js";
import { Loader2, Download, AlertCircle, Copy, Check, WrapText } from "lucide-react";

type CodeTextRendererProps = {
  src: string;
  name?: string | null;
  extension?: string;
  downloadSrc?: string;
};

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  json: "json",
  html: "xml",
  htm: "xml",
  xml: "xml",
  svg: "xml",
  css: "css",
  scss: "scss",
  sql: "sql",
  md: "markdown",
  markdown: "markdown",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  yml: "yaml",
  yaml: "yaml",
  c: "c",
  cpp: "cpp",
  h: "cpp",
  hpp: "cpp",
  cs: "csharp",
  java: "java",
  go: "go",
  rs: "rust",
  php: "php",
  env: "ini",
  ini: "ini",
  toml: "ini",
  log: "plaintext",
  txt: "plaintext",
};

export function CodeTextRenderer({ src, name, extension, downloadSrc }: CodeTextRendererProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);

  const ext = (extension || name?.split(".").pop() || "").toLowerCase();
  const language = EXTENSION_LANGUAGE_MAP[ext] || "plaintext";

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(src)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!isMounted) return;
        setRawText(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch text:", err);
        if (isMounted) {
          setIsLoading(false);
          setError("Không thể tải nội dung văn bản này. Vui lòng thử tải xuống tệp.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  const lines = useMemo(() => rawText.split(/\r?\n/), [rawText]);

  // Syntax highlight each line or full block
  const highlightedHtml = useMemo(() => {
    if (!rawText) return "";
    try {
      if (language && language !== "plaintext" && hljs.getLanguage(language)) {
        return hljs.highlight(rawText, { language }).value;
      }
      return hljs.highlightAuto(rawText).value;
    } catch {
      // fallback to plain escape
      return rawText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }, [rawText, language]);

  const handleCopy = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const targetDownloadUrl = downloadSrc || src;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#1e2022] text-white">
      {/* Top Toolbar */}
      {!isLoading && !error && (
        <div className="flex items-center justify-between border-b border-white/10 bg-[#141517] px-4 py-2 text-white/80">
          <div className="flex items-center gap-3">
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-11 font-semibold tracking-wider text-accent-primary uppercase">
              {ext || language}
            </span>
            <span className="text-11 text-white/50">{lines.length} dòng</span>
            <span className="text-11 text-white/50">{rawText.length.toLocaleString()} ký tự</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWrapLines((prev) => !prev)}
              title={wrapLines ? "Tắt ngắt dòng" : "Bật ngắt dòng"}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-12 font-medium transition-colors ${
                wrapLines ? "bg-accent-primary text-white" : "bg-white/10 text-white/80 hover:bg-white/15"
              }`}
            >
              <WrapText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ngắt dòng</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              title="Sao chép toàn bộ"
              className="flex items-center gap-1.5 rounded bg-white/10 px-2.5 py-1 text-12 font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã chép!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-auto">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#1e2022] text-white/70">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="text-13">Đang đọc nội dung...</p>
          </div>
        )}

        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <AlertCircle className="h-10 w-10 text-amber-400" />
            <p className="max-w-md text-14 text-white/80">{error}</p>
            {targetDownloadUrl && (
              <a
                href={targetDownloadUrl}
                download={name || "file.txt"}
                className="mt-2 inline-flex items-center gap-2 rounded bg-accent-primary px-4 py-2 text-13 font-medium text-white transition-opacity hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Tải xuống tập tin
              </a>
            )}
          </div>
        ) : (
          <div className="flex min-h-full font-mono text-12 leading-5 select-text">
            {/* Line numbers gutter */}
            <div className="shrink-0 border-r border-white/10 bg-[#161719] px-3 py-4 text-right font-mono text-11 text-white/30 select-none">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code / Text body */}
            <div className="flex-1 overflow-x-auto p-4">
              <pre
                className={`m-0 font-mono text-12 text-[#e6edf3] ${
                  wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                } [&_.hljs-keyword]:!text-[#ff7b72] [&_.hljs-built_in]:!text-[#ffa657] [&_.hljs-type]:!text-[#ffa657] [&_.hljs-literal]:!text-[#79c0ff] [&_.hljs-number]:!text-[#79c0ff] [&_.hljs-string]:!text-[#a5d6ff] [&_.hljs-comment]:!text-[#8b949e] [&_.hljs-doctag]:!text-[#8b949e] [&_.hljs-title]:!text-[#d2a8ff] [&_.hljs-function]:!text-[#d2a8ff] [&_.hljs-attr]:!text-[#79c0ff] [&_.hljs-variable]:!text-[#ffa657] [&_.hljs-tag]:!text-[#7ee787] [&_.hljs-name]:!text-[#7ee787] [&_.hljs-selector-tag]:!text-[#7ee787]`}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

