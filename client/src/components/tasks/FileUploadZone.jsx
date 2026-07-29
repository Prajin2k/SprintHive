import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const FileUploadZone = ({ taskId }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await api.get(`/tasks/${taskId}/files`);
        setFiles(res.data?.data || res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFiles();
  }, [taskId]);

  const handleUpload = async (fileList) => {
    if (!fileList.length) return;
    const formData = new FormData();
    formData.append('file', fileList[0]);

    setIsUploading(true);
    try {
      const res = await api.post(`/tasks/${taskId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFiles(prev => [...prev, res.data?.data || res.data]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const getIcon = (type) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('zip')) return '📦';
    return '📎';
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragging ? 'border-brand-500 bg-brand-500/10' : 'border-surface-600 bg-surface-800'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <input 
          type="file" 
          id="fileInput" 
          className="hidden" 
          onChange={(e) => handleUpload(e.target.files)} 
          accept="image/*,.pdf,.zip,.docx" 
        />
        <div className="text-2xl mb-2">☁️</div>
        <p className="text-sm text-surface-300">Click or drag file to this area</p>
        <p className="text-xs text-surface-500 mt-1">Images, PDF, ZIP, DOCX</p>
        {isUploading && <p className="text-brand-500 text-sm mt-2 font-medium animate-pulse">Uploading...</p>}
      </div>

      <div className="space-y-2">
        {files.map(f => (
          <div key={f._id} className="flex items-center justify-between p-2 rounded bg-surface-800 border border-surface-700 text-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-xl">{getIcon(f.mimetype || f.mimeType || '')}</span>
              <div className="truncate">
                <a href={f.url} target="_blank" rel="noreferrer" className="text-surface-100 hover:text-brand-400 font-medium hover:underline block truncate">
                  {f.filename}
                </a>
                <span className="text-xs text-surface-500">{(f.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <button 
              onClick={async () => {
                await api.delete(`/tasks/${taskId}/files/${f._id}`);
                setFiles(files.filter(file => file._id !== f._id));
              }}
              className="text-surface-500 hover:text-red-400 px-2"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUploadZone;
