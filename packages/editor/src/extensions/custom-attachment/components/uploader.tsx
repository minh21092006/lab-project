/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@plane/utils";
import { ACCEPTED_ATTACHMENT_MIME_TYPES } from "@/constants/config";
import { CORE_EXTENSIONS } from "@/constants/extension";
import { FileExplorerIcon } from "./file-icon";
import { ECustomAttachmentStatus } from "../types";
import { getAttachmentComponentFileMap } from "../utils";
import type { CustomAttachmentNodeViewProps } from "./node-view";

type CustomAttachmentUploaderProps = CustomAttachmentNodeViewProps & {
  maxFileSize: number;
};

export function CustomAttachmentUploader(props: CustomAttachmentUploaderProps) {
  const { editor, extension, getPos, node, updateAttributes } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredPickerRef = useRef(false);
  const hasUploadedRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(node.attrs.name);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | undefined>(undefined);

  const { id: attachmentEntityId } = node.attrs;
  const attachmentFileMap = useMemo(() => getAttachmentComponentFileMap(editor), [editor]);

  const handleUploadFile = useCallback(
    async (file: File) => {
      if (!attachmentEntityId || hasUploadedRef.current) return;
      hasUploadedRef.current = true;
      setIsUploading(true);
      setUploadFileName(file.name);

      if (file.type?.startsWith("image/")) {
        try {
          setLocalPreviewUrl(URL.createObjectURL(file));
        } catch {}
      }

      updateAttributes({
        name: file.name,
        size: file.size,
        type: file.type,
        status: ECustomAttachmentStatus.UPLOADING,
      });

      try {
        const uploadFn = extension.options.uploadAsset;
        if (!uploadFn) {
          throw new Error("Upload handler not provided");
        }

        const assetId = await uploadFn(attachmentEntityId, file);
        if (assetId) {
          updateAttributes({
            src: assetId,
            name: file.name,
            size: file.size,
            type: file.type,
            status: ECustomAttachmentStatus.UPLOADED,
          });
          attachmentFileMap?.delete(attachmentEntityId);

          const pos = getPos();
          if (typeof pos === "number") {
            const nextNode = editor.state.doc.nodeAt(pos + 1);
            if (nextNode && nextNode.type.name === CORE_EXTENSIONS.PARAGRAPH) {
              editor.commands.setTextSelection(pos + 1);
            } else {
              editor.commands.createParagraphNear();
            }
          }
        }
      } catch (error) {
        console.error("Failed to upload attachment:", error);
        // remove node on failure or reset
        const pos = getPos();
        if (typeof pos === "number") {
          editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
        }
      } finally {
        setIsUploading(false);
      }
    },
    [
      attachmentEntityId,
      attachmentFileMap,
      editor,
      extension.options.uploadAsset,
      getPos,
      node.nodeSize,
      updateAttributes,
    ]
  );

  useEffect(() => {
    if (!attachmentEntityId) return;

    const entityData = attachmentFileMap?.get(attachmentEntityId);
    if (entityData && "file" in entityData && entityData.file) {
      void handleUploadFile(entityData.file);
      return;
    }

    if (!hasTriggeredPickerRef.current) {
      hasTriggeredPickerRef.current = true;
      fileInputRef.current?.click();
    }
  }, [attachmentEntityId, attachmentFileMap, handleUploadFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleUploadFile(file);
    } else {
      // User cancelled picker without selecting file
      const pos = getPos();
      if (typeof pos === "number") {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
      }
    }
  };

  return (
    <button
      type="button"
      contentEditable={false}
      onClick={() => {
        if (!isUploading) {
          fileInputRef.current?.click();
        }
      }}
      className={cn(
        "not-prose hover:border-accent-primary my-0 flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-lg border border-subtle bg-surface-2 px-2.5 py-1.5 text-left transition-colors"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_ATTACHMENT_MIME_TYPES.join(",")}
        onChange={handleFileChange}
      />

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <FileExplorerIcon filename={uploadFileName} mimeType={node.attrs.type} previewSrc={localPreviewUrl} />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <div className="m-0 truncate text-13 leading-tight font-medium text-primary">
            {uploadFileName || "Selecting attachment..."}
          </div>
          <div className="m-0 text-11 leading-tight text-placeholder">
            {isUploading ? "Uploading file..." : "Waiting for file..."}
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="border-accent-primary ml-2 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-t-transparent" />
      )}
    </button>
  );
}
