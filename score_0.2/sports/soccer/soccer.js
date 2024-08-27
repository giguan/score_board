
/** 전역변수 - 초기 데이터 오늘임 (계속 인터벌 돌려야해서) */
let requestDate = getCurrentDate();

/** 전역변수 - 불러온 게임 데이터 정렬 */
const sortedGameData = [];

let intervalCheck = false;
document.addEventListener('DOMContentLoaded', async function() {

    await getGameData();

    setInterval(async () => {
        intervalCheck = true;
        await getGameData()
    }, 5000);

    // Full calendar 관련
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

/** 
 * 1. 총 게임 수 반환 및 데이터 정제
 * 2. in_progress => ready => cancle => final 순으로 정렬한 데이터가 
 * @Param mainGameData
 * @Return 정제 데이터
*/
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

    console.log(game.gameStatus)

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
        <div class="cell tr-icon league-icon">${game.league.shortName}</div>
        <div class="cell time-column">${formatDateTime(game.startDatetime).split(' ')[1]}</div>
        <div class="cell team-column home">${
            game.teams.home.imgPath 
                ? `<img class="team-icon" src="${THUMB_URL + game.teams.home.imgPath}" alt="홈팀 아이콘"></img>`
                : ''
        }${game.teams.home.name}</div>
        <div class="cell score-column home ${homeScoreClass}">${homeScore}</div>
        <div class="cell"><span class="status ${getStatusClass(game.gameStatus)}">${game.gameStatus === 'IN_PROGRESS' ? getPeriodText(game) : getStatusText(game.gameStatus)}</span></div>
        <div class="cell score-column away ${awayScoreClass}">${awayScore}</div>
        <div class="cell team-column home">${
            game.teams.away.imgPath 
                ? `<img class="team-icon" src="${THUMB_URL + game.teams.away.imgPath}" alt="홈팀 아이콘"></img>`
                : ''
        }${game.teams.away.name}</div>
    `;

    row.appendChild(gameRow);

    return row;
}

async function getGameData() {
    const dataUrl = `${MAIN_URL}/v1.0/sports/soccer/games?date=${requestDate}&status=ALL`

    // 날짜를 변경할때마다 바뀐 날짜 적용 
    document.querySelector('.date-display').innerHTML = requestDate;

    const loadingSpinner = document.getElementById('loading-spinner');
    const tbody = document.getElementById('score-table');
    // loadingSpinner.style.display = 'block'; // 로딩 스피너 표시

    if(!intervalCheck) {
        loadingSpinner.style.display = 'block'; // 로딩 스피너 표시
    } else {
        loadingSpinner.style.display = 'none';
    }

    try {
        const res = await axios.get(dataUrl, {
            headers: {
                'Accept-Language': 'ko'
            }
        });

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
