import React, { useState, useRef } from 'react';
import { UploadCloud, File, FileText, Image as ImageIcon, X, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { T, rgba, badge, btnStyle } from '../styles/portalTheme';
import { formatFileSize } from './DocumentViewerModal';

export default function FileUploadDropzone({
  file,
  onFileChange,
  accent = '#4f46e5',
  label = 'Attach Document / Assignment Work',
  hint = 'Supports PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx), Images, or Text (up to 250MB)',
  bucket = 'assets',
  onPreview
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  const handleUploadFile = async (selectedFile) => {
    if (!selectedFile) return;
    setErrorMsg('');

    // Check size <= 250MB
    if (selectedFile.size > 250 * 1024 * 1024) {
      setErrorMsg('File size exceeds 250MB limit. Please choose a smaller file.');
      return;
    }

    setUploading(true);
    setProgress(15);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('bucket', bucket || 'assets');

      const progressInterval = setInterval(() => {
        setProgress(p => (p < 85 ? p + 15 : p));
      }, 150);

      const API = (import.meta.env.VITE_API_URL || 'https://edvance-1v00.onrender.com').replace(/\/+$/, '');
      const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'File upload failed');
      }

      const data = await res.json();
      if (data.success) {
        onFileChange({
          fileUrl: data.url,
          fileName: data.fileName,
          fileSize: data.size,
          fileType: data.type,
          downloadUrl: data.downloadUrl,
          viewUrl: data.viewUrl,
          id: data.id,
          key: data.key,
          bucket: data.bucket
        });
      } else {
        throw new Error('Upload unsuccessful');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload document. Please check backend connection.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const fileName = file ? (file.fileName || file.name || (file.fileUrl ? file.fileUrl.split('/').pop() : '')) : '';
  const fileSize = file ? (file.fileSize || file.size || 0) : 0;
  const ext = fileName ? fileName.split('.').pop().toLowerCase() : '';
  const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text }}>
          {label}
        </label>
      )}

      {/* Hidden native input */}
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif,.zip,.rar"
      />

      {/* When a file is attached */}
      {file && (file.fileUrl || file.url) ? (
        <div
          style={{
            border: `1.5px solid ${rgba(accent, 0.3)}`,
            background: rgba(accent, 0.03),
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: rgba(accent, 0.12),
                color: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {isImg ? <ImageIcon size={18} /> : <FileText size={18} />}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '280px'
                  }}
                  title={fileName}
                >
                  {fileName}
                </span>
                <CheckCircle2 size={14} color="#16a34a" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={badge(accent, rgba(accent, 0.1))}>{ext.toUpperCase() || 'ATTACHMENT'}</span>
                {fileSize > 0 && (
                  <span style={{ fontSize: 12, color: T.muted }}>
                    {formatFileSize(fileSize)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {onPreview && (
              <button
                type="button"
                onClick={() => onPreview(file)}
                style={{
                  ...btnStyle(accent, true),
                  padding: '6px 12px',
                  fontSize: 12,
                  borderRadius: 6
                }}
              >
                <Eye size={13} /> View
              </button>
            )}
            <button
              type="button"
              onClick={() => inputRef.current && inputRef.current.click()}
              style={{
                ...btnStyle(accent, true),
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 6
              }}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              style={{
                background: '#fee2e2',
                border: 'none',
                color: '#dc2626',
                borderRadius: 6,
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Remove File"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current && inputRef.current.click()}
          style={{
            border: `2px dashed ${isDragging ? accent : '#cbd5e1'}`,
            background: isDragging ? rgba(accent, 0.05) : '#f8fafc',
            borderRadius: 10,
            padding: '24px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {uploading ? (
            <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${rgba(accent, 0.2)}`, borderTopColor: accent, animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>Uploading document... {progress}%</span>
              <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: accent, transition: 'width 0.2s' }} />
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: rgba(accent, 0.1),
                  color: accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <UploadCloud size={24} />
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: T.text }}>
                  Click to browse or drag & drop document
                </p>
                <p style={{ margin: 0, fontSize: 12, color: T.muted }}>
                  {hint}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 12, marginTop: 4 }}>
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
