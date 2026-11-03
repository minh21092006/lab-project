/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { Download, AlertCircle, FileAudio, FileVideo } from "lucide-react";

type MediaRendererProps = {
  src: string;
  name?: string | null;
  downloadSrc?: string;
  type: "video" | "audio";
};

export function MediaRenderer({ src, name, downloadSrc, type }: MediaRendererProps) {
  const [hasError, setHasError] = useState(false);
  const targetDownloadUrl = downloadSrc || src;

  if (hasError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
        <AlertCircle className="h-10 w-10 text-amber-400" />
        <p className="max-w-md text-14 text-white/80">
          Không thể phát tệp {type === "video" ? "video" : "âm thanh"} này trực tiếp trên trình duyệt. Vui lòng tải xuống tập tin.
        </p>
        {targetDownloadUrl && (
          <a
            href={targetDownloadUrl}
            download={name || "media"}
            className="mt-2 inline-flex items-center gap-2 rounded bg-accent-primary px-4 py-2 text-13 font-medium text-white transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Tải xuống tập tin
          </a>
        )}
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="relative flex max-h-[85vh] max-w-[90vw] flex-col items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
          <video
            src={src}
            controls
            playsInline
            onError={() => setHasError(true)}
            className="max-h-[80vh] max-w-full rounded"
          >
            Trình duyệt của bạn không hỗ trợ thẻ video.
          </video>
        </div>
      </div>
    );
  }

  // Audio player card
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-white/10 bg-[#1e2022] p-8 shadow-2xl text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/20 text-violet-400 shadow-lg">
          <FileAudio className="h-8 w-8" />
        </div>
        <div className="text-center">
          <p className="max-w-xs truncate text-15 font-semibold text-white">{name || "Tệp âm thanh"}</p>
          <p className="text-12 text-white/60">Trình phát âm thanh</p>
        </div>
        <audio
          src={src}
          controls
          onError={() => setHasError(true)}
          className="mt-2 w-full"
        >
          Trình duyệt của bạn không hỗ trợ phát âm thanh.
        </audio>
      </div>
    </div>
  );
}

