/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/core";
import { ECustomAttachmentAttributeNames, ECustomAttachmentStatus } from "./types";
import type { TCustomAttachmentAttributes } from "./types";

export const DEFAULT_CUSTOM_ATTACHMENT_ATTRIBUTES: TCustomAttachmentAttributes = {
  [ECustomAttachmentAttributeNames.ID]: null,
  [ECustomAttachmentAttributeNames.SOURCE]: null,
  [ECustomAttachmentAttributeNames.NAME]: null,
  [ECustomAttachmentAttributeNames.SIZE]: null,
  [ECustomAttachmentAttributeNames.TYPE]: null,
  [ECustomAttachmentAttributeNames.STATUS]: ECustomAttachmentStatus.PENDING,
};

export const getAttachmentComponentFileMap = (editor: Editor) => editor.storage.attachmentComponent?.fileMap;
