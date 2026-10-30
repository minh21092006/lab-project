/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileAudio,
  FileVideo,
  FileTerminal,
  File as FileGeneric,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@plane/utils";

export type TFileCategory =
  | "image"
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "archive"
  | "code"
  | "text"
  | "audio"
  | "video"
  | "executable"
  | "generic";

export const getFileExtension = (filename?: string | null): string => {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
};

export const getFileCategory = (filename?: string | null, mimeType?: string | null): TFileCategory => {
  const ext = getFileExtension(filename);
  const type = mimeType?.toLowerCase() || "";

  if (type.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff"].includes(ext)) {
    return "image";
  }
  if (type === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  if (
    type.includes("word") ||
    type.includes("wordprocessingml") ||
    ["doc", "docx", "dot", "dotx", "odt", "rtf"].includes(ext)
  ) {
    return "word";
  }
  if (
    type.includes("excel") ||
    type.includes("spreadsheetml") ||
    ["xls", "xlsx", "xlsm", "xlsb", "csv", "tsv", "ods"].includes(ext)
  ) {
    return "excel";
  }
  if (
    type.includes("powerpoint") ||
    type.includes("presentationml") ||
    ["ppt", "pptx", "pot", "potx", "pps", "ppsx", "odp"].includes(ext)
  ) {
    return "powerpoint";
  }
  if (
    type.includes("zip") ||
    type.includes("compressed") ||
    type.includes("tar") ||
    type.includes("gzip") ||
    ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso", "tgz"].includes(ext)
  ) {
    return "archive";
  }
  if (
    [
      "js",
      "jsx",
      "ts",
      "tsx",
      "html",
      "htm",
      "css",
      "scss",
      "json",
      "py",
      "java",
      "c",
      "cpp",
      "h",
      "hpp",
      "cs",
      "go",
      "rs",
      "php",
      "sql",
      "sh",
      "yaml",
      "yml",
      "xml",
    ].includes(ext)
  ) {
    return "code";
  }
  if (["txt", "md", "markdown", "log"].includes(ext) || type.startsWith("text/")) {
    return "text";
  }
  if (type.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"].includes(ext)) {
    return "audio";
  }
  if (type.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm", "wmv", "flv", "m4v"].includes(ext)) {
    return "video";
  }
  if (["exe", "msi", "bat", "cmd", "bin", "dmp", "dll"].includes(ext)) {
    return "executable";
  }
  return "generic";
};

type FileExplorerIconProps = {
  filename?: string | null;
  mimeType?: string | null;
  previewSrc?: string | null;
  className?: string;
  onPreviewClick?: () => void;
};

export function FileExplorerIcon(props: FileExplorerIconProps) {
  const { filename, mimeType, previewSrc, className, onPreviewClick } = props;
  const [imageError, setImageError] = useState(false);
  const ext = getFileExtension(filename);
  const category = getFileCategory(filename, mimeType);

  if (category === "image" && previewSrc && !imageError) {
    return (
      <button
        type="button"
        disabled={!onPreviewClick}
        onClick={onPreviewClick}
        className={cn(
          "group/thumb shadow-sm relative h-8 w-8 shrink-0 overflow-hidden rounded border border-subtle bg-surface-1 p-0 transition-all",
          onPreviewClick && "hover:border-accent-primary hover:shadow cursor-pointer",
          className
        )}
      >
        <img
          src={previewSrc}
          alt={filename || "Attachment"}
          className="h-full w-full object-cover transition-transform duration-200 group-hover/thumb:scale-105"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover/thumb:bg-black/20" />
      </button>
    );
  }

  const badgeText = ext ? ext.slice(0, 4).toUpperCase() : "";

  switch (category) {
    case "image":
      return (
        <div
          className={cn(
            "border-purple-500/25 bg-purple-500/10 text-purple-400 shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border",
            className
          )}
        >
          <ImageIcon className="h-4 w-4" />
          <span className="text-purple-400 text-[8px] font-bold tracking-tight">{badgeText || "IMG"}</span>
        </div>
      );

    case "pdf":
      return (
        <div
          className={cn(
            "border-red-500/25 bg-red-500/10 text-red-500 shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border",
            className
          )}
        >
          <FileText className="h-4 w-4" />
          <span className="text-red-400 text-[8px] font-bold tracking-tight">{badgeText || "PDF"}</span>
        </div>
      );

    case "word":
      return (
        <div
          className={cn(
            "border-blue-500/25 bg-blue-500/10 text-blue-500 shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border",
            className
          )}
        >
          <FileText className="h-4 w-4" />
          <span className="text-blue-400 text-[8px] font-bold tracking-tight">{badgeText || "DOC"}</span>
        </div>
      );

    case "excel":
      return (
        <div
          className={cn(
            "border-emerald-500/25 bg-emerald-500/10 text-emerald-500 shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border",
            className
          )}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span className="text-emerald-400 text-[8px] font-bold tracking-tight">{badgeText || "XLS"}</span>
        </div>
      );

    case "powerpoint":
      return (
        <div
          className={cn(
            "border-orange-500/25 bg-orange-500/10 text-orange-500 shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border",
            className
          )}
        >
          <FileText className="h-4 w-4" />
          <span className="text-orange-400 text-[8px] font-bold tracking-tight">{badgeText || "PPT"}</span>
        </div>
      );

    case "archive":
      return (
        <div
          className={cn(
            "border-amber-500/25 bg-amber-500/10 text-amber-500 shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border",
            className
          )}
        >
          <FileArchive className="h-4 w-4" />
          <span className="text-amber-400 text-[8px] font-bold tracking-tight">{badgeText || "ZIP"}</span>
        </div>
      );

    case "code":
      return (
        <div
          className={cn(
            "border-indigo-500/25 bg-indigo-500/10 text-indigo-400 shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border",
            className
          )}
        >
          <FileCode className="h-4 w-4" />
          <span className="text-indigo-400 text-[8px] font-bold tracking-tight">{badgeText || "CODE"}</span>
        </div>
      );

    case "text":
      return (
        <div
          className={cn(
            "border-slate-500/25 bg-slate-500/10 text-slate-400 shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border",
            className
          )}
        >
          <FileText className="h-4 w-4" />
          <span className="text-slate-400 text-[8px] font-bold tracking-tight">{badgeText || "TXT"}</span>
        </div>
      );

    case "audio":
      return (
        <div
          className={cn(
            "border-violet-500/25 bg-violet-500/10 text-violet-400 shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border",
            className
          )}
        >
          <FileAudio className="h-4 w-4" />
          <span className="text-violet-400 text-[8px] font-bold tracking-tight">{badgeText || "AUDIO"}</span>
        </div>
      );

    case "video":
      return (
        <div
          className={cn(
            "border-rose-500/25 bg-rose-500/10 text-rose-400 shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border",
            className
          )}
        >
          <FileVideo className="h-4 w-4" />
          <span className="text-rose-400 text-[8px] font-bold tracking-tight">{badgeText || "VIDEO"}</span>
        </div>
      );

    case "executable":
      return (
        <div
          className={cn(
            "border-zinc-500/25 bg-zinc-500/10 text-zinc-400 shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border",
            className
          )}
        >
          <FileTerminal className="h-4 w-4" />
          <span className="text-zinc-400 text-[8px] font-bold tracking-tight">{badgeText || "EXE"}</span>
        </div>
      );

    default:
      return (
        <div
          className={cn(
            "shadow-sm relative flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border border-subtle bg-surface-1 text-secondary",
            className
          )}
        >
          <FileGeneric className="h-4 w-4" />
          <span className="text-[8px] font-bold tracking-tight text-placeholder">{badgeText || "FILE"}</span>
        </div>
      );
  }
}
