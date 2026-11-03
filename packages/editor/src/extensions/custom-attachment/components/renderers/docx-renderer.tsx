/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { Loader2, Download, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

type DocxRendererProps = {
  src: string;
  name?: string | null;
  downloadSrc?: string;
};

export function DocxRenderer({ src, name, downloadSrc }: DocxRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const isOldDoc = name?.toLowerCase().endsWith(".doc") && !name?.toLowerCase().endsWith(".docx");

  useEffect(() => {
    if (isOldDoc) {
      setIsLoading(false);
      setError("Định dạng .doc cũ không hỗ trợ đọc trực tiếp trên trình duyệt. Vui lòng tải xuống hoặc chuyển sang định dạng .docx.");
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.arrayBuffer();
      })
      .then(async (buffer) => {
        if (!isMounted || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        await renderAsync(buffer, containerRef.current, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          breakPages: true,
          experimental: true,
          useBase64URL: true,
        });
        if (isMounted) {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to render docx:", err);
        if (isMounted) {
          setIsLoading(false);
          setError("Không thể giải mã văn bản Word này. Vui lòng tải xuống để mở trực tiếp trên máy tính.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src, isOldDoc]);

  const targetDownloadUrl = downloadSrc || src;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#1e2022]">
      {/* Zoom / Control Bar */}
      {!isLoading && !error && (
        <div className="flex items-center justify-between border-b border-white/10 bg-[#141517] px-4 py-2 text-white/80">
          <div className="flex items-center gap-2 text-12 text-white/60">
            <span>Tài liệu Microsoft Word</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(prev - 10, 60))}
              disabled={zoom <= 60}
              title="Thu nhỏ"
              className="grid h-7 w-7 place-items-center rounded bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[48px] text-center text-12 font-medium text-white/80">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(prev + 10, 160))}
              disabled={zoom >= 160}
              title="Phóng to"
              className="grid h-7 w-7 place-items-center rounded bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              title="Khôi phục kích thước 100%"
              className="ml-1 grid h-7 w-7 place-items-center rounded bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="relative flex-1 overflow-auto p-4 sm:p-8">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#1e2022] text-white/70">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="text-13">Đang phân tích và hiển thị tài liệu Word...</p>
          </div>
        )}

        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <AlertCircle className="h-10 w-10 text-amber-400" />
            <p className="max-w-md text-14 text-white/80">{error}</p>
            {targetDownloadUrl && (
              <a
                href={targetDownloadUrl}
                download={name || "document.docx"}
                className="mt-2 inline-flex items-center gap-2 rounded bg-accent-primary px-4 py-2 text-13 font-medium text-white transition-opacity hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Tải xuống tập tin
              </a>
            )}
          </div>
        ) : (
          <div
            className="mx-auto flex justify-center transition-transform duration-150 origin-top"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <div
              ref={containerRef}
              className="docx-render-container w-full max-w-4xl rounded shadow-2xl [&_.docx-wrapper]:!bg-transparent [&_.docx-wrapper]:!p-0 [&_section.docx]:!bg-white [&_section.docx]:!text-black [&_section.docx]:!shadow-xl [&_section.docx]:!mb-6 [&_section.docx]:!rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
}

