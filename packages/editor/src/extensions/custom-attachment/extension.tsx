/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
import { ACCEPTED_ATTACHMENT_MIME_TYPES } from "@/constants/config";
import { isFileValid } from "@/helpers/file";
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
import type { TFileHandler } from "@/types";
import { CustomAttachmentNodeView } from "./components/node-view";
import type { CustomAttachmentNodeViewProps } from "./components/node-view";
import { CustomAttachmentExtensionConfig } from "./extension-config";
import type { CustomAttachmentExtensionOptions, CustomAttachmentExtensionStorage } from "./types";
import { ECustomAttachmentAttributeNames, ECustomAttachmentStatus } from "./types";
import { getAttachmentComponentFileMap } from "./utils";

type Props = {
  fileHandler: TFileHandler;
  isEditable: boolean;
};

export function CustomAttachmentExtension(props: Props) {
  const { fileHandler, isEditable } = props;
  const { getAssetSrc, getAssetDownloadSrc } = fileHandler;

  return CustomAttachmentExtensionConfig.extend<CustomAttachmentExtensionOptions, CustomAttachmentExtensionStorage>({
    selectable: isEditable,
    draggable: isEditable,

    addOptions() {
      const upload = "upload" in fileHandler ? fileHandler.upload : undefined;
      const duplicate = "duplicate" in fileHandler ? fileHandler.duplicate : undefined;

      return {
        ...this.parent?.(),
        getAssetDownloadSource: getAssetDownloadSrc,
        getAssetSource: getAssetSrc,
        uploadAsset: upload,
        duplicateAsset: duplicate,
      };
    },

    addStorage() {
      const maxFileSize = "validation" in fileHandler ? fileHandler.validation?.maxFileSize : 0;

      return {
        fileMap: new Map(),
        maxFileSize,
        markdown: {
          serialize() {},
        },
      };
    },

    addCommands() {
      return {
        insertAttachmentComponent:
          (commandProps) =>
          ({ commands }) => {
            if (
              commandProps?.file &&
              !isFileValid({
                acceptedMimeTypes: ACCEPTED_ATTACHMENT_MIME_TYPES,
                file: commandProps.file,
                maxFileSize: this.storage.maxFileSize,
                onError: (_error, message) => alert(message),
              })
            ) {
              return false;
            }

            const fileId = uuidv4();
            const fileMap = getAttachmentComponentFileMap(this.editor);

            if (fileMap) {
              if (commandProps?.file) {
                fileMap.set(fileId, {
                  file: commandProps.file,
                  event: commandProps.event,
                });
              } else if (commandProps?.event === "insert") {
                fileMap.set(fileId, {
                  event: commandProps.event,
                  hasOpenedFileInputOnce: false,
                });
              }
            }

            const attributes = {
              [ECustomAttachmentAttributeNames.ID]: fileId,
              [ECustomAttachmentAttributeNames.STATUS]: ECustomAttachmentStatus.PENDING,
              [ECustomAttachmentAttributeNames.NAME]: commandProps?.file?.name ?? null,
              [ECustomAttachmentAttributeNames.SIZE]: commandProps?.file?.size ?? null,
              [ECustomAttachmentAttributeNames.TYPE]: commandProps?.file?.type ?? null,
            };

            if (commandProps?.pos) {
              return commands.insertContentAt(commandProps.pos, {
                type: this.name,
                attrs: attributes,
              });
            }

            return commands.insertContent({
              type: this.name,
              attrs: attributes,
            });
          },
      };
    },

    addKeyboardShortcuts() {
      return {
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((nodeViewProps) => (
        <CustomAttachmentNodeView
          {...nodeViewProps}
          node={nodeViewProps.node as CustomAttachmentNodeViewProps["node"]}
        />
      ));
    },
  });
}
