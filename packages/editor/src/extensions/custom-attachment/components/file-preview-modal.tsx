/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useCallback, useState } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Download,
  ExternalLink,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
} from "lucide-react";
import { cn, convertBytesToSize } from "@plane/utils";
import { getFileCategory, getFileExtension } from "./file-icon";
import { DocxRenderer } from "./renderers/docx-renderer";
import { ExcelRenderer } from "./renderers/excel-renderer";
import { CodeTextRenderer } from "./renderers/code-text-renderer";
import { MediaRenderer } from "./renderers/media-renderer";

export type FilePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  downloadSrc?: string;
  name?: string | null;
  size?: number | null;
  mimeType?: string | null;
};

export function FilePreviewModal(props: FilePreviewModalProps) {
  const { isOpen, onClose, src, downloadSrc, name, size, mimeType } = props;
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const category = getFileCategory(name, mimeType);
  const ext = getFileExtension(name);

  const isPdf = category === "pdf";
  const isImage = category === "image";
  const isWord = category === "word";
  const isExcel = category === "excel";
  const isCode = category === "code";
  const isText = category === "text";
  const isVideo = category === "video";
  const isAudio = category === "audio";

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setIsIframeLoading(true);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || typeof document === "undefined") return null;

  const formattedSize = typeof size === "number" && size > 0 ? convertBytesToSize(size) : "";
  const targetDownloadUrl = downloadSrc || src;

  const getHeaderIcon = () => {
    switch (category) {
      case "pdf":
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-red-500/30 bg-red-500/20 text-red-400">
            <FileText className="h-4 w-4" />
          </div>
        );
      case "image":
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-purple-500/30 bg-purple-500/20 text-purple-400">
            <ImageIcon className="h-4 w-4" />
          </div>
        );
      case "word":
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-blue-500/30 bg-blue-500/20 text-blue-400">
            <FileText className="h-4 w-4" />
          </div>
        );
      case "excel":
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
        );
      case "code":
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-indigo-500/30 bg-indigo-500/20 text-indigo-400">
            <FileCode className="h-4 w-4" />
          </div>
        );
      case "text":
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-slate-500/30 bg-slate-500/20 text-slate-400">
            <FileText className="h-4 w-4" />
          </div>
        );
      case "video":
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-rose-500/30 bg-rose-500/20 text-rose-400">
            <FileVideo className="h-4 w-4" />
          </div>
        );
      case "audio":
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-violet-500/30 bg-violet-500/20 text-violet-400">
            <FileAudio className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/20 bg-white/10 text-white/70">
            <FileText className="h-4 w-4" />
          </div>
        );
    }
  };

  const renderContent = () => {
    if (isPdf) {
      return (
        <div
          role="presentation"
          className="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4 md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className="relative flex h-[88vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[#2f3542] shadow-2xl">
            {isIframeLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#1e2022] text-white/70">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                <p className="text-13">Đang tải bản xem trước PDF...</p>
              </div>
            )}
            <iframe
              src={`${src}#toolbar=1`}
              title={name || "PDF Preview"}
              className="h-full w-full border-0 bg-white"
              onLoad={() => setIsIframeLoading(false)}
            />
          </div>
        </div>
      );
    }

    if (isImage) {
      return (
        <div
          role="presentation"
          className="flex min-h-0 flex-1 items-center justify-center p-4 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <img
            src={src}
            alt={name || "Preview"}
            className="shadow-2xl max-h-[85vh] max-w-[90vw] rounded object-contain transition-transform"
          />
        </div>
      );
    }

    if (isWord) {
      return (
        <div
          role="presentation"
          className="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4 md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className="relative flex h-[88vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[#1e2022] shadow-2xl">
            <DocxRenderer src={src} name={name} downloadSrc={downloadSrc} />
          </div>
        </div>
      );
    }

    if (isExcel) {
      return (
        <div
          role="presentation"
          className="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4 md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className="relative flex h-[88vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[#1e2022] shadow-2xl">
            <ExcelRenderer src={src} name={name} downloadSrc={downloadSrc} isCsv={ext === "csv" || ext === "tsv"} />
          </div>
        </div>
      );
    }

    if (isCode || isText) {
      return (
        <div
          role="presentation"
          className="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4 md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className="relative flex h-[88vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[#1e2022] shadow-2xl">
            <CodeTextRenderer src={src} name={name} extension={ext} downloadSrc={downloadSrc} />
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div
          role="presentation"
          className="flex min-h-0 flex-1 items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <MediaRenderer src={src} name={name} downloadSrc={downloadSrc} type="video" />
        </div>
      );
    }

    if (isAudio) {
      return (
        <div
          role="presentation"
          className="flex min-h-0 flex-1 items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <MediaRenderer src={src} name={name} downloadSrc={downloadSrc} type="audio" />
        </div>
      );
    }

    // Fallback for unsupported formats
    return (
      <div
        role="presentation"
        className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-6 text-white shadow-xl">
          <FileText className="h-12 w-12 text-white/60" />
          <p className="text-14 font-medium">{name || "Tập tin đính kèm"}</p>
          <p className="text-12 text-white/60">Định dạng này không hỗ trợ xem trước trực tiếp.</p>
          {targetDownloadUrl && (
            <a
              href={targetDownloadUrl}
              download={name || "attachment"}
              className="mt-2 inline-flex items-center gap-2 rounded bg-accent-primary px-4 py-2 text-13 font-medium text-white transition-opacity hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Tải xuống tập tin
            </a>
          )}
        </div>
      </div>
    );
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="animate-in fade-in fixed inset-0 z-[9999] flex flex-col bg-black/85 backdrop-blur-sm transition-opacity duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-3 text-white/90">
        <div className="flex min-w-0 items-center gap-3">
          {getHeaderIcon()}
          <p className="max-w-md truncate text-14 font-medium text-white">{name || "Xem trước tập tin"}</p>
          {formattedSize && <span className="text-12 text-white/60">({formattedSize})</span>}
        </div>

        <div className="flex items-center gap-2">
          {targetDownloadUrl && (
            <a
              href={targetDownloadUrl}
              download={name || "attachment"}
              target="_blank"
              rel="noopener noreferrer"
              title="Tải xuống"
              className="grid h-8 w-8 place-items-center rounded bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </a>
          )}

          {src && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở trong tab mới"
              className="grid h-8 w-8 place-items-center rounded bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            title="Đóng (Esc)"
            className="ml-2 grid h-8 w-8 place-items-center rounded bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      {renderContent()}
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
