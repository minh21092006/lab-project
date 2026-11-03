/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Loader2, Download, AlertCircle, Search, Table as TableIcon, FileText } from "lucide-react";

type ExcelRendererProps = {
  src: string;
  name?: string | null;
  downloadSrc?: string;
  isCsv?: boolean;
};

export function ExcelRenderer({ src, name, downloadSrc, isCsv }: ExcelRendererProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [activeSheetName, setActiveSheetName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "raw">("table");
  const [rawText, setRawText] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(src)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const buffer = await res.arrayBuffer();
        if (isCsv) {
          try {
            const decoder = new TextDecoder("utf-8");
            setRawText(decoder.decode(buffer));
          } catch {
            // ignore decoding error for raw view
          }
        }
        return buffer;
      })
      .then((buffer) => {
        if (!isMounted) return;
        const wb = XLSX.read(buffer, { type: "array", cellDates: true });
        setWorkbook(wb);
        if (wb.SheetNames.length > 0) {
          setActiveSheetName(wb.SheetNames[0]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to parse spreadsheet:", err);
        if (isMounted) {
          setIsLoading(false);
          setError("Không thể đọc tệp bảng tính này. Vui lòng tải xuống để mở trực tiếp trên Excel.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src, isCsv]);

  // Convert current active sheet to 2D array of rows
  const rawSheetRows = useMemo(() => {
    if (!workbook || !activeSheetName) return [];
    const sheet = workbook.Sheets[activeSheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
    });
  }, [workbook, activeSheetName]);

  // Determine maximum column count
  const maxCols = useMemo(() => {
    let max = 0;
    for (const row of rawSheetRows) {
      if (Array.isArray(row) && row.length > max) {
        max = row.length;
      }
    }
    return Math.min(max, 100); // cap at 100 columns for render safety
  }, [rawSheetRows]);

  // Generate column labels: A, B, C... Z, AA, AB...
  const columnLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i < maxCols; i++) {
      let label = "";
      let num = i;
      while (num >= 0) {
        label = String.fromCharCode((num % 26) + 65) + label;
        num = Math.floor(num / 26) - 1;
      }
      labels.push(label);
    }
    return labels;
  }, [maxCols]);

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rawSheetRows;
    const q = searchQuery.toLowerCase();
    return rawSheetRows.filter((row, idx) => {
      if (idx === 0) return true; // keep header
      return row.some((cell) => String(cell ?? "").toLowerCase().includes(q));
    });
  }, [rawSheetRows, searchQuery]);

  const targetDownloadUrl = downloadSrc || src;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#1e2022] text-white">
      {/* Top Toolbar */}
      {!isLoading && !error && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#141517] px-4 py-2 text-white/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Tìm kiếm trong bảng tính..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 w-48 rounded bg-white/10 pl-8 pr-2 text-12 text-white placeholder-white/40 outline-none transition-all focus:w-64 focus:bg-white/15 focus:ring-1 focus:ring-accent-primary"
              />
            </div>
            <span className="text-11 text-white/50">
              {filteredRows.length} dòng × {maxCols} cột
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isCsv && (
              <div className="flex items-center rounded bg-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-11 font-medium transition-colors ${
                    viewMode === "table" ? "bg-accent-primary text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  <TableIcon className="h-3 w-3" />
                  Bảng
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("raw")}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-11 font-medium transition-colors ${
                    viewMode === "raw" ? "bg-accent-primary text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  Thô (Raw)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="relative flex-1 overflow-auto">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#1e2022] text-white/70">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="text-13">Đang đọc bảng tính...</p>
          </div>
        )}

        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <AlertCircle className="h-10 w-10 text-amber-400" />
            <p className="max-w-md text-14 text-white/80">{error}</p>
            {targetDownloadUrl && (
              <a
                href={targetDownloadUrl}
                download={name || "spreadsheet.xlsx"}
                className="mt-2 inline-flex items-center gap-2 rounded bg-accent-primary px-4 py-2 text-13 font-medium text-white transition-opacity hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Tải xuống tập tin
              </a>
            )}
          </div>
        ) : viewMode === "raw" ? (
          <pre className="h-full w-full overflow-auto p-4 font-mono text-12 text-white/80 select-text whitespace-pre">
            {rawText}
          </pre>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse text-left text-12">
              <thead className="sticky top-0 z-10 bg-[#25282c] shadow-sm">
                <tr>
                  <th className="sticky left-0 z-20 w-12 border-b border-r border-white/10 bg-[#25282c] px-2 py-1.5 text-center font-mono text-11 text-white/40 select-none">
                    #
                  </th>
                  {columnLabels.map((col) => (
                    <th
                      key={col}
                      className="min-w-[120px] max-w-[280px] border-b border-r border-white/10 bg-[#25282c] px-3 py-1.5 font-mono text-11 font-medium text-white/60 select-none truncate"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={maxCols + 1}
                      className="py-12 text-center text-13 text-white/40"
                    >
                      Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={`border-b border-white/5 transition-colors hover:bg-white/[0.04] ${
                        rowIdx % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"
                      }`}
                    >
                      <td className="sticky left-0 z-[5] border-r border-white/10 bg-[#25282c] px-2 py-1 text-center font-mono text-10 text-white/40 select-none">
                        {rowIdx + 1}
                      </td>
                      {columnLabels.map((_, colIdx) => {
                        const cellVal = row[colIdx];
                        const displayVal =
                          cellVal instanceof Date
                            ? cellVal.toLocaleDateString()
                            : cellVal !== undefined && cellVal !== null
                              ? String(cellVal)
                              : "";
                        return (
                          <td
                            key={colIdx}
                            className="max-w-[320px] truncate border-r border-white/5 px-3 py-1.5 text-white/80 select-text"
                            title={displayVal}
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Multi-Sheet Tab Bar (Excel-style tabs at bottom) */}
      {!isLoading && !error && workbook && workbook.SheetNames.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto border-t border-white/10 bg-[#181a1c] px-3 py-1.5">
          <span className="text-11 text-white/40 mr-2 select-none">Trang tính:</span>
          {workbook.SheetNames.map((sheetName) => (
            <button
              key={sheetName}
              type="button"
              onClick={() => setActiveSheetName(sheetName)}
              className={`rounded px-3 py-1 text-12 font-medium transition-colors ${
                activeSheetName === sheetName
                  ? "bg-accent-primary text-white shadow"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

