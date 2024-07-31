
/** 전역변수 - 초기 데이터 오늘임 (계속 인터벌 돌려야해서) */
let requestDate = getCurrentDate();

/** 전역변수 - 불러온 게임 데이터 정렬 */
const sortedGameData = [];

let intervalCheck = false;

async function fetchDataPeriodically() {
    intervalCheck = true;
    await getGameData();
    setTimeout(fetchDataPeriodically, 5000);
}

document.addEventListener('DOMContentLoaded', async function() {
    await getGameData();
    // fetchDataPeriodically();

    // Full calendar 관련
    getFullCalendar()

    const filterButtons = document.querySelectorAll('.filters span');
            
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active')); // 모든 버튼에서 'active' 클래스 제거
            button.classList.add('active'); // 클릭된 버튼에 'active' 클래스 추가

            getGameData();
        });
    });

    document.querySelectorAll('.collapse-content').forEach(content => {
        content.style.display = 'none';
    });

});

/**
 * 1. 총 게임 수 반환 및 데이터 정제
 * 2. in_progress => ready => cancel => final 순으로 정렬한 데이터가 포함된 객체 반환
 * @Param mainGameData
 * @Return 정제 데이터
 */
function countEntries(data) {
    const counts = {};
    let totalCount = 0;

    let final = 0, ready = 0, inProgress = 0, cancel = 0;
    const sortedGameData = {
        IN_PROGRESS: [],
        READY: [],
        CANCEL: [],
        FINAL: []
    };

    for (const [key, value] of Object.entries(data)) {
        let count = 0;
        if (Array.isArray(value)) {
            value.forEach((item) => {
                if (item.gameStatus === 'FINAL') {
                    final += 1;
                    sortedGameData.FINAL.push(item);
                } else if (item.gameStatus === 'READY') {
                    ready += 1;
                    sortedGameData.READY.push(item);
                } else if (item.gameStatus === 'IN_PROGRESS') {
                    inProgress += 1;
                    sortedGameData.IN_PROGRESS.push(item);
                } else if (item.gameStatus === 'CANCEL') {
                    cancel += 1;
                    sortedGameData.CANCEL.push(item);
                }
            });

            count = value.length;
        } else if (typeof value === 'object' && value !== null) {
            count = Object.keys(value).length;
        }
        counts[key] = count;
        totalCount += count;
    }
    
    counts.total = totalCount;
    counts.final = final;
    counts.ready = ready;
    counts.inProgress = inProgress;
    counts.cancel = cancel;
    
    // 정렬된 결과를 하나의 배열로 합침
    const sortedGameDataArray = [
        ...sortedGameData.IN_PROGRESS,
        ...sortedGameData.READY,
        ...sortedGameData.CANCEL,
        ...sortedGameData.FINAL
    ];

    // 전체 게임 데이터를 정렬된 데이터로 포함
    counts.sortedGameData = sortedGameDataArray;
    counts.sortedGameDataByStatus = sortedGameData; // 상태별 배열 추가

    return counts;
}

function getPeriodText(game) {

    if (game.sportsType === 'BASEBALL') {
        return game.period + "회" + (game.inningDivision === 'TOP' ? "초" : "말");
    } else if (game.sportsType === 'SOCCER') {
        return game.period === 1 ? '전반전' : game.period === 2 ? '후반전' : '연장';
    } else {
        return game.period + '세트';
    }
}

function createTableRow(game) {

    const row = document.createElement('div');
    row.className = 'scoreRow';
    row.style.cursor = 'pointer';

    const homeScore = game.teams.home.periodData.reduce((total, current) => total + current.score, 0);
    const awayScore = game.teams.away.periodData.reduce((total, current) => total + current.score, 0);
    
    let homeScoreClass = '';
    let awayScoreClass = '';
    
    if (homeScore > awayScore) {
        homeScoreClass = 'highlight';
    } else if (homeScore < awayScore) {
        awayScoreClass = 'highlight';
    }
    const gameRow = document.createElement('div');
    gameRow.className = 'row';
    gameRow.id = `game-${game.id}`;
    gameRow.onclick = () => toggleCollapse(gameRow);

    gameRow.innerHTML = `
        <div class="cell tr-icon league-icon"><img src=${getSportsIcon(game.sportsType)} alt="리그 아이콘"> ${game.league.shortName}</div>
        <div class="cell time-column">${formatDateTime(game.startDatetime).split(' ')[1]}</div>
        <div class="cell team-column"><img class="team-icon" src="./assets/images/small_logo/${game.teams.home.imgPath.split('/')[4]}" alt="홈팀 아이콘"> ${game.teams.home.name}</div>
        <div class="cell score-column ${homeScoreClass}">${homeScore}</div>
        <div class="cell"><span class="status ${getStatusClass(game.gameStatus)}">${game.gameStatus === 'IN_PROGRESS' ? getPeriodText(game) : getStatusText(game.gameStatus)}</span></div>
        <div class="cell score-column ${awayScoreClass}">${awayScore}</div>
        <div class="cell team-column"><img class="team-icon" src="./assets/images/small_logo/${game.teams.away.imgPath.split('/')[4]}" alt="원정팀 아이콘"> ${game.teams.away.name}</div>
    `;

    const prevCollapse = document.querySelector(`#collapse-${game.id}`)

    const collapseContent = document.createElement('div');
    collapseContent.className = 'collapse-content';
    collapseContent.id = `collapse-${game.id}`;
    if (prevCollapse) {
        collapseContent.style.display = prevCollapse.style.display || 'none';
        const prevActiveTab = prevCollapse.querySelector('.tab.active');
        if (prevActiveTab) {
            const prevActiveTabId = prevActiveTab.getAttribute('onclick').split(',')[1].trim().replace(/['\)]/g, '');
            collapseContent.innerHTML = `
                <div class="tab-menu">
                    <div class="tab ${prevActiveTabId === 'tab1-' + game.id ? 'active' : ''}" onclick="showTabContent(this, 'tab1-${game.id}')">승/패</div>
                    <div class="tab ${prevActiveTabId === 'tab2-' + game.id ? 'active' : ''}" onclick="showTabContent(this, 'tab2-${game.id}')">핸디캡</div>
                    <div class="tab ${prevActiveTabId === 'tab3-' + game.id ? 'active' : ''}" onclick="showTabContent(this, 'tab3-${game.id}')">U/O</div>
                </div>
                <div id="tab1-${game.id}" class="tab-content ${prevActiveTabId === 'tab1-' + game.id ? 'active' : ''}">
                    <div class="odds-section">
                        <div class="odds-type">승패</div>
                        <div class="odds-values">
                            <div class="odds-item">
                                <div>홈</div>
                                <div class="odds-red">${game.odds?.domesticWinLoseOdds[0] ? game.odds?.domesticWinLoseOdds[0].odds : '-'}</div>
                            </div>
                            <div class="odds-item">
                                <div>무</div>
                                <div>-</div>
                            </div>
                            <div class="odds-item">
                                <div>원정</div>
                                <div class="odds-blue">${game.odds?.domesticWinLoseOdds[1] ? game.odds?.domesticWinLoseOdds[1].odds : '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="tab2-${game.id}" class="tab-content ${prevActiveTabId === 'tab2-' + game.id ? 'active' : ''}">
                    <div class="odds-section">
                         <div class="odds-type">
                            핸디캡 (기준
                            ${game?.odds?.domesticHandicapOdds[0] ? (
                                `<span class=${game.odds.domesticHandicapOdds[0]?.optionValue < 0 ? 'minus' : 'normal'}>
                                    <span>${game.odds.domesticHandicapOdds[0].optionValue}</span>
                                </span>`
                            ) : (
                                `<span class="normal">-</span>`
                            )}
                            )
                        </div>
                        <div class="odds-values">
                            <div class="odds-item">
                                <div>홈</div>
                                <div class="odds-red">${game?.odds.domesticHandicapOdds[0] ? game?.odds.domesticHandicapOdds[0].odds : '-'}</div>
                            </div>
                            <div class="odds-item">
                                <div>무</div>
                                <div>-</div>
                            </div>
                            <div class="odds-item">
                                <div>원정</div>
                                <div class="odds-blue">${game?.odds.domesticHandicapOdds[1] ? game?.odds.domesticHandicapOdds[1].odds : '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="tab3-${game.id}" class="tab-content ${prevActiveTabId === 'tab3-' + game.id ? 'active' : ''}">
                    <div class="odds-section">
                        <div class="odds-type">
                            U/O (기준
                            ${game?.odds?.domesticUnderOverOdds[0] ? (
                                `<span class=${game.odds.domesticUnderOverOdds[0]?.optionValue < 0 ? 'minus' : 'normal'}>
                                    <span>${game.odds.domesticUnderOverOdds[0].optionValue}</span>
                                </span>`
                            ) : (
                                `<span class="normal">-</span>`
                            )}
                            )
                        </div>
                        <div class="odds-values">
                            <div class="odds-item">
                                <div>언더</div>
                                <div class="odds-red">${game?.odds.domesticUnderOverOdds[0] ? game?.odds.domesticUnderOverOdds[0].odds : '-'}</div>
                            </div>
                            <div class="odds-item">
                                <div>무</div>
                                <div>-</div>
                            </div>
                            <div class="odds-item">
                                <div>오버</div>
                                <div class="odds-blue">${game?.odds.domesticUnderOverOdds[1] ? game?.odds.domesticUnderOverOdds[1].odds : '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            collapseContent.style.display = 'none';
        }
    } else {
        collapseContent.style.display = 'none';
        collapseContent.innerHTML = `
            <div class="tab-menu">
                <div class="tab active" onclick="showTabContent(this, 'tab1-${game.id}')">승/패</div>
                <div class="tab" onclick="showTabContent(this, 'tab2-${game.id}')">핸디캡</div>
                <div class="tab" onclick="showTabContent(this, 'tab3-${game.id}')">U / O</div>
            </div>
            <div id="tab1-${game.id}" class="tab-content active">
                    <div class="odds-section">
                        <div class="odds-type">승패</div>
                        <div class="odds-values">
                            <div class="odds-item">
                                <div>홈</div>
                                <div class="odds-red">${game.odds?.domesticWinLoseOdds[0] ? game.odds?.domesticWinLoseOdds[0].odds : '-'}</div>
                            </div>
                            <div class="odds-item">
                                <div>무</div>
                                <div>-</div>
                            </div>
                            <div class="odds-item">
                                <div>원정</div>
                                <div class="odds-blue">${game.odds?.domesticWinLoseOdds[1] ? game.odds?.domesticWinLoseOdds[1].odds : '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="tab2-${game.id}" class="tab-content">
                    <div class="odds-section">
                        <div class="odds-type">
                            핸디캡 (기준
                            ${game?.odds?.domesticHandicapOdds[0] ? (
                                `<span class=${game.odds.domesticHandicapOdds[0]?.optionValue < 0 ? 'minus' : 'normal'}>
                                    <span>${game.odds.domesticHandicapOdds[0].optionValue}</span>
                                </span>`
                            ) : (
                                `<span class="normal">-</span>`
                            )}
                            )
                        </div>
                        <div class="odds-values">
                            <div class="odds-item">
                                <div>홈</div>
                                <div class="odds-red">${game?.odds.domesticHandicapOdds[0] ? game?.odds.domesticHandicapOdds[0].odds : '-'}</div>
                            </div>
                            <div class="odds-item">
                                <div>무</div>
                                <div>-</div>
                            </div>
                            <div class="odds-item">
                                <div>원정</div>
                                <div class="odds-blue">${game?.odds.domesticHandicapOdds[1] ? game?.odds.domesticHandicapOdds[1].odds : '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="tab3-${game.id}" class="tab-content">
                    <div class="odds-section">
                        <div class="odds-type">
                            언더/오버 (기준
                            ${game?.odds?.domesticUnderOverOdds[0] ? (
                                `<span class=${game.odds.domesticUnderOverOdds[0]?.optionValue < 0 ? 'minus' : 'normal'}>
                                    <span>${game.odds.domesticUnderOverOdds[0].optionValue}</span>
                                </span>`
                            ) : (
                                `<span>-</span>`
                            )}
                            )
                        </div>
                        <div class="odds-values">
                            <div class="odds-item">
                                <div>언더</div>
                                <div class="odds-red">${game?.odds.domesticUnderOverOdds[0] ? game?.odds.domesticUnderOverOdds[0].odds : '-'}</div>
                            </div>
                            <div class="odds-item">
                                <div>무</div>
                                <div>-</div>
                            </div>
                            <div class="odds-item">
                                <div>오버</div>
                                <div class="odds-blue">${game?.odds.domesticUnderOverOdds[1] ? game?.odds.domesticUnderOverOdds[1].odds : '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>
        `;
    }

    row.appendChild(gameRow);
    row.appendChild(collapseContent);

    return row;
}

function getSportsIcon(sportsType) {

    switch(sportsType) {
        case 'SOCCER' : 
            return './assets/images/tabmenu_logo/soccer.png';
        case 'BASEBALL': 
            return './assets/images/tabmenu_logo/baseball.png';
        case 'BASKETBALL': 
            return './assets/images/tabmenu_logo/basketball.png';
        case 'VOLLEYBALL': 
            return './assets/images/tabmenu_logo/volleyball.png';
    }

}

function toggleCollapse(element) {
    const nextElement = element.nextElementSibling;
    if (nextElement && nextElement.classList.contains('collapse-content')) {
        nextElement.style.display = nextElement.style.display === 'none' ? 'block' : 'none';
    }
}

function showTabContent(tab, tabId) {
    const tabMenu = tab.parentNode;
    const tabContents = tabMenu.parentNode.querySelectorAll('.tab-content');

    tabMenu.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}


function getActiveButtonId() {
    const activeButton = document.querySelector('.filters span.active');
    return activeButton ? activeButton.id : null;
}

async function getGameData() {
    const dataUrl = `https://sports-api.named.com/v1.0/popular-games?date=${requestDate}&tomorrow-game-flag=true`;

    // 날짜를 변경할때마다 바뀐 날짜 적용 
    document.querySelector('.date-display').innerHTML = requestDate;

    const loadingSpinner = document.getElementById('loading-spinner');
    const tbody = document.getElementById('score-table');

    if(!intervalCheck) {
        loadingSpinner.style.display = 'block'; // 로딩 스피너 표시
    } else {
        loadingSpinner.style.display = 'none';
    }

    try {
        const res = await axios.get(dataUrl);
        const gameInfo = countEntries(res.data);

        // DOM 업데이트 최소화
        const totalGameCnt = document.getElementById('total-game-cnt');
        const readyGameCnt = document.getElementById('ready-game-cnt');
        const inProgressGameCnt = document.getElementById('inprogress-game-cnt');
        const finalGameCnt = document.getElementById('final-game-cnt');
        
        totalGameCnt.innerHTML = gameInfo.total;
        readyGameCnt.innerHTML = gameInfo.ready;
        inProgressGameCnt.innerHTML = gameInfo.inProgress;
        finalGameCnt.innerHTML = gameInfo.final;

        // DocumentFragment 사용하여 DOM 조작 최적화
        
        if(getActiveButtonId() === "total-button") {
            const fragment = document.createDocumentFragment();

            if(gameInfo?.sortedGameData.length > 0) {
                gameInfo?.sortedGameData?.forEach((game) => {
                    const row = createTableRow(game);
                    fragment.appendChild(row);
                });
            } else {
                const row = createTableErrorRow();
                fragment.appendChild(row);
            }

            tbody.innerHTML = ``;
            tbody.appendChild(fragment);
        } else if (getActiveButtonId() === "ready-button") {
            const fragment = document.createDocumentFragment();

            if(gameInfo?.sortedGameDataByStatus?.READY.length > 0) {
                gameInfo?.sortedGameDataByStatus?.READY?.forEach((game) => {
                    const row = createTableRow(game);
                    fragment.appendChild(row);
                })
            } else {
                const row = createTableErrorRow();
                fragment.appendChild(row);
            }

            tbody.innerHTML = ``;
            tbody.appendChild(fragment);
        } else if (getActiveButtonId() === "inprogress-button") {
            const fragment = document.createDocumentFragment();
            
            if(gameInfo?.sortedGameDataByStatus?.IN_PROGRESS.length > 0) {
                gameInfo?.sortedGameDataByStatus?.IN_PROGRESS?.forEach((game) => {
                    const row = createTableRow(game);
                    fragment.appendChild(row);
                })
            } else {
                const row = createTableErrorRow();
                fragment.appendChild(row);
            }
            
            tbody.innerHTML = ``;
            tbody.appendChild(fragment);
        } else if (getActiveButtonId() === "final-button") {
            const fragment = document.createDocumentFragment();

            if(gameInfo?.sortedGameDataByStatus?.FINAL.length > 0) {
                gameInfo?.sortedGameDataByStatus?.FINAL?.forEach((game) => {
                    const row = createTableRow(game);
                    fragment.appendChild(row);
                })
            } else {
                const row = createTableErrorRow();
                fragment.appendChild(row);
            }

            tbody.innerHTML = ``;
            tbody.appendChild(fragment);
        }

    } catch (error) {
        console.log("goat-score error message: ", error)
    } finally {
        loadingSpinner.style.display = 'none'; // 로딩 스피너 숨김
        intervalCheck = false;
    }
}

function createTableErrorRow() {
    const row = document.createElement('div');
    row.className = 'errorRow';
    row.style.cursor = 'pointer';

    row.innerHTML = `
        일정된 경기가 없습니다.
    `;

    return row;
}
