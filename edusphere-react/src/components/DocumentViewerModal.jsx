import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, ExternalLink, FileText, Image as ImageIcon, ZoomIn, ZoomOut, RotateCw, Copy, Check, AlertCircle } from 'lucide-react';
import { T, rgba, badge, btnStyle } from '../styles/portalTheme';

const API_BASE = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------------
// Helpers (exported so other components can use them)
// ---------------------------------------------------------------
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const triggerFileDownload = async (fileUrl, fileName) => {
  if (!fileUrl) return;
  const url = normalizeUrl(fileUrl);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName || fileUrl.split('/').pop() || 'document';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } catch {
    // Fallback: direct link
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = fileName || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

// Pure helpers – no hooks
function normalizeUrl(raw) {
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('blob:') || raw.startsWith('data:')) {
    return raw;
  }
  return `${API_BASE}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

function getFileInfo(file) {
  const rawUrl = file.url || file.viewUrl || file.fileUrl || file.downloadUrl || '';
  let viewUrl = file.viewUrl || '';
  if (!viewUrl && rawUrl.includes('/uploads/')) {
    const filenamePart = rawUrl.substring(rawUrl.indexOf('/uploads/') + 9);
    if (filenamePart.includes('_')) {
      const id = filenamePart.split('_')[0];
      viewUrl = `/api/files/${id}`;
    }
  }
  const fileName = file.fileName || file.name || rawUrl.split('/').pop() || 'Document';
  const fileSize = file.fileSize || file.size || 0;
  const fileType = (file.fileType || file.type || '').toLowerCase();
  const ext = (fileName.includes('.') ? fileName.split('.').pop() : '').toLowerCase();
  return { rawUrl, viewUrl, fileName, fileSize, fileType, ext };
}

function classifyFile(ext, fileType) {
  const isPdf = fileType.includes('pdf') || ext === 'pdf';
  const isImage = fileType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext);
  const isText = fileType.includes('text/') || ['txt', 'csv', 'md', 'json', 'log'].includes(ext);
  const isOffice = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'].includes(ext)
    || fileType.includes('word') || fileType.includes('officedocument')
    || fileType.includes('presentation') || fileType.includes('spreadsheet');
  return { isPdf, isImage, isText, isOffice };
}

// ---------------------------------------------------------------
// Main Modal Component
// ---------------------------------------------------------------
export default function DocumentViewerModal({ file, onClose, accent = '#4f46e5' }) {
  // ALL hooks must come BEFORE any conditional returns
  const [zoom, setZoom] = useState(100);
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useOfficeViewer, setUseOfficeViewer] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  // Reset state when a new file is loaded
  useEffect(() => {
    setZoom(100);
    setTextContent('');
    setImgError(false);
    setPdfError(false);
    setUseOfficeViewer(false);
    setCopied(false);
  }, [file]);

  // Fetch text content if applicable
  useEffect(() => {
    if (!file) return;
    const { rawUrl, ext, fileType } = getFileInfo(file);
    const { isText } = classifyFile(ext, fileType);
    if (!isText || !rawUrl) return;

    setLoadingText(true);
    const url = normalizeUrl(rawUrl);
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch');
        return r.text();
      })
      .then(txt => { setTextContent(txt); setLoadingText(false); })
      .catch(() => { setTextContent('(Failed to load text preview — try downloading the file.)'); setLoadingText(false); });
  }, [file]);

  const handleCopyText = useCallback(() => {
    navigator.clipboard.writeText(textContent).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [textContent]);

  // NOW it is safe to return early if no file
  if (!file) return null;

  const { rawUrl, viewUrl: derivedViewUrl, fileName, fileSize, fileType, ext } = getFileInfo(file);
  const { isPdf, isImage, isText, isOffice } = classifyFile(ext, fileType);
  const normalizedUrl = normalizeUrl(rawUrl);

  // Use the viewUrl specifically for inline viewing if available
  const viewUrl = derivedViewUrl
    ? normalizeUrl(derivedViewUrl)
    : (file.viewUrl ? normalizeUrl(file.viewUrl) : normalizedUrl);

  const handleDownload = () => triggerFileDownload(normalizedUrl, fileName);

  const isLarge = isPdf || isImage || (isOffice && useOfficeViewer);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          width: isLarge ? 'min(94vw, 1200px)' : 'min(740px, 94vw)',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '13px 18px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#faf9f7',
          flexWrap: 'wrap',
          gap: 8,
          flexShrink: 0,
        }}>
          {/* File meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: rgba(accent, 0.12), color: accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h3 style={{
                margin: 0, fontSize: 15, fontWeight: 700, color: T.text,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '420px',
              }} title={fileName}>
                {fileName}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                {ext && <span style={badge(accent, rgba(accent, 0.1))}>{ext.toUpperCase()}</span>}
                {fileSize > 0 && <span style={{ fontSize: 11, color: T.muted }}>{formatFileSize(fileSize)}</span>}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Zoom (images) */}
            {isImage && !imgError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f1f5f9', padding: '3px 6px', borderRadius: 7, marginRight: 4 }}>
                <button onClick={() => setZoom(z => Math.max(50, z - 25))} style={iconBtn} title="Zoom Out"><ZoomOut size={15} /></button>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, minWidth: 36, textAlign: 'center' }}>{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(300, z + 25))} style={iconBtn} title="Zoom In"><ZoomIn size={15} /></button>
                <button onClick={() => setZoom(100)} style={{ ...iconBtn, marginLeft: 2 }} title="Reset"><RotateCw size={13} /></button>
              </div>
            )}

            {/* Copy (text) */}
            {isText && textContent && (
              <button onClick={handleCopyText} style={{ ...btnStyle(accent, true), padding: '6px 10px', fontSize: 12, borderRadius: 7 }}>
                {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}

            {/* Download */}
            <button onClick={handleDownload} style={{ ...btnStyle(accent), padding: '7px 14px', fontSize: 12, borderRadius: 7 }}>
              <Download size={13} /> Download
            </button>

            {/* Open new tab */}
            <a href={viewUrl} target="_blank" rel="noopener noreferrer"
              style={{ ...btnStyle(accent, true), padding: '7px 10px', fontSize: 12, borderRadius: 7, textDecoration: 'none' }}
              title="Open in new tab">
              <ExternalLink size={13} />
            </a>

            {/* Close */}
            <button onClick={onClose} style={closeBtn} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: isPdf ? '#404040' : isImage ? '#0f172a' : '#fdfcfa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          minHeight: 420,
          position: 'relative',
        }}>

          {/* ── PDF ── */}
          {isPdf && !pdfError && (
            <div style={{ width: '100%', height: '78vh', position: 'relative' }}>
              <object
                data={`${viewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                type="application/pdf"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#fff' }}
                onError={() => setPdfError(true)}
              >
                {/* Fallback iframe for browsers that don't support <object> for PDF */}
                <iframe
                  src={`${viewUrl}#toolbar=1&navpanes=1`}
                  title={fileName}
                  style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                  onError={() => setPdfError(true)}
                />
              </object>
            </div>
          )}

          {/* PDF error fallback */}
          {isPdf && pdfError && (
            <CenteredFallback accent={accent} label="Could not render PDF in this browser." fileName={fileName} onDownload={handleDownload} viewUrl={viewUrl} />
          )}

          {/* ── Image ── */}
          {isImage && (
            <div style={{
              width: '100%', height: '78vh', overflow: 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24, boxSizing: 'border-box',
            }}>
              {imgError ? (
                <CenteredFallback accent={accent} label="Image could not be loaded for preview." fileName={fileName} onDownload={handleDownload} viewUrl={viewUrl} />
              ) : (
                <img
                  src={viewUrl}
                  alt={fileName}
                  onError={() => setImgError(true)}
                  style={{
                    maxWidth: zoom === 100 ? '90%' : 'none',
                    maxHeight: zoom === 100 ? '90%' : 'none',
                    width: zoom !== 100 ? `${zoom}%` : 'auto',
                    borderRadius: 6,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    objectFit: 'contain',
                    transition: 'width 0.15s ease',
                    display: 'block',
                  }}
                />
              )}
            </div>
          )}

          {/* ── Text / Code / CSV ── */}
          {isText && (
            <div style={{ width: '100%', flex: 1, padding: 24, boxSizing: 'border-box', overflowY: 'auto', maxHeight: '72vh' }}>
              {loadingText ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted }}>Loading document…</div>
              ) : (
                <pre style={{
                  margin: 0, padding: '18px 20px',
                  background: '#ffffff', border: `1px solid ${T.border}`, borderRadius: 8,
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: 13.5, lineHeight: 1.65, color: '#334155',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {textContent || '(Empty file)'}
                </pre>
              )}
            </div>
          )}

          {/* ── Office Docs (Word / Excel / PowerPoint) ── */}
          {isOffice && (
            <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 36, boxSizing: 'border-box', background: '#faf9f7' }}>
              {useOfficeViewer ? (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(normalizedUrl)}&embedded=true`}
                  title={fileName}
                  style={{ width: '100%', height: '75vh', border: 'none', borderRadius: 10, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}
                />
              ) : (
                <div style={{ textAlign: 'center', maxWidth: 480, background: '#fff', padding: '40px 36px', borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 14, background: rgba(accent, 0.1), color: accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <FileText size={32} />
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 8px', color: T.text }}>{fileName}</h3>
                  <p style={{ color: T.muted, fontSize: 14, margin: '0 0 22px', lineHeight: 1.55 }}>
                    This <strong>{ext.toUpperCase()}</strong> document can be downloaded to your device or previewed using Google Docs online viewer.
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={handleDownload} style={{ ...btnStyle(accent), padding: '10px 22px', fontSize: 14 }}>
                      <Download size={15} /> Download
                    </button>
                    <button onClick={() => setUseOfficeViewer(true)} style={{ ...btnStyle(accent, true), padding: '10px 18px', fontSize: 14 }}>
                      <ExternalLink size={15} /> Online Preview
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Unknown format fallback ── */}
          {!isPdf && !isImage && !isText && !isOffice && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '50px 24px', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 12, background: '#fff7ed', color: '#f97316', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <AlertCircle size={30} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: T.text }}>{fileName}</h3>
              <p style={{ color: T.muted, fontSize: 14, margin: '0 0 20px', maxWidth: 400, lineHeight: 1.55 }}>
                In-browser preview isn't available for <strong>.{ext || 'this format'}</strong> files. Download it to view on your device.
              </p>
              <button onClick={handleDownload} style={{ ...btnStyle(accent), padding: '10px 24px', fontSize: 14 }}>
                <Download size={15} /> Download {fileSize > 0 ? `(${formatFileSize(fileSize)})` : ''}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Small shared helpers ──

function CenteredFallback({ accent, label, fileName, onDownload, viewUrl }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '50px 24px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: '#fef2f2', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <AlertCircle size={28} />
      </div>
      <p style={{ color: T.muted, fontSize: 15, margin: '0 0 16px', maxWidth: 360 }}>{label}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onDownload} style={{ ...btnStyle(accent), padding: '9px 20px', fontSize: 13 }}>
          <Download size={14} /> Download File
        </button>
        <a href={viewUrl} target="_blank" rel="noopener noreferrer"
          style={{ ...btnStyle(accent, true), padding: '9px 16px', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ExternalLink size={14} /> Open in New Tab
        </a>
      </div>
    </div>
  );
}

const iconBtn = {
  border: 'none', background: 'none', cursor: 'pointer',
  color: '#475569', padding: 3, display: 'flex', alignItems: 'center',
  borderRadius: 4,
};

const closeBtn = {
  background: '#f1f5f9', border: 'none', borderRadius: '50%',
  width: 32, height: 32, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', color: '#64748b',
  flexShrink: 0, marginLeft: 2,
};
