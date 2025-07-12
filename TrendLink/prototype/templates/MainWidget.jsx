import React, { useState, useEffect } from 'react';
import NaverSearchService from '../services/NaverSearchService.js';

const MainWidget = () => {
    // 검색 관련 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [searchType, setSearchType] = useState('integrated'); // 'integrated', 'blog', 'news', 'web'
    
    // 네이버 검색 서비스 인스턴스
    const naverSearch = new NaverSearchService();
    
    // 트렌딩 키워드 상태
    const [trendingKeywords, setTrendingKeywords] = useState([
        { keyword: "겨울 여행", count: 1234, trend: "up" },
        { keyword: "크리스마스 선물", count: 1087, trend: "up" },
        { keyword: "연말 모임", count: 987, trend: "down" },
        { keyword: "새해 계획", count: 876, trend: "up" },
        { keyword: "스키장 추천", count: 765, trend: "steady" }
    ]);

    // 검색 함수
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        
        try {
            let results = [];
            
            // 네이버 검색 API 호출
            switch (searchType) {
                case 'blog':
                    results = await naverSearch.searchAll(searchQuery, 10);
                    break;
                case 'news':
                    results = await naverSearch.searchNews(searchQuery, 10);
                    break;
                case 'web':
                    results = await naverSearch.searchWeb(searchQuery, 10);
                    break;
                case 'integrated':
                default:
                    results = await naverSearch.searchIntegrated(searchQuery);
                    break;
            }
            
            setSearchResults(results);
            
            // 검색 히스토리에 추가
            setSearchHistory(prev => [
                { 
                    query: searchQuery, 
                    timestamp: new Date().toLocaleString(),
                    type: searchType,
                    resultCount: results.length
                },
                ...prev.slice(0, 4) // 최대 5개만 유지
            ]);
            
        } catch (error) {
            console.error('Search failed:', error);
            alert('검색에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSearching(false);
        }
    };

    // 트렌딩 키워드 클릭 핸들러
    const handleTrendingClick = (keyword) => {
        setSearchQuery(keyword);
        // 자동 검색 실행
        setTimeout(() => {
            const fakeEvent = { preventDefault: () => {} };
            handleSearch(fakeEvent);
        }, 100);
    };
    return (
        <div className="max-w-4xl mx-auto p-4 bg-gray-100 font-sans">
            {/* Header Section */}
            <header className="bg-white shadow-md rounded-lg p-6 mb-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">TrendLink Search Widget</h1>
                    <p className="text-gray-600 mt-2">검색하고 트렌드를 발견하세요</p>
                </div>
            </header>

            {/* Search Section */}
            <section className="bg-white shadow-md rounded-lg p-6 mb-6">
                {/* Search Type Tabs */}
                <div className="flex space-x-4 mb-4">
                    {[
                        { key: 'integrated', label: '통합검색', icon: '🔍' },
                        { key: 'blog', label: '블로그', icon: '📝' },
                        { key: 'news', label: '뉴스', icon: '📰' },
                        { key: 'web', label: '웹문서', icon: '🌐' }
                    ].map(type => (
                        <button
                            key={type.key}
                            onClick={() => setSearchType(type.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                searchType === type.key
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {type.icon} {type.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="flex items-center space-x-4">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="네이버에서 검색하고 싶은 키워드를 입력하세요..." 
                        className="flex-grow border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSearching}
                    />
                    <button 
                        type="submit" 
                        disabled={isSearching || !searchQuery.trim()}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSearching ? '검색 중...' : '네이버 검색'}
                    </button>
                </form>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            네이버 검색 결과 ({searchResults.length}개)
                        </h3>
                        <div className="space-y-4">
                            {searchResults.map(result => (
                                <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                    {result.category}
                                                </span>
                                                {result.bloggerName && (
                                                    <span className="text-xs text-gray-500">
                                                        by {result.bloggerName}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-blue-600 font-medium hover:underline cursor-pointer mb-1">
                                                <a href={result.url} target="_blank" rel="noopener noreferrer">
                                                    {result.title}
                                                </a>
                                            </h4>
                                            <p className="text-gray-600 text-sm">
                                                {result.description}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {result.url}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Search History */}
            {searchHistory.length > 0 && (
                <section className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 최근 검색 기록</h2>
                    <div className="space-y-3">
                        {searchHistory.map((search, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <span 
                                        className="text-gray-800 cursor-pointer hover:text-blue-600 font-medium"
                                        onClick={() => handleTrendingClick(search.query)}
                                    >
                                        {search.query}
                                    </span>
                                    <div className="flex items-center space-x-4 mt-1">
                                        <span className="text-xs text-gray-500">{search.timestamp}</span>
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {search.type === 'integrated' ? '통합검색' : 
                                             search.type === 'blog' ? '블로그' :
                                             search.type === 'news' ? '뉴스' : '웹문서'}
                                        </span>
                                        <span className="text-xs text-gray-500">{search.resultCount}개 결과</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Trending Section */}
            <section className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">🔥 실시간 트렌딩 검색어</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trendingKeywords.map((item, index) => (
                        <div 
                            key={index} 
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border-l-4 border-blue-500"
                            onClick={() => handleTrendingClick(item.keyword)}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-xl font-bold text-blue-600">#{index + 1}</span>
                                <span className="text-gray-800 font-medium">{item.keyword}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">{item.count.toLocaleString()}</span>
                                <span className={`text-lg ${
                                    item.trend === 'up' ? 'text-green-500' : 
                                    item.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                                }`}>
                                    {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default MainWidget;
