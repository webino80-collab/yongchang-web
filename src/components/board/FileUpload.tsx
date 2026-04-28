import { useRef, useState } from "react";
import { boardService } from "@/lib/boardService";
import type { PostFile } from "@/types";

interface FileUploadProps {
  postId: string;
  existingFiles?: PostFile[];
  maxCount?: number;
  maxSizeBytes?: number;
  onUploaded?: (file: PostFile) => void;
  onDeleted?: (fileId: string) => void;
}

export function FileUpload({
  postId,
  existingFiles = [],
  maxCount = 5,
  maxSizeBytes = 5 * 1024 * 1024,
  onUploaded,
  onDeleted,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCount = existingFiles.length;
  const canUpload = totalCount < maxCount;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > maxSizeBytes) {
        setError(`파일 크기는 ${Math.round(maxSizeBytes / 1024 / 1024)}MB 이하여야 합니다.`);
        return;
      }
    }

    if (totalCount + files.length > maxCount) {
      setError(`파일은 최대 ${maxCount}개까지 첨부할 수 있습니다.`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      for (const file of files) {
        const uploaded = await boardService.uploadFile(postId, file);
        onUploaded?.(uploaded);
      }
    } catch {
      setError("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (file: PostFile) => {
    if (!confirm(`"${file.original_name}" 파일을 삭제하시겠습니까?`)) return;
    try {
      await boardService.deleteFile(file.id, file.storage_path);
      onDeleted?.(file.id);
    } catch {
      setError("파일 삭제 중 오류가 발생했습니다.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  return (
    <div>
      <p className="label">첨부파일 ({totalCount}/{maxCount})</p>

      {existingFiles.length > 0 && (
        <ul className="space-y-1 mb-2">
          {existingFiles.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-400">📎</span>
                <a
                  href={boardService.getFileUrl(file.storage_path)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline truncate"
                >
                  {file.original_name}
                </a>
                <span className="text-gray-400 text-xs flex-shrink-0">
                  ({formatSize(file.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(file)}
                className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0 text-xs"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {canUpload && (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn btn-secondary btn-sm"
          >
            {uploading ? "업로드 중..." : "파일 선택"}
          </button>
          <span className="ml-2 text-xs text-gray-400">
            최대 {maxCount}개, {Math.round(maxSizeBytes / 1024 / 1024)}MB
          </span>
        </>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
