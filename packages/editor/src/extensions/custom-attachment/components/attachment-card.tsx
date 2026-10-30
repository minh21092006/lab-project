/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { Eye } from "lucide-react";
import { CloseOutline, DownloadOutline } from "@makeplane/propel/icons";
import { cn, convertBytesToSize } from "@plane/utils";
import { FileExplorerIcon, getFileCategory } from "./file-icon";
import { ImagePreviewModal } from "./image-preview-modal";
import type { CustomAttachmentNodeViewProps } from "./node-view";

type AttachmentCardProps = CustomAttachmentNodeViewProps & {
  downloadSrc?: string;
  previewSrc?: string;
};

export function AttachmentCard(props: AttachmentCardProps) {
  const { editor, extension, getPos, node, downloadSrc, previewSrc } = props;
  const { name, size, src, type: mimeType } = node.attrs;
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const category = getFileCategory(name, mimeType);
  const isImage = category === "image";

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!src) return;

    try {
      setIsDownloading(true);
      let targetUrl = downloadSrc;
      if (!targetUrl && extension.options.getAssetDownloadSource) {
        targetUrl = await extension.options.getAssetDownloadSource(src);
      }

      if (targetUrl) {
        const link = document.createElement("a");
        link.href = targetUrl;
        link.download = name || "attachment";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Failed to download attachment:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const pos = getPos();
    if (typeof pos === "number") {
      editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
    }
  };

  const formattedSize = typeof size === "number" && size > 0 ? convertBytesToSize(size) : "";
  const effectivePreviewSrc = previewSrc || downloadSrc;

  return (
    <>
      <div
        contentEditable={false}
        className={cn(
          "not-prose group/attachment hover:border-subtle-2 my-0 flex w-full items-center justify-between gap-2.5 rounded-lg border border-subtle bg-surface-2 px-2.5 py-1.5 transition-colors",
          {
            "ring-accent-primary ring-2": props.selected,
          }
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <FileExplorerIcon
            filename={name}
            mimeType={mimeType}
            previewSrc={effectivePreviewSrc}
            onPreviewClick={isImage ? () => setIsPreviewOpen(true) : undefined}
          />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            {isImage ? (
              <button
                type="button"
                className="m-0 cursor-pointer truncate bg-transparent p-0 text-left text-13 leading-tight font-medium text-primary hover:underline"
                title={name || "Attachment"}
                onClick={() => setIsPreviewOpen(true)}
              >
                {name || "Attachment"}
              </button>
            ) : (
              <div className="m-0 truncate text-13 leading-tight font-medium text-primary" title={name || "Attachment"}>
                {name || "Attachment"}
              </div>
            )}
            {formattedSize && <div className="m-0 text-11 leading-tight text-placeholder">{formattedSize}</div>}
          </div>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-0.5">
          {isImage && (
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              title="Preview image"
              className="grid h-7 w-7 place-items-center rounded-md text-placeholder transition-colors hover:bg-surface-1 hover:text-primary"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download"
            className="grid h-7 w-7 place-items-center rounded-md text-placeholder transition-colors hover:bg-surface-1 hover:text-primary"
          >
            <DownloadOutline className="h-3.5 w-3.5" />
          </button>

          {editor.isEditable && (
            <button
              type="button"
              onClick={handleDelete}
              title="Remove"
              className="hover:text-danger grid h-7 w-7 place-items-center rounded-md text-placeholder transition-colors hover:bg-surface-1"
            >
              <CloseOutline className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {isImage && (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          src={effectivePreviewSrc || ""}
          downloadSrc={downloadSrc}
          name={name}
          size={size}
        />
      )}
    </>
  );
}
