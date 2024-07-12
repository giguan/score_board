
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
    fetchDataPeriodically();

    // Full calendar 관련
    getFullCalendar()

});

/** 
 * 1. 총 게임 수 반환 및 데이터 정제
 * 2. in_progress => ready => cancle => final 순으로 정렬한 데이터가 
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
                } else {
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
    const sortedsortedGameData = [
        ...sortedGameData.IN_PROGRESS,
        ...sortedGameData.READY,
        ...sortedGameData.CANCEL,
        ...sortedGameData.FINAL
    ];

    counts.sortedGameData = sortedsortedGameData;  // Include sorted data in counts
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

    const tr = document.createElement('tr');
    tr.id = game.id;
    tr.style.cursor = 'pointer';
    const homeScore = game.teams.home.periodData.reduce((total, current) => total + current.score, 0);
    const awayScore = game.teams.away.periodData.reduce((total, current) => total + current.score, 0);


    // 상세 탭 잠시제거
    // tr.addEventListener('click', () => {
    //     window.open(`./popup/index.html?sportsType=${game.sportsType}&id=${game.id}`, '_blank', 'width=1100, height=800')
    // });


    let homeScoreClass = '';
    let awayScoreClass = '';

    if (homeScore > awayScore) {
        homeScoreClass = 'highlight';
    } else if (homeScore < awayScore) {
        awayScoreClass = 'highlight';
    }

    tr.innerHTML = `
        <td class="tr-icon league-icon"><img src=${getSportsIcon(game.sportsType)} alt="리그 아이콘"> ${game.league.name.length > 4 ? game.league.name.substring(0,4) + "..." : game.league.name }</td>
        <td class="time-column">${formatDateTime(game.startDatetime).split(' ')[1]}</td>
        <td class="team-column"><img class="team-icon" src="./assets/images/small_logo/${game.teams.home.imgPath.split('/')[4]}" alt="홈팀 아이콘"> ${game.teams.home.name}</td>
        <td class="score-column ${homeScoreClass}">${homeScore}</td>
        <td><span class="status ${getStatusClass(game.gameStatus)}">${game.gameStatus === 'IN_PROGRESS' ? getPeriodText(game) : getStatusText(game.gameStatus)}</span></td>
        <td class="score-column ${awayScoreClass}">${awayScore}</td>
        <td class="team-column"><img class="team-icon" src="./assets/images/small_logo/${game.teams.away.imgPath.split('/')[4]}" alt="원정팀 아이콘"> ${game.teams.away.name}</td>
    `;

    return tr;
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

async function getGameData() {
    const dataUrl = `https://sports-api.named.com/v1.0/popular-games?date=${requestDate}&tomorrow-game-flag=true`;

    // 날짜를 변경할때마다 바뀐 날짜 적용 
    document.querySelector('.date-display').innerHTML = requestDate;

    const loadingSpinner = document.getElementById('loading-spinner');
    const tbody = document.getElementById('gameDataBody');

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
        const fragment = document.createDocumentFragment();
        
        gameInfo?.sortedGameData?.forEach((game) => {
            const row = createTableRow(game);
            fragment.appendChild(row);
        });

        tbody.innerHTML = '';
        tbody.appendChild(fragment);
    } catch (error) {
        // 오류 메시지 표시
        const errorMessage = document.createElement('tr');
        errorMessage.className = 'error-message';
        const errorTd = document.createElement('td');
        errorTd.colSpan = 7; // 테이블의 전체 열을 차지하도록 설정
        errorTd.textContent = error.response && error.response.status === 404 
            ? '데이터가 없습니다.' 
            : '알 수 없는 오류가 발생했습니다.';
        errorMessage.appendChild(errorTd);
        tbody.appendChild(errorMessage);

        console.log('get data error.....');
    } finally {
        loadingSpinner.style.display = 'none'; // 로딩 스피너 숨김
        intervalCheck = false;
    }
}
