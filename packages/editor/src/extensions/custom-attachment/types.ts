/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node } from "@tiptap/core";
import type { TFileHandler } from "@/types";

export enum ECustomAttachmentAttributeNames {
  ID = "id",
  SOURCE = "src",
  NAME = "name",
  SIZE = "size",
  TYPE = "type",
  STATUS = "status",
}

export enum ECustomAttachmentStatus {
  PENDING = "pending",
  UPLOADING = "uploading",
  UPLOADED = "uploaded",
}

export type TCustomAttachmentAttributes = {
  [ECustomAttachmentAttributeNames.ID]: string | null;
  [ECustomAttachmentAttributeNames.SOURCE]: string | null;
  [ECustomAttachmentAttributeNames.NAME]: string | null;
  [ECustomAttachmentAttributeNames.SIZE]: number | null;
  [ECustomAttachmentAttributeNames.TYPE]: string | null;
  [ECustomAttachmentAttributeNames.STATUS]: ECustomAttachmentStatus;
};

export type UploadAttachmentEntity =
  | { event: "insert"; hasOpenedFileInputOnce?: boolean }
  | { event: "drop"; file: File; hasOpenedFileInputOnce?: boolean };

export type InsertAttachmentComponentProps = {
  file?: File;
  pos?: number;
  event: "insert" | "drop";
};

export type CustomAttachmentExtensionOptions = {
  getAssetDownloadSource: TFileHandler["getAssetDownloadSrc"];
  getAssetSource: TFileHandler["getAssetSrc"];
  uploadAsset?: TFileHandler["upload"];
  duplicateAsset?: TFileHandler["duplicate"];
};

export type CustomAttachmentExtensionStorage = {
  fileMap: Map<string, UploadAttachmentEntity>;
  maxFileSize: number;
};

export type CustomAttachmentExtensionType = Node<CustomAttachmentExtensionOptions, CustomAttachmentExtensionStorage>;
