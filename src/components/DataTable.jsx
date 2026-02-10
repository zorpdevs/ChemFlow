import React from 'react';

const DataTable = ({ typeDistribution }) => {
    if (!typeDistribution || typeDistribution.length === 0) {
        return <div className="card"><p>No distribution data available</p></div>;
    }

    return (
        <div className="card table-container">
            <h3>Equipment Type Distribution</h3>
            <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Equipment Type</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {typeDistribution.map((row, idx) => (
                            <tr key={idx}>
                                <td>{row.equipment_type}</td>
                                <td>{row.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
