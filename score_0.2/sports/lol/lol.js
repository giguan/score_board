/** 전역변수 - 초기 데이터 오늘임 (선택 일자로 계속 인터벌 돌려야해서) */
let requestDate = getCurrentDate();

let intervalCheck = false;

async function fetchDataPeriodically() {
    intervalCheck = true;
    await getGameData();
    setTimeout(fetchDataPeriodically, 5000);
}

document.addEventListener('DOMContentLoaded', async function() {
    await getGameData();
    fetchDataPeriodically();

    // FullCalendar 초기화
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
        if (item.gameStatus == '1') {
            ready += 1;
            sortedGameData.READY.push(item);
        } else if (item.gameStatus === '2') {
            inProgress += 1;
            sortedGameData.IN_PROGRESS.push(item);
        } else if (item.gameStatus === '3') {
            final += 1;
            sortedGameData.FINAL.push(item);
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

    return counts;;
}


// async function getGameData() {
//     const dataUrl = `https://sports-api.named.com/v1.0/esports/lol/games?date=${requestDate}&status=ALL`;

//     // 날짜를 변경할때마다 바뀐 날짜 적용 
//     document.querySelector('.date-display').innerHTML = requestDate;

//     const loadingSpinner = document.getElementById('loading-spinner');
//     if(!intervalCheck) {
//         loadingSpinner.style.display = 'block'; // 로딩 스피너 표시
//     } else {
//         loadingSpinner.style.display = 'none';
//     }

//     try {
//         const res = await axios.get(dataUrl);
//         const gameInfo = countEntries(res.data);
    
//         // DOM 업데이트 최소화
//         const totalGameCnt = document.getElementById('total-game-cnt');
//         const readyGameCnt = document.getElementById('ready-game-cnt');
//         const inProgressGameCnt = document.getElementById('inprogress-game-cnt');
//         const finalGameCnt = document.getElementById('final-game-cnt');
        
//         totalGameCnt.innerHTML = gameInfo.total;
//         readyGameCnt.innerHTML = gameInfo.ready;
//         inProgressGameCnt.innerHTML = gameInfo.inProgress;
//         finalGameCnt.innerHTML = gameInfo.final;

//         const body = document.querySelector('.game-row-wrap');

//         if(getActiveButtonId() === "total-button") {
//             const fragment = document.createDocumentFragment();

//             gameInfo?.sortedGameData?.forEach((game) => {
//                 const row = createTableRow(game);
//                 fragment.appendChild(row);
//             });

//             body.innerHTML = ``;
//             body.appendChild(fragment);
//         } else if (getActiveButtonId() === "ready-button") {
//             const fragment = document.createDocumentFragment();
//             gameInfo?.sortedGameDataByStatus?.READY?.forEach((game) => {
//                 const row = createTableRow(game);
//                 fragment.appendChild(row);
//             })
//             body.innerHTML = ``;
//             body.appendChild(fragment);
//         } else if (getActiveButtonId() === "inprogress-button") {
//             const fragment = document.createDocumentFragment();
//             gameInfo?.sortedGameDataByStatus?.IN_PROGRESS?.forEach((game) => {
//                 const row = createTableRow(game);
//                 fragment.appendChild(row);
//             })
//             body.innerHTML = ``;
//             body.appendChild(fragment);
//         } else if (getActiveButtonId() === "final-button") {
//             const fragment = document.createDocumentFragment();
//             gameInfo?.sortedGameDataByStatus?.FINAL?.forEach((game) => {

//                 const row = createTableRow(game);
//                 fragment.appendChild(row);
//             })
//             body.innerHTML = ``;
//             body.appendChild(fragment);
//         }
//     } catch(error) {
//         console.log(error);
//     } finally {
//         loadingSpinner.style.display = 'none'; // 로딩 스피너 숨김
//         intervalCheck = false;
//     }
// }

function createTableRow(game) {

    const gameRow = document.createElement('div');
    gameRow.classList.add('game-row');
    gameRow.setAttribute('data-game-id', game.id);

    gameRow.innerHTML = `
                <div class="team-info">
                    <div class="tr th">
                        <span class="td" >${game.leagueName}</span>
                        <span class="td" >${game.gtime.substring(0,5)}</span>
                        <span class="td" >${
                            game.gameStatus == 1 ? '시작전' : game.gameStatus == 2 ? '진행중': '종료'}</span>
                    </div>
                    <div class="tr">
                        <div class="td">
                            <img width="55" height="55" src="./../../assets/images/named_images/${game.away.img_path.split('/')[4]}">
                        </div>
                        <span class="td" >${game.away.name_en}</span>
                        <span class="td ${game.awayScore > game.homeScore ? 'highlight' : '' }">${game.awayScore}</span>
                    </div>
                    <div class="tr">
                        <div class="td">
                            <img width="55" height="55"  src="./../../assets/images/named_images/${game.home.img_path.split('/')[4]}">
                        </div>
                        <span class="td" >${game.home.name_en}</span>
                        <span class="td ${game.homeScore > game.awayScore ? 'highlight' : ''}">${game.homeScore}</span>
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
                            `
                                <span class="td">순위</span>
                                <span class="td">경기</span>
                                <span class="td">승</span>
                                <span class="td">패</span>
                                <span class="td">승률</span>
                            `
                        }
                    </div>
                    <div class="tr">
                        ${
                            `
                                <span class="td">${game.away.rank}</span>
                                <span class="td">${game.away.stat.game_count}</span>
                                <span class="td">${game.away.stat.win}</span>
                                <span class="td">${game.away.stat.lose}</span>
                                <span class="td">${(game.away.stat.win / game.away.stat.game_count).toFixed(3)}</span>
                            ` 
                        }
                    </div>
                    <div class="tr">
                    ${
                        `
                            <span class="td">${game.home.rank}</span>
                            <span class="td">${game.home.stat.game_count}</span>
                            <span class="td">${game.home.stat.win}</span>
                            <span class="td">${game.home.stat.lose}</span>
                            <span class="td">${(game.home.stat.win / game.home.stat.game_count).toFixed(3)}</span>
                        ` 
                    }
                    </div>
                    <div class="tr th">
                    ${
                        `
                            
                        ` 
                    }
                    </div>
                </div>
    `;

    return gameRow;
}

async function getGameData() {
    const dataUrl = `https://sports-api.named.com/v1.0/esports/lol/games?date=${requestDate}&status=ALL`;

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


