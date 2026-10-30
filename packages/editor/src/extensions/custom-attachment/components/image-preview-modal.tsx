/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { X, Download, ExternalLink } from "lucide-react";
import { convertBytesToSize } from "@plane/utils";

type ImagePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  downloadSrc?: string;
  name?: string | null;
  size?: number | null;
};

export function ImagePreviewModal(props: ImagePreviewModalProps) {
  const { isOpen, onClose, src, downloadSrc, name, size } = props;

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
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || typeof document === "undefined") return null;

  const formattedSize = typeof size === "number" && size > 0 ? convertBytesToSize(size) : "";
  const targetDownloadUrl = downloadSrc || src;

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
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 text-white/90">
        <div className="flex min-w-0 items-center gap-3">
          <p className="max-w-md truncate text-14 font-medium text-white">{name || "Image Preview"}</p>
          {formattedSize && <span className="text-12 text-white/60">({formattedSize})</span>}
        </div>

        <div className="flex items-center gap-2">
          {targetDownloadUrl && (
            <a
              href={targetDownloadUrl}
              download={name || "image"}
              target="_blank"
              rel="noopener noreferrer"
              title="Download image"
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
              title="Open in new tab"
              className="grid h-8 w-8 place-items-center rounded bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="ml-2 grid h-8 w-8 place-items-center rounded bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        role="presentation"
        className="flex min-h-0 flex-1 items-center justify-center p-4 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <img
          src={src}
          alt={name || "Preview"}
          className="shadow-2xl max-h-[85vh] max-w-[90vw] rounded object-contain transition-transform"
        />
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
