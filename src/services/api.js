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
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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

export const generatePDF = (summaryData) => {
    if (!summaryData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 44, 52);
    doc.text('Equipment Analysis Report', pageWidth / 2, 15, { align: 'center' });

    // User Info & Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleString();
    doc.text(`Generated on: ${dateStr}`, 14, 25);
    doc.text(`User ID: ${summaryData.userId}`, 14, 30);

    // Summary Stats Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Summary Statistics', 14, 40);
    
    const statsData = [
        ['Total Equipments', summaryData.total_count],
        ['Average Flowrate', `${summaryData.avg_flowrate.toFixed(2)} m³/h`],
        ['Average Pressure', `${summaryData.avg_pressure.toFixed(2)} bar`],
        ['Average Temperature', `${summaryData.avg_temperature.toFixed(2)} °C`]
    ];

    doc.autoTable({
        startY: 45,
        head: [['Metric', 'Value']],
        body: statsData,
        theme: 'striped',
        headStyles: { fillColor: [66, 133, 244] }
    });

    // Equipment List Table
    doc.setFontSize(14);
    doc.text('Detailed Equipment List', 14, doc.lastAutoTable.finalY + 15);

    const tableData = summaryData.equipment_list.map(item => [
        item['Equipment Name'],
        item['Type'],
        item['Flowrate'],
        item['Pressure'],
        item['Temperature']
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Name', 'Type', 'Flowrate', 'Pressure', 'Temp']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94] }
    });

    doc.save(`Equipment_Report_${new Date().getTime()}.pdf`);
};

export default api;
