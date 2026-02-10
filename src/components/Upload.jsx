import React, { useState, useRef } from 'react';
import { uploadFile } from '../services/api';
import './Upload.css';

const Upload = ({ onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;
        
        // Basic validation
        if (!file.name.endsWith('.csv')) {
            setError('Please upload a CSV file.');
            return;
        }

        setUploading(true);
        setError('');
        setSuccessMsg('');

        try {
            const response = await uploadFile(file);
            setSuccessMsg('File uploaded successfully!');
            if (onUploadSuccess) onUploadSuccess(response.data);
        } catch (err) {
            setError(err.message || 'Upload failed. Please check credentials or file format.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const onClick = () => {
        fileInputRef.current.click();
    };

    const onFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div className="upload-wrapper">
            <div 
                className={`upload-card ${isDragging ? 'dragging' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={onClick}
            >
                <div className="upload-icon-wrapper">
                    <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                </div>
                
                <h3 className="upload-title">Drop a CSV file to try it out</h3>
                <p className="upload-subtitle">CSV • Max 10MB</p>
                
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden-input"
                    accept=".csv"
                    onChange={onFileChange}
                />

                {uploading && <p className="upload-status uploading">Uploading...</p>}
                {error && <p className="upload-status error">{error}</p>}
                {successMsg && <p className="upload-status success">{successMsg}</p>}
            </div>
        </div>
    );
};

export default Upload;
