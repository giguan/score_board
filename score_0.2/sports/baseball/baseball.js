/** 전역변수 - 초기 데이터 오늘임 (선택 일자로 계속 인터벌 돌려야해서) */
let requestDate = getCurrentDate();

let intervalCheck = false;

const prevGameData = {}
const storeBroadCast = {}

async function fetchDataPeriodically() {
    intervalCheck = true;
    await getGameData();
    setTimeout(fetchDataPeriodically, 2000);
}

document.addEventListener('DOMContentLoaded', async function() {
    await getGameData();
    fetchDataPeriodically();

    getFullCalendar();

    const filterButtons = document.querySelectorAll('.filters span');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active')); // 모든 버튼에서 'active' 클래스 제거
            button.classList.add('active'); // 클릭된 버튼에 'active' 클래스 추가

            getGameData();
        });
    });
});

function getActiveButtonId() {
    const activeButton = document.querySelector('.filters span.active');
    return activeButton ? activeButton.id : null;
}

function countEntries(data) {

    const counts = {};
    let totalCount = data.length

    let final = 0, ready = 0, inProgress = 0, cancel = 0;
    const sortedGameData = {
        IN_PROGRESS: [],
        READY: [],
        CANCEL: [],
        FINAL: []
    };

    data.forEach((item) => {
        if (item.gameStatus === 'FINAL') {
            final += 1;
            sortedGameData.FINAL.push(item);
        } else if (item.gameStatus === 'READY') {
            ready += 1;
            sortedGameData.READY.push(item);
        } else if (item.gameStatus === 'IN_PROGRESS') {
            inProgress += 1;
            sortedGameData.IN_PROGRESS.push(item);
        } else {
            cancel += 1;
            sortedGameData.CANCEL.push(item);
        }
    })

    counts.total = totalCount;
    counts.final = final;
    counts.ready = ready;
    counts.inProgress = inProgress;
    counts.cancel = cancel;

    const sortedGameDataArray = [
        ...sortedGameData.IN_PROGRESS,
        ...sortedGameData.READY,
        ...sortedGameData.CANCEL,
        ...sortedGameData.FINAL
    ];

    counts.sortedGameData = sortedGameDataArray;
    counts.sortedGameDataByStatus = sortedGameData; // 상태별 배열 추가

    return counts;
}

function createField(game) {

    const statusClass = getStatusClass(game.gameStatus);

    const previousData = prevGameData[game.id] || {};

    const broadcastChanged = (previousData.broadcast?.playText || null) !== (game.broadcast?.playText || null);

    const changes = {
        ball: previousData.ball !== game.ball,
        strike: previousData.strike !== game.strike,
        out: previousData.out !== game.out,
        firstBaseOccupied: previousData.firstBaseOccupied !== game.firstBaseOccupied,
        secondBaseOccupied: previousData.secondBaseOccupied !== game.secondBaseOccupied,
        thirdBaseOccupied: previousData.thirdBaseOccupied !== game.thirdBaseOccupied,
        currentBatter: previousData.currentBatter !== game.currentBatter,
        currentPitcher: previousData.currentPitcher !== game.currentPitcher,
        broadcast: broadcastChanged
    };

    prevGameData[game.id] = {
        ball: game.ball,
        strike: game.strike,
        out: game.out,
        firstBaseOccupied: game.firstBaseOccupied,
        secondBaseOccupied: game.secondBaseOccupied,
        thirdBaseOccupied: game.thirdBaseOccupied,
        currentBatter: game.currentBatter,
        currentPitcher: game.currentPitcher,
        broadcast: game.broadcast
    };

    switch(statusClass) {
        case 'in-progress':
            return `
            <div class="field-cover">
                <div class="broadcast-text-area">
                    <img style="width: 20px; height: 20px;" class="text ${changes.broadcast ? 'changed-text' : ''}" src="./../../assets/images/volume-up.png" />
                    <span class="text ${changes.broadcast ? 'changed-text' : ''}">${game.broadcast? game.broadcast.playText : ''}</span>
                </div>
            </div>
            <div class="field">
                <div class="base base1 ${game.firstBaseOccupied ? 'active' : ''}  ${changes.firstBaseOccupied ? 'changed-base' : ''}"></div>
                <div class="base base2 ${game.secondBaseOccupied ? 'active' : ''} ${changes.secondBaseOccupied ? 'changed-base' : ''}"></div>
                <div class="base base3 ${game.thirdBaseOccupied ? 'active' : ''} ${changes.thirdBaseOccupied ? 'changed-base' : ''}"></div>
                <div class="count">
                    <div class="ball">
                        <span style="margin-right:2px;">B </span>
                        ${[...Array(4)].map((_, i) => 
                            `<span class="ball-outline-circle${i < game.ball ? ' active' : ''} ${changes.ball && i === game.ball - 1 ? 'changed-ball' : ''}"></span>`
                        ).join('')}
                    </div>
                    <div class="strike">
                        <span style="margin-right:2px;">S </span>
                        ${[...Array(3)].map((_, i) => 
                            `<span class="strike-outline-circle${i < game.strike ? ' active' : ''} ${changes.strike && i === game.strike - 1 ? 'changed-strike' : ''}"></span>`
                        ).join('')}
                    </div>
                    <div class="out">
                        <span style="margin-right:2px;">O </span>
                        ${[...Array(3)].map((_, i) => 
                            `<span class="out-outline-circle${i < game.out ? ' active' : ''} ${changes.out && i === game.out - 1 ? 'changed-out' : ''}"></span>`
                        ).join('')}
                    </div>
                </div>
                ${game.inningDivision === 'TOP' ? 
                    `<div class="player team-name pitcher ">${game.teams.home.name}</div>
                    <div class="player team-name batter ">${game.teams.away.name}</div>`
                    :
                    `<div class="player team-name pitcher">${game.teams.away.name}</div>
                    <div class="player team-name batter">${game.teams.home.name}</div>`
                }
                <div class="player pitcher" data-name="투수이름">
                    ${game.currentPitcher? game.currentPitcher.name : ' - '}
                </div>
                <div class="player batter" data-name="타자이름">${game.currentBatter? game.currentBatter.name : ' - '}</div>
            </div>`
        case 'ready' : 
            return `
            <div class="field-cover">
                <div>
                    <span></span>
                </div>
            </div>
            <div class="field-text ${statusClass}">
                <div class="main-text">${formatDateTime(game.startDatetime).split(' ')[1]}</div>
                <div class="sub-text">경기 시작</div>
            </div>
            <div class="field ${statusClass}"></div>`
        case 'finished' :
            if(game.result === 'DRAW') {
                return `
                    <div class="field-cover">
                        <div class="circle-wrap">
                            <img src="./../../assets/images/tie.png" alt="Team Logo">
                        </div>
                    </div>
                    <div class="field-text">
                        <div class="sub-text">무승부</div>
                    </div>
                    <div class="field ${statusClass}"></div>  
                    `
            } else {
                return `
                    <div class="field-cover">
                        <div class="circle-wrap">
                            <img src="${game.result === 'WIN' 
                                    ? `./../../assets/images/named_images/${game.teams.home.imgPath.split('/')[4]}` 
                                    : `./../../assets/images/named_images/${game.teams.away.imgPath.split('/')[4]}`}"
                            alt="Team Logo">
                        </div>
                    </div>
                    <div class="field-text">
                        <div class="main-text">${game.result === 'WIN' ? game.teams.home.name : game.teams.away.name}</div>
                        <div class="sub-text">경기 승리</div>
                    </div>
                    <div class="field ${statusClass}"></div>
                    `
            }
        case 'cancel' :
            return `
                <div class="field-cover">
                    <div class="circle-wrap">
                        <img src="./../../assets/images/cancle.png"/>
                    </div>
                </div>
                <div class="field-text">
                    <div class="sub-text">경기 취소</div>
                </div>
                <div class="field ${statusClass}"></div>
            `
        case 'postponed' : 
            return `
                <div class="field-cover">
                    <div class="circle-wrap">
                        <img src="./../../assets/images/cancle.png"/>
                    </div>
                </div>
                <div class="field-text">
                    <div class="sub-text">경기 취소</div>
                </div>
                <div class="field ${statusClass}"></div>
            `
    }
}

function createTableRow(game) {

    const gameRow = document.createElement('div');
    gameRow.classList.add('game-row');
    gameRow.setAttribute('data-game-id', game.id);

    const homeScore = game.teams.home.periodData.reduce((total, current) => total + current.score, 0);
    const awayScore = game.teams.away.periodData.reduce((total, current) => total + current.score, 0);

    let homeScoreClass = '';
    let awayScoreClass = '';

    if (homeScore > awayScore) {
        homeScoreClass = 'highlight';
    } else if (homeScore < awayScore) {
        awayScoreClass = 'highlight';
    }

    if (!storeBroadCast[game.id]) {
        storeBroadCast[game.id] = [];
    } else {
        const newBroadcast = game.broadcast;

        if (newBroadcast && !storeBroadCast[game.id].some(broad => broad.playText === newBroadcast.playText)) {
            storeBroadCast[game.id].unshift(newBroadcast);
        }
    }

    gameRow.innerHTML = `
        <div class="field-wrap ${game.gameStatus} ">
            ${createField(game)}
            <div class="field-right-area">
                <div class="special">
                <div class="special-container">
                    <span class="team-label">${game.special.firstBaseOnBall?.location}</span>
                    <span class="specialBtn ${game.special.firstBaseOnBall ? game.special.firstBaseOnBall.location : ''} ">첫진루</span>
                </div>
                <div class="special-container">
                    <span class="team-label">${game.special.firstHomerun?.location}</span>
                    <span class="specialBtn ${game.special.firstHomerun ? game.special.firstHomerun.location : ''}">첫홈런</span>
                </div>
                <div class="special-container">
                    <span class="team-label">${game.special.firstStrikeOut?.location}</span>
                    <span class="specialBtn ${game.special.firstStrikeOut ? game.special.firstStrikeOut.location : ''}">첫삼진</span>
                </div>
            </div>
                <div class="broad-area">
                    <div class="broad-title">중계 기록</div>
                    <div class="game-detail">
                        ${storeBroadCast[game.id]?.map((broad) => {
                            return `<div class="broad-text">${broad?.playText}</div>`
                        }).join('')}
                    </div>
                </div>
                
            </div>
        </div>

        <div class="team-info">
            <div class="tr th">
                <span class="td" >${game.league.name}</span>
                <span class="td" >${formatDateTime(game.startDatetime).split(' ')[1]}</span>
                <span class="td" >${game.gameStatus === 'IN_PROGRESS' ? game.period + '회'+ (game.inningDivision === 'TOP' ? '초' : '말') : getStatusText(game.gameStatus)}</span>
            </div>
            <div class="tr">
                <div class="td">
                    <img width="55" height="55" src="./../../assets/images/named_images/${game.teams.away.imgPath.split('/')[4]}">
                </div>
                <span class="td">
                    <span class="awayspan">away</span>
                    ${game.teams.away.name}
                </span>
                <span class="td ${awayScore > homeScore ? 'highlight' : ''}">
                ${game.gameStatus === 'READY' 
                    ? `선발) ${game.teams.away.startPitcher 
                        ? game.teams.away.startPitcher?.name.length > 5 ? game.teams.away.startPitcher?.name.substring(0, 5) + '..' : game.teams.away.startPitcher?.name
                        : '미정'}` 
                    : awayScore}
            </span>
            </div>
            <div class="tr">
                <div class="td">
                    <img width="55" height="55"  src="./../../assets/images/named_images/${game.teams.home.imgPath.split('/')[4]}">
                </div>
                <span class="td">
                    <span class="homespan">home</span>
                    ${game.teams.home.name}
                </span>
                <span class="td ${homeScore > awayScore ? 'highlight' : ''}">
                ${game.gameStatus === 'READY' 
                    ? `선발) ${game.teams.home.startPitcher 
                        ? game.teams.home.startPitcher?.name.length > 5 ? game.teams.home.startPitcher?.name.substring(0, 5) + '..' : game.teams.home.startPitcher?.name
                        : '미정'}` 
                    : homeScore}
            </span>
            </div>
            <div class="tr th odds">
                ${game.oddsFlag 
                    ? `<span class="td">승/패 - ${game.odds.domesticWinLoseOdds.length > 0 ? game.odds.domesticWinLoseOdds[0].odds +"/"+ game.odds.domesticWinLoseOdds[0].odds : ``}</span>
                <span class="td">핸디(${game.odds.domesticHandicapOdds.length > 0 ? game.odds.domesticHandicapOdds[0].optionValue + ") " + game.odds.domesticHandicapOdds[0]?.odds +"/"+ game.odds.domesticHandicapOdds[1]?.odds : ``}</span>
                <span class="td">언/오(${game.odds.domesticUnderOverOdds.length > 0 ? game.odds.domesticUnderOverOdds[0]?.optionValue + ") " + game.odds.domesticUnderOverOdds[0]?.odds +"/"+ game.odds.domesticUnderOverOdds[1]?.odds : ``}</span>
                `
                    : `<span class="td">승/패 -</span>
                <span class="td">핸디 - </span>
                <span class="td">언/오 - </span>
                `                    
                }
            </div>
        </div>

        <div class="score">
            <div class="tr th ${getStatusClass(game.gameStatus)}">
                ${
                    game.gameStatus !== 'READY'
                    ? Array.from({ length: 12 }, (_, index) => {
                        const period = game.teams.away.periodData[index] || { period: index+1, score: '' }; // 데이터가 없을 경우 빈 값으로 설정
                        if (game.period === index + 1) { // 현재 진행 중인 이닝을 강조
                            return `<span class="td current">${period.period}</span>`;
                        } else {
                            return `<span class="td">${period.period}</span>`;
                        }
                    }).join('') +
                    `   <span class="td">R</span>
                        <span class="td">H</span>
                        <span class="td">E</span>
                        <span class="td">B</span>
                    `
                    : `
                        <span class="td">순위</span>
                        <span class="td">경기</span>
                        <span class="td">승</span>
                        <span class="td">무</span>
                        <span class="td">패</span>
                        <span class="td">승률</span>
                        <span class="td">연속</span>
                        <span class="td">최근<br>경기</span>
                    `
                }
            </div>
            <div class="tr">
            ${
                game.gameStatus !== 'READY' 
                ? Array.from({ length: 12 }, (_, index) => {
                    const period = game.teams.away.periodData[index] || { score: '' }; // 데이터가 없을 경우 빈 값으로 설정
                    if (game.period === index + 1) { // 현재 진행 중인 이닝을 강조
                        return `<span class="td current">${period.score}</span>`;
                    } else {
                        return `<span class="td">${period.score}</span>`;
                    }
                }).join('') +
                `   <span class="td">${awayScore}</span>
                    <span class="td">${game.teams.away.hitCount}</span>
                    <span class="td">${game.teams.away.errorCount}</span>
                    <span class="td">${game.teams.away.baseOnBallCount}</span>
                `
                : 
                `
                    <span class="td">${game.teams.away.seasonRecord.ranking}</span>
                    <span class="td">${game.teams.away.seasonRecord.gameCount}</span>
                    <span class="td">${game.teams.away.seasonRecord.winCount}</span>
                    <span class="td">${game.teams.away.seasonRecord.drawCount}</span>
                    <span class="td">${game.teams.away.seasonRecord.defeatCount}</span>
                    <span class="td">${game.teams.away.seasonRecord.winPercentage}</span>
                    <span class="td">${game.teams.away.seasonRecord.streak}</span>
                    <span class="td">${game.teams.away.seasonRecord.performance.split('-').map(item => `${item}<br>`).join('')}</span>
                    
                `
            }
            </div>
            <div class="tr">
            ${
                game.gameStatus !== 'READY' 
                ? Array.from({ length: 12 }, (_, index) => {
                    const period = game.teams.home.periodData[index] || { score: '' }; // 데이터가 없을 경우 빈 값으로 설정
                    if (game.period === index + 1) { // 현재 진행 중인 이닝을 강조
                        return `<span class="td current">${period.score}</span>`;
                    } else {
                        return `<span class="td">${period.score}</span>`;
                    }
                }).join('') +
                `   <span class="td">${homeScore}</span>
                    <span class="td">${game.teams.home.hitCount}</span>
                    <span class="td">${game.teams.home.errorCount}</span>
                    <span class="td">${game.teams.home.baseOnBallCount}</span>
                `

                : 
                `
                    <span class="td">${game.teams.home.seasonRecord.ranking}</span>
                    <span class="td">${game.teams.home.seasonRecord.gameCount}</span>
                    <span class="td">${game.teams.home.seasonRecord.winCount}</span>
                    <span class="td">${game.teams.home.seasonRecord.drawCount}</span>
                    <span class="td">${game.teams.home.seasonRecord.defeatCount}</span>
                    <span class="td">${game.teams.home.seasonRecord.winPercentage}</span>
                    <span class="td">${game.teams.home.seasonRecord.streak}</span>
                    <span class="td">${game.teams.home.seasonRecord.performance.split('-').map((item) => `${item}<br>`).join('')}</span>
                `
            }
            </div>
            <div class="tr th">
            ${
                game.gameStatus !== 'READY' 
                ? Array.from({ length: 12 }, (_, index) => {

                    let homeInningScore = isNaN(game.teams.home.periodData[index]?.score) ? 0 : game.teams.home.periodData[index]?.score;
                    let awayInningScore = isNaN(game.teams.away.periodData[index]?.score) ? 0 : game.teams.away.periodData[index]?.score;

                    if(index <= game.period-1 ) {
                        return `<span class="td" style="color: #fcc">${homeInningScore + awayInningScore}</span>`;
                    } else {
                        return `<span class="td" style="color: #fcc"></span>`;
                    }

                }).join('') +
                `   <span class="td" style="color: #fcc">${homeScore + awayScore }</span>
                    <span class="td" style="color: #000"></span>
                    <span class="td" style="color: #000"></span>
                    <span class="td" style="color: #000"></span>
                `
                : `
                    <span class="td broad" style="color: #fcc">${game.broadcast? game.broadcast.playText: ''}</span>
                `
            }
            </div>
        </div>
    `;

    return gameRow;
}

async function getGameData() {
    const dataUrl = `https://sports-api.named.com/v1.0/sports/baseball/games?date=${requestDate}&status=ALL`;

    // 날짜를 변경할때마다 바뀐 날짜 적용 
    document.querySelector('.date-display').innerHTML = requestDate;

    const loadingSpinner = document.getElementById('loading-spinner');

    if(!intervalCheck) {
        loadingSpinner.style.display = 'block'; // 로딩 스피너 표시
    } else {
        loadingSpinner.style.display = 'none';
    }

    try {
        const res = await axios.get(dataUrl);
        const gameInfo = countEntries(res.data);

        console.log(gameInfo)

        // DOM 업데이트 최소화
        const totalGameCnt = document.getElementById('total-game-cnt');
        const readyGameCnt = document.getElementById('ready-game-cnt');
        const inProgressGameCnt = document.getElementById('inprogress-game-cnt');
        const finalGameCnt = document.getElementById('final-game-cnt');
        
        totalGameCnt.innerHTML = gameInfo.total;
        readyGameCnt.innerHTML = gameInfo.ready;
        inProgressGameCnt.innerHTML = gameInfo.inProgress;
        finalGameCnt.innerHTML = gameInfo.final;

        const body = document.querySelector('.game-row-wrap');

        if(getActiveButtonId() === "total-button") {
            const fragment = document.createDocumentFragment();

            if(gameInfo?.sortedGameData.length > 0) {
                gameInfo.sortedGameData.forEach((game) => {
                    const row = createTableRow(game);
                    fragment.appendChild(row);
                });
            } else {
                const row = createTableErrorRow();
                fragment.appendChild(row);
            }

            body.innerHTML = ``;
            body.appendChild(fragment);
        } else if (getActiveButtonId() === "ready-button") {
            const fragment = document.createDocumentFragment();

            if(gameInfo?.sortedGameDataByStatus.READY.length > 0) {
                gameInfo.sortedGameDataByStatus.READY.forEach((game) => {
                    const row = createTableRow(game);
                    fragment.appendChild(row);
                })
            } else {
                const row = createTableErrorRow();
                fragment.appendChild(row);
            }

            body.innerHTML = ``;
            body.appendChild(fragment);
        } else if (getActiveButtonId() === "inprogress-button") {
            const fragment = document.createDocumentFragment();

            if(gameInfo?.sortedGameDataByStatus.IN_PROGRESS.length > 0) {
                gameInfo.sortedGameDataByStatus.IN_PROGRESS?.forEach((game) => {
                    const row = createTableRow(game);
                    fragment.appendChild(row);
                })
            } else {
                const row = createTableErrorRow();
                fragment.appendChild(row);
            }

            body.innerHTML = ``;
            body.appendChild(fragment);
        } else if (getActiveButtonId() === "final-button") {
            const fragment = document.createDocumentFragment();

            if(gameInfo?.sortedGameDataByStatus.FINAL.length > 0) {
                gameInfo?.sortedGameDataByStatus?.FINAL?.forEach((game) => {
                    const row = createTableRow(game);
                    fragment.appendChild(row);
                })
            } else {
                const row = createTableErrorRow();
                fragment.appendChild(row);
            }
            
            body.innerHTML = ``;
            body.appendChild(fragment);
        }
    } catch(error) {
        console.log(error);
    } finally {
        loadingSpinner.style.display = 'none'; // 로딩 스피너 숨김
        intervalCheck = false;
    }
}

function createTableErrorRow() {
    const row = document.createElement('div');
    row.className = 'errorRow';

    row.innerHTML = `
        일정된 경기가 없습니다.
    `;

    return row;
}