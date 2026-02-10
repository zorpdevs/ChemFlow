import axios from 'axios';
import { db, auth } from '../firebase';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs,
    serverTimestamp 
} from 'firebase/firestore';
import Papa from 'papaparse';

// We keep axios for potential external APIs, but main logic moves to Firebase
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

const api = axios.create({
    baseURL: API_URL,
});

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export const uploadFile = async (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const data = results.data;
                const required_cols = ['Equipment Name', 'Type', 'Flowrate', 'Pressure', 'Temperature'];
                
                // Validate columns
                const headers = results.meta.fields;
                if (!required_cols.every(col => headers.includes(col))) {
                    reject(new Error(`Missing columns. Required: ${required_cols.join(', ')}`));
                    return;
                }

                try {
                    const user = auth.currentUser;
                    if (!user) throw new Error("User not authenticated");

                    // Calculate stats
                    const total_count = data.length;
                    const avg_flowrate = data.reduce((acc, row) => acc + (row.Flowrate || 0), 0) / total_count;
                    const avg_pressure = data.reduce((acc, row) => acc + (row.Pressure || 0), 0) / total_count;
                    const avg_temperature = data.reduce((acc, row) => acc + (row.Temperature || 0), 0) / total_count;

                    // Type distribution
                    const typeCounts = {};
                    data.forEach(row => {
                        const type = row.Type || 'Unknown';
                        typeCounts[type] = (typeCounts[type] || 0) + 1;
                    });

                    const type_distribution = Object.entries(typeCounts).map(([type, count]) => ({
                        equipment_type: type,
                        count: count
                    }));

                    const summaryData = {
                        userId: user.uid,
                        total_count,
                        avg_flowrate,
                        avg_pressure,
                        avg_temperature,
                        type_distribution,
                        equipment_list: data, // Keep raw data for table
                        created_at: serverTimestamp()
                    };

                    // Save to Firestore
                    const docRef = await addDoc(collection(db, 'summaries'), summaryData);
                    
                    resolve({ data: { ...summaryData, id: docRef.id } });
                } catch (err) {
                    console.error("Firestore Error:", err);
                    reject(err);
                }
            },
            error: (err) => {
                reject(err);
            }
        });
    });
};

export const getSummary = async () => {
    try {
        const user = auth.currentUser;
        if (!user) return { data: null };

        const q = query(
            collection(db, 'summaries'),
            where('userId', '==', user.uid),
            orderBy('created_at', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return { data: null };
        }

        const doc = querySnapshot.docs[0];
        return { data: { ...doc.data(), id: doc.id } };
    } catch (err) {
        console.error("Fetch Summary Error:", err);
        throw err;
    }
};

export const getHistory = async () => {
    try {
        const user = auth.currentUser;
        if (!user) return { data: [] };

        const q = query(
            collection(db, 'summaries'),
            where('userId', '==', user.uid),
            orderBy('created_at', 'desc'),
            limit(5)
        );

        const querySnapshot = await getDocs(q);
        const summaries = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        return { data: summaries };
    } catch (err) {
        console.error("Fetch History Error:", err);
        throw err;
    }
};

export const generatePDF = async () => {
    // For now, keep as is or implement client-side PDF if needed
    return api.post('generate-pdf/', {}, { responseType: 'blob' });
};

export default api;
