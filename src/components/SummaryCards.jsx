import React from 'react';

const SummaryCards = ({ summary }) => {
    if (!summary) return null;

    const cards = [
        { label: 'Total Count', value: summary.total_count },
        { label: 'Avg Flowrate', value: typeof summary.avg_flowrate === 'number' ? summary.avg_flowrate.toFixed(2) : 'N/A' },
        { label: 'Avg Pressure', value: typeof summary.avg_pressure === 'number' ? summary.avg_pressure.toFixed(2) : 'N/A' },
        { label: 'Avg Temperature', value: typeof summary.avg_temperature === 'number' ? summary.avg_temperature.toFixed(2) : 'N/A' },
    ];

    return (
        <div className="summary-cards">
            {cards.map((card, index) => (
                <div key={index} className="card summary-card">
                    <h4>{card.label}</h4>
                    <p className="summary-value">{card.value}</p>
                </div>
            ))}
        </div>
    );
};

export default SummaryCards;
