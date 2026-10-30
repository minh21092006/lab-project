/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import type { CustomAttachmentExtensionType, TCustomAttachmentAttributes } from "../types";
import { AttachmentCard } from "./attachment-card";
import { CustomAttachmentUploader } from "./uploader";

export type CustomAttachmentNodeViewProps = Omit<NodeViewProps, "extension" | "updateAttributes"> & {
  extension: CustomAttachmentExtensionType;
  node: NodeViewProps["node"] & {
    attrs: TCustomAttachmentAttributes;
  };
  updateAttributes: (attrs: Partial<TCustomAttachmentAttributes>) => void;
};

export function CustomAttachmentNodeView(props: CustomAttachmentNodeViewProps) {
  const { extension, node } = props;
  const { src } = node.attrs;
  const [downloadSrc, setDownloadSrc] = useState<string | undefined>(undefined);
  const [previewSrc, setPreviewSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!src) {
      setDownloadSrc(undefined);
      setPreviewSrc(undefined);
      return;
    }

    let isMounted = true;
    const fetchSources = async () => {
      try {
        if (extension.options.getAssetSource) {
          const pUrl = await extension.options.getAssetSource(src);
          if (isMounted) setPreviewSrc(pUrl);
        }
        if (extension.options.getAssetDownloadSource) {
          const dUrl = await extension.options.getAssetDownloadSource(src);
          if (isMounted) setDownloadSrc(dUrl);
        }
      } catch (err) {
        console.error("Failed to resolve attachment URLs:", err);
      }
    };

    void fetchSources();
    return () => {
      isMounted = false;
    };
  }, [extension.options, src]);

  const maxFileSize = extension.storage?.maxFileSize ?? 0;

  return (
    <NodeViewWrapper className="attachment-component-wrapper">
      {src ? (
        <AttachmentCard {...props} downloadSrc={downloadSrc} previewSrc={previewSrc} />
      ) : (
        <CustomAttachmentUploader {...props} maxFileSize={maxFileSize} />
      )}
    </NodeViewWrapper>
  );
}
