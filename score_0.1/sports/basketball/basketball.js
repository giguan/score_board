/** 전역변수 - 초기 데이터 오늘임 (선택 일자로 계속 인터벌 돌려야해서) */
let requestDate = getCurrentDate();

document.addEventListener('DOMContentLoaded', async function() {
    // 초기 데이터 로드
    await getGameData();

    // 30초마다 데이터 갱신
    setInterval(async () => {
        await getGameData();
    }, 5000);

    getFullCalendar()
});

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

    const sortedsortedGameData = [
        ...sortedGameData.IN_PROGRESS,
        ...sortedGameData.READY,
        ...sortedGameData.CANCEL,
        ...sortedGameData.FINAL
    ];

    counts.sortedGameData = sortedsortedGameData;  // Include sorted data in counts
    return counts;
}

async function getGameData() {
    const dataUrl = `https://sports-api.named.com/v1.0/sports/basketball/games?date=${requestDate}&status=ALL`;

    // 날짜를 변경할때마다 바뀐 날짜 적용 
    document.querySelector('.date-display').innerHTML = requestDate;

    // const loadingSpinner = document.getElementById('loading-spinner');
    // loadingSpinner.style.display = 'block'; // 로딩 스피너 표시

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

        const body = document.querySelector('.game-row-wrap');

        const fragment = document.createDocumentFragment();

        if(gameInfo?.sortedGameData.length > 0) {
            gameInfo?.sortedGameData?.forEach((game) => {
                const row = createTableRow(game);
                fragment.appendChild(row);
            });
        } else {
            const row = document.createElement('div')
            row.innerHTML = `
                일정된 경기가 없습니다.
            `
            fragment.appendChild(row);
        }


        body.innerHTML = ''
        // 새로운 게임 요소를 추가
        body.append(fragment);
    } catch(error) {
        alert(error);
    } finally {
        loadingSpinner.style.display = 'none'; // 로딩 스피너 숨김
    }
}

function createField(game) {

    const statusClass = getStatusClass(game.gameStatus);

    switch(statusClass) {
        case 'in-progress':
            return `
            <div class="field-cover">
                <div>
                    <span>스코어만 표기 됩니다</span>
                </div>
            </div>
            <div class="field"></div>`
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

    gameRow.innerHTML = `
        <div class="field-wrap">
            ${createField(game)}
        </div>

        <div class="team-info">
            <div class="tr th">
                <span class="td" >${game.league.name}</span>
                <span class="td" >${formatDateTime(game.startDatetime).split(' ')[1]}</span>
                <span class="td" >${game.gameStatus === 'IN_PROGRESS' ? game.period + '쿼터' : getStatusText(game.gameStatus)}</span>
            </div>
            <div class="tr">
                <div class="td">
                    <img width="55" height="55" src="./../../assets/images/named_images/${game.teams.away.imgPath.split('/')[4]}">
                </div>
                <span class="td" >${game.teams.away.name}</span>
                <span class="td ${awayScore > homeScore ? 'highlight' : '' }">${awayScore}</span>
            </div>
            <div class="tr">
                <div class="td">
                    <img width="55" height="55"  src="./../../assets/images/named_images/${game.teams.home.imgPath.split('/')[4]}">
                </div>
                <span class="td" >${game.teams.home.name}</span>
                <span class="td ${homeScore > awayScore ? 'highlight' : ''}">${homeScore}</span>
            </div>
            <div class="tr th">
                <span class="td" ></span>
                <span class="td" ></span>
                <span class="td" ></span>
            </div>
        </div>

        <div class="score">
            <div class="tr th ${getStatusClass(game.gameStatus)}">
                ${
                    game.gameStatus !== 'READY'

                    ? Array.from({length: 5}, (_, index) => {
                        const period = game.teams.away.periodData[index] || { period: index + 1, score: '' };

                        if (index === 4 && !period.period) { // 5번째 데이터가 없을 경우 "연장" 출력
                            return `<span class="td">연장</span>`;
                        }

                        if (game.period === index+1) { // 현재 진행 중인 이닝을 강조
                            return `<span class="td current">${period.period > 4 ? "연장" : `${period.period}Q`}</span>`;
                        } else {
                            return `<span class="td">${period.period > 4 ? "연장" : `${period.period}Q`}</span>`;
                        }
                    }).join('') +
                    `<span class="td">국내</span>`

                    : `
                        <span class="td">순위</span>
                        <span class="td">승/패</span>
                        <span class="td">승률</span>
                        <span class="td">득점</span>
                        <span class="td">야투</span>
                        <span class="td">3점</span>
                        <span class="td">자유투</span>
                    `
                }
            </div>
            <div class="tr">
                ${

                    game.gameStatus !== 'READY'

                    ? Array.from({length: 5}, (_, index) => {
                        const period = game.teams.away.periodData[index] || { score: '' };
                        if (game.period === index + 1) { // 현재 진행 중인 이닝을 강조
                            return `<span class="td current">${period.score}</span>`;
                        } else {
                            return `<span class="td">${period.score}</span>`;
                        }
                    }).join('') + `
                    <span class="td">
                        ${game.odds?.domesticUnderOverOdds.length > 0 
                        ? game.odds?.domesticUnderOverOdds[0].odds
                        : ''
                        }
                    </span>`

                    : `
                        <span class="td">${game.teams.away.seasonRecord.ranking}</span>
                        <span class="td">${game.teams.away.seasonRecord.winCount} / ${game.teams.away.seasonRecord.defeatCount}</span>
                        <span class="td">${game.teams.away.seasonRecord.winPercentage}</span>
                        <span class="td">${game.teams.away.seasonRecord.ranking}</span>
                        <span class="td">${game.teams.away.seasonRecord.fieldGoalSuccessRate}</span>
                        <span class="td">${game.teams.away.seasonRecord.threePointShotSuccessRate}</span>
                        <span class="td">${game.teams.away.seasonRecord.freeThrowSuccessRate}</span>
                    ` 
                }
            </div>
            <div class="tr">
            ${

                game.gameStatus !== 'READY'

                ? Array.from({length: 5}, (_, index) => {
                    const period = game.teams.home.periodData[index] || { score: '' };
                    if (game.period === index + 1) { // 현재 진행 중인 이닝을 강조
                        return `<span class="td current">${period.score}</span>`;
                    } else {
                        return `<span class="td">${period.score}</span>`;
                    }
                }).join('') + `
                <span class="td">
                    ${game.odds?.domesticUnderOverOdds.length > 0 
                    ? game.odds?.domesticUnderOverOdds[0].odds
                    : ''
                    }
                </span>`

                : `
                    <span class="td">${game.teams.home.seasonRecord.ranking}</span>
                    <span class="td">${game.teams.home.seasonRecord.winCount} / ${game.teams.home.seasonRecord.defeatCount}</span>
                    <span class="td">${game.teams.home.seasonRecord.winPercentage}</span>
                    <span class="td">${game.teams.home.seasonRecord.ranking}</span>
                    <span class="td">${game.teams.home.seasonRecord.fieldGoalSuccessRate}</span>
                    <span class="td">${game.teams.home.seasonRecord.threePointShotSuccessRate}</span>
                    <span class="td">${game.teams.home.seasonRecord.freeThrowSuccessRate}</span>
                ` 
            }
            </div>
            <div class="tr th">
            ${

                game.gameStatus !== 'READY'

                ? Array.from({length: 5}, (_, index) => {
                    let homeInningScore = isNaN(game.teams.home.periodData[index]?.score) ? 0 : game.teams.home.periodData[index]?.score;
                    let awayInningScore = isNaN(game.teams.away.periodData[index]?.score) ? 0 : game.teams.away.periodData[index]?.score;

                    if(index <= game.period-1 ) {
                        return `<span class="td" style="color: #000">${homeInningScore + awayInningScore}</span>`;
                    } else {
                        return `<span class="td" style="color: #000"></span>`;
                    }
                }).join('') + `
                <span class="td">
                    ${homeScore + awayScore}
                </span>`
                : `
                ` 
            }
            </div>
        </div>
    `;

    return gameRow;
}

