import React from 'react';

const AnalyticsDashboard = () => {
    return (
        <div className="max-w-6xl mx-auto p-4 bg-gray-100 font-sans">
            {/* Header Section */}
            <header className="bg-white shadow-md rounded-lg p-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">TrendLink Analytics Dashboard</h1>
                <p className="text-gray-600">Analyze search trends and user activity</p>
            </header>

            {/* Statistics Section */}
            <section className="bg-white shadow-md rounded-lg p-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Platform Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-100 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-blue-800">Total Searches</h3>
                        <p className="text-2xl font-semibold text-blue-900">1,234</p>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-green-800">Active Users</h3>
                        <p className="text-2xl font-semibold text-green-900">567</p>
                    </div>
                    <div className="bg-yellow-100 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-yellow-800">Rewards Distributed</h3>
                        <p className="text-2xl font-semibold text-yellow-900">890 Tokens</p>
                    </div>
                </div>
            </section>

            {/* Trends Section */}
            <section className="bg-white shadow-md rounded-lg p-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Search Trends</h2>
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-300 p-2">Rank</th>
                            <th className="border border-gray-300 p-2">Keyword</th>
                            <th className="border border-gray-300 p-2">Search Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-300 p-2">1</td>
                            <td className="border border-gray-300 p-2">Example Keyword</td>
                            <td className="border border-gray-300 p-2">123</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-2">2</td>
                            <td className="border border-gray-300 p-2">Another Keyword</td>
                            <td className="border border-gray-300 p-2">98</td>
                        </tr>
                        {/* Add more rows dynamically */}
                    </tbody>
                </table>
            </section>

            {/* User Analysis Section */}
            <section className="bg-white shadow-md rounded-lg p-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">User Analysis</h2>
                <div className="text-gray-700">
                    <p>Anonymous Users: <span className="font-bold">45%</span></p>
                    <p>Wallet Users: <span className="font-bold">55%</span></p>
                </div>
            </section>
        </div>
    );
};

export default AnalyticsDashboard;
