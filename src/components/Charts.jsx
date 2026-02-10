import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  defaults
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Dark mode configuration
defaults.color = '#f0f6fc';
defaults.borderColor = '#30363d';

const Charts = ({ summary }) => {
    const chartData = useMemo(() => {
        if (!summary || !summary.type_distribution || summary.type_distribution.length === 0) return null;

        const labels = summary.type_distribution.map(d => d.equipment_type);
        const counts = summary.type_distribution.map(d => d.count);
        
        return {
            pie: {
                labels,
                datasets: [{
                    label: '# of Equipment',
                    data: counts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1,
                }]
            },
            // We can add a bar chart for the global averages
            bar: {
                labels: ['Avg Flowrate', 'Avg Pressure', 'Avg Temperature'],
                datasets: [
                    {
                        label: 'Global Averages',
                        data: [summary.avg_flowrate, summary.avg_pressure, summary.avg_temperature],
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(255, 99, 132, 0.6)'
                        ]
                    }
                ]
            }
        };
    }, [summary]);

    if (!chartData) return null;

    return (
        <div className="charts-container">
            <div className="card chart-card">
                <h3>Equipment Type Distribution</h3>
                <Pie data={chartData.pie} />
            </div>
            <div className="card chart-card">
                <h3>Global Parameter Averages</h3>
                <Bar data={chartData.bar} />
            </div>
        </div>
    );
};

export default Charts;
