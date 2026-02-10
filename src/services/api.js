import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

const api = axios.create({
    baseURL: API_URL,
});

// Interceptor for better error logging
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error Details:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        return Promise.reject(error);
    }
);

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// registerUser is no longer needed as we use supabase.auth.signUp directly

export const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('upload/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const getSummary = () => {
    return api.get('summary/');
};

export const getHistory = () => {
    return api.get('history/');
};

export const generatePDF = () => {
    return api.post('generate-pdf/', {}, { responseType: 'blob' });
};

export default api;
