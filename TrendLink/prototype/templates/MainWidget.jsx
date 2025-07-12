import React from 'react';

const MainWidget = () => {
    return (
        <div className="max-w-4xl mx-auto p-4 bg-gray-100 font-sans">
            {/* Header Section */}
            <header className="bg-white shadow-md rounded-lg p-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">TrendLink Search Widget</h1>
                <p className="text-gray-600">Search and earn rewards with Web3 integration</p>
            </header>

            {/* Search Section */}
            <section className="bg-white shadow-md rounded-lg p-4 mb-6">
                <form id="search-form" className="flex items-center space-x-4">
                    <input 
                        type="text" 
                        id="search-input" 
                        placeholder="Enter your search query..." 
                        className="flex-grow border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        type="submit" 
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Search
                    </button>
                </form>
            </section>

            {/* Trending Section */}
            <section className="bg-white shadow-md rounded-lg p-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Trending Searches</h2>
                <ul id="trending-list" className="space-y-2">
                    <li className="text-gray-700">#1 Trending Keyword</li>
                    <li className="text-gray-700">#2 Trending Keyword</li>
                    <li className="text-gray-700">#3 Trending Keyword</li>
                    {/* Add more trending items dynamically */}
                </ul>
            </section>

            {/* Rewards Section */}
            <section className="bg-white shadow-md rounded-lg p-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Rewards</h2>
                <div id="rewards-info" className="text-gray-700">
                    <p>Total Rewards: <span className="font-bold">0.00</span> Tokens</p>
                    <p>Wallet Address: <span className="font-mono">0x000...000</span></p>
                </div>
            </section>
        </div>
    );
};

export default MainWidget;
