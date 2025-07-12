pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title SearchReward
 * @dev TrendLink 검색/보상 분배 스마트컨트랙트 (Chainlink Functions 연동)
 * @notice 생성자 인자:
 *   - _functionsRouter: Chainlink Functions Router 주소
 *   - _donId: DON ID for Functions
 *   - _subscriptionId: Functions Subscription ID
 *   - _rewardToken: 보상에 사용할 ERC20 토큰 주소
 *   - _trendLink: TrendLink(운영자) 계정 주소
 *   - _owner: Ownable 권한을 가질 관리자 주소
 */
contract SearchReward is FunctionsClient, Ownable, ReentrancyGuard {
    using FunctionsRequest for FunctionsRequest.Request;
    
    // 보상에 사용할 ERC20 토큰
    IERC20 public rewardToken;
    // TrendLink(우리) 계정 주소
    address public trendLink;

    // Functions 설정
    bytes32 public donId;
    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;

    // 보상 비율(%) - 사용자, 플랫폼, TrendLink(최소 2% 보장)
    uint256 public userPct = 49;
    uint256 public platformPct = 49;
    uint256 public trendLinkPct = 2;

    // 검색 로그 구조체
    struct SearchLog {
        uint256 logId;
        address user;
        address platform;
        string keyword;
        uint256 timestamp;
        uint256 amount;
        string apiResults; // API 응답 결과
        bool exists;
    }

    // 검색 로그 저장소
    mapping(uint256 => SearchLog) public searchLogs;
    uint256 public totalSearchLogs;

    // 검색어 카운팅
    mapping(string => uint256) public keywordCount;
    string[] public allKeywords;

    // Functions 요청 매핑
    mapping(bytes32 => SearchRequest) public searchRequests;

    // 검색 요청 구조체
    struct SearchRequest {
        address user;
        address platform;
        string keyword;
        uint256 logId;
        bool exists;
    }

    // JavaScript source code for API calls (올바른 국회의원 API)
    string public apiSource = 
        "const keyword = args[0];"
        "const platform = args[1];"
        "const user = args[2];"
        "const logId = args[3];"
        ""
        "try {"
        "  const apiUrl = `https://open.assembly.go.kr/portal/openapi/ALLNAMEMBER?Key=sample%20key&Type=json&pIndex=1&pSize=10&NAAS_NM=${keyword}`;"
        "  const response = await Functions.makeHttpRequest({"
        "    url: apiUrl,"
        "    method: 'GET',"
        "    timeout: 9000"
        "  });"
        ""
        "  const timestamp = Math.floor(Date.now() / 1000);"
        ""
        "  let memberData = [];"
        "  let resultCount = 0;"
        "  if (response.data && response.data.ALLNAMEMBER && response.data.ALLNAMEMBER[1] && response.data.ALLNAMEMBER[1].row) {"
        "    const members = response.data.ALLNAMEMBER[1].row;"
        "    memberData = Array.isArray(members) ? members.slice(0, 5) : [members];"
        "    resultCount = memberData.length;"
        "  }"
        ""
        "  const result = {"
        "    success: true,"
        "    logId: parseInt(logId),"
        "    keyword: keyword,"
        "    user: user,"
        "    platform: platform,"
        "    timestamp: timestamp,"
        "    apiResults: JSON.stringify({"
        "      total: resultCount,"
        "      members: memberData.map(member => ({"
        "        name: member.NAAS_NM || 'Unknown',"
        "        party: member.PLPT_NM || 'Unknown',"
        "        constituency: member.ELECD_NM || 'Unknown',"
        "        committee: member.CMIT_NM || 'Unknown',"
        "        email: member.NAAS_EMAIL_ADDR || '',"
        "        office: member.OFFM_RNUM_NO || ''"
        "      }))"
        "    }),"
        "    resultCount: resultCount"
        "  };"
        ""
        "  return Functions.encodeString(JSON.stringify(result));"
        "} catch (error) {"
        "  return Functions.encodeString(JSON.stringify({"
        "    success: false,"
        "    error: error.message,"
        "    logId: parseInt(logId),"
        "    keyword: keyword,"
        "    timestamp: Math.floor(Date.now() / 1000),"
        "    resultCount: 0"
        "  }));"
        "}";

    // 구매자 요청 데이터 구조체
    struct SearchData {
        uint256[] logIds;
        string[] keywords;
        uint256[] keywordCounts;
        uint256 totalSearches;
    }

    // 이벤트들
    event SearchRequested(bytes32 indexed requestId, uint256 indexed logId, string keyword, address user, address platform);
    event SearchLogged(uint256 indexed logId, address indexed user, address indexed platform, address trendLink, string keyword, uint256 timestamp);
    event APICallCompleted(uint256 indexed logId, string keyword, string apiResults, bool success);
    event PurchaseRewardDistributed(address user, uint256 userAmount, address platform, uint256 platformAmount, address trendLink, uint256 trendLinkAmount);
    event RewardPolicyUpdated(uint256 userPct, uint256 platformPct, uint256 trendLinkPct);
    event RewardTokenUpdated(address token);
    event Withdrawn(address to, uint256 amount);
    event KeywordCounted(string keyword, uint256 count);

    /**
     * @dev 생성자
     */
    constructor(
        address _functionsRouter,
        bytes32 _donId,
        uint64 _subscriptionId,
        address _rewardToken,
        address _trendLink,
        address _owner
    ) FunctionsClient(_functionsRouter) Ownable(_owner) {
        donId = _donId;
        subscriptionId = _subscriptionId;
        rewardToken = IERC20(_rewardToken);
        trendLink = _trendLink;
    }

    /**
     * @dev 사용자가 호출하는 검색 함수 - API 호출 포함
     * @param keyword 검색할 키워드
     * @param platform 플랫폼 주소
     * @return requestId Functions 요청 ID
     */
    function searchWithAPI(string memory keyword, address platform) external returns (bytes32) {
        require(bytes(keyword).length > 0, "Keyword cannot be empty");
        require(platform != address(0), "Invalid platform address");

        // 고유 logId 생성
        uint256 logId = totalSearchLogs + 1;

        // Functions 요청 준비
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(apiSource);
        
        string[] memory args = new string[](4);
        args[0] = keyword;
        args[1] = Strings.toHexString(uint160(platform), 20);
        args[2] = Strings.toHexString(uint160(msg.sender), 20);
        args[3] = Strings.toString(logId);
        req.setArgs(args);

        // Functions 요청 전송
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );

        // 요청 정보 저장
        searchRequests[requestId] = SearchRequest({
            user: msg.sender,
            platform: platform,
            keyword: keyword,
            logId: logId,
            exists: true
        });

        emit SearchRequested(requestId, logId, keyword, msg.sender, platform);
        return requestId;
    }

    /**
     * @dev Chainlink Functions 응답 처리
     */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        require(searchRequests[requestId].exists, "Invalid request ID");
        
        SearchRequest memory searchReq = searchRequests[requestId];
        
        if (err.length > 0) {
            // 에러 발생 시 기본 로그 저장
            _storeSearchLog(
                searchReq.logId,
                searchReq.user,
                searchReq.platform,
                searchReq.keyword,
                block.timestamp,
                0,
                string(err)
            );
            
            emit APICallCompleted(searchReq.logId, searchReq.keyword, string(err), false);
        } else {
            // 성공 시 API 응답 파싱 및 저장
            string memory responseString = string(response);
            
            // JSON 파싱 (실제로는 JSON 라이브러리 사용 권장)
            // 여기서는 단순히 응답 전체를 저장
            _storeSearchLog(
                searchReq.logId,
                searchReq.user,
                searchReq.platform,
                searchReq.keyword,
                block.timestamp,
                0,
                responseString
            );

            emit APICallCompleted(searchReq.logId, searchReq.keyword, responseString, true);
        }

        // 검색어 카운팅
        _countKeyword(searchReq.keyword);

        emit SearchLogged(searchReq.logId, searchReq.user, searchReq.platform, trendLink, searchReq.keyword, block.timestamp);

        // 요청 정보 삭제
        delete searchRequests[requestId];
    }

    /**
     * @dev 보상 비율(%) 정책 변경 (onlyOwner)
     */
    function setRewardPolicy(uint256 _userPct, uint256 _platformPct, uint256 _trendLinkPct) external onlyOwner {
        require(_trendLinkPct >= 2, "TrendLink pct must be at least 2");
        require(_userPct + _platformPct + _trendLinkPct == 100, "Total must be 100");
        userPct = _userPct;
        platformPct = _platformPct;
        trendLinkPct = _trendLinkPct;
        emit RewardPolicyUpdated(_userPct, _platformPct, _trendLinkPct);
    }

    /**
     * @dev 보상 토큰 변경 (onlyOwner)
     */
    function setRewardToken(address _token) external onlyOwner {
        rewardToken = IERC20(_token);
        emit RewardTokenUpdated(_token);
    }

    /**
     * @dev Functions 설정 업데이트 (onlyOwner)
     */
    function updateFunctionsConfig(bytes32 _donId, uint64 _subscriptionId, uint32 _gasLimit) external onlyOwner {
        donId = _donId;
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
    }

    /**
     * @dev API 소스 코드 업데이트 (onlyOwner)
     */
    function updateAPISource(string memory _newSource) external onlyOwner {
        apiSource = _newSource;
    }

    /**
     * @dev 데이터 구매 및 보상 분배 (분석자가 직접 결제)
     */
    function purchaseData(uint256 logId, uint256 amount) public nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(searchLogs[logId].exists, "Search log does not exist");
        
        SearchLog memory log = searchLogs[logId];
        
        // 분석자(구매자)가 컨트랙트에 토큰 전송
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "TransferFrom failed");

        // 분배 계산
        uint256 userAmount = (amount * userPct) / 100;
        uint256 platformAmount = (amount * platformPct) / 100;
        uint256 trendLinkAmount = amount - userAmount - platformAmount;

        // 분배
        if (userAmount > 0) rewardToken.transfer(log.user, userAmount);
        if (platformAmount > 0) rewardToken.transfer(log.platform, platformAmount);
        if (trendLinkAmount > 0) rewardToken.transfer(trendLink, trendLinkAmount);

        emit PurchaseRewardDistributed(log.user, userAmount, log.platform, platformAmount, trendLink, trendLinkAmount);
    }

    /**
     * @dev 검색 로그 저장 (내부 함수)
     */
    function _storeSearchLog(
        uint256 logId,
        address user,
        address platform,
        string memory keyword,
        uint256 timestamp,
        uint256 amount,
        string memory apiResults
    ) internal {
        require(!searchLogs[logId].exists, "Search log already exists");
        
        searchLogs[logId] = SearchLog({
            logId: logId,
            user: user,
            platform: platform,
            keyword: keyword,
            timestamp: timestamp,
            amount: amount,
            apiResults: apiResults,
            exists: true
        });
        
        totalSearchLogs++;
    }

    /**
     * @dev 검색어 카운팅 (내부 함수)
     */
    function _countKeyword(string memory keyword) internal {
        if (keywordCount[keyword] == 0) {
            allKeywords.push(keyword);
        }
        keywordCount[keyword]++;
        emit KeywordCounted(keyword, keywordCount[keyword]);
    }

    // 기존 조회 함수들은 동일하게 유지
    function getSearchData(uint256 startIndex, uint256 endIndex) external view returns (SearchData memory) {
        require(startIndex < totalSearchLogs, "Start index out of range");
        require(endIndex <= totalSearchLogs, "End index out of range");
        require(startIndex <= endIndex, "Invalid index range");

        uint256 dataLength = endIndex - startIndex;
        uint256[] memory logIds = new uint256[](dataLength);
        string[] memory keywords = new string[](dataLength);
        uint256[] memory keywordCounts = new uint256[](allKeywords.length);

        uint256 currentIndex = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint256 logId = i + 1;
            if (searchLogs[logId].exists) {
                logIds[currentIndex] = searchLogs[logId].logId;
                keywords[currentIndex] = searchLogs[logId].keyword;
                currentIndex++;
            }
        }

        for (uint256 i = 0; i < allKeywords.length; i++) {
            keywordCounts[i] = keywordCount[allKeywords[i]];
        }

        return SearchData({
            logIds: logIds,
            keywords: keywords,
            keywordCounts: keywordCounts,
            totalSearches: totalSearchLogs
        });
    }

    function getKeywordCount(string memory keyword) external view returns (uint256) {
        return keywordCount[keyword];
    }

    function getAllKeywords() external view returns (string[] memory) {
        return allKeywords;
    }

    function getSearchLog(uint256 logId) external view returns (SearchLog memory) {
        require(searchLogs[logId].exists, "Search log does not exist");
        return searchLogs[logId];
    }

    function getTotalSearchLogs() external view returns (uint256) {
        return totalSearchLogs;
    }

    /**
     * @dev 컨트랙트에 남은 토큰 인출 (onlyOwner)
     */
    function withdraw(address to, uint256 amount) external onlyOwner {
        require(rewardToken.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        rewardToken.transfer(to, amount);
        emit Withdrawn(to, amount);
    }
}