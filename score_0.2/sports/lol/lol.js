/** 전역변수 - 초기 데이터 오늘임 (선택 일자로 계속 인터벌 돌려야해서) */
let requestDate = getCurrentDate();

let intervalCheck = false;
let gameTimers = {};

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

let activeTabs = {};
let gameTimer = {}
function createTableRow(game) {


    const gameRowWrap = document.createElement('div')
    gameRowWrap.classList.add('game-row-wrap');


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
                            <img width="55" height="55" src="./../../assets/images/named_images/${game.home.img_path.split('/')[4]}">
                        </div>
                        <span class="td" >
                            <span class="homespan">home</span>    
                            ${game.home.name_en}
                        </span>
                        <span class="td ${game.homeScore > game.awayScore ? 'highlight' : '' }">${game.homeScore}</span>
                    </div>
                    <div class="tr">
                        <div class="td">
                            <img width="55" height="55"  src="./../../assets/images/named_images/${game.away.img_path.split('/')[4]}">
                        </div>
                        <span class="td" >
                            <span class="awayspan">away</span>    
                            ${game.away.name_en}
                        </span>
                        <span class="td ${game.awayScore > game.homeScore ? 'highlight' : ''}">${game.awayScore}</span>
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
                                <span class="td">${game.home.rank}</span>
                                <span class="td">${game.home.stat.game_count}</span>
                                <span class="td">${game.home.stat.win}</span>
                                <span class="td">${game.home.stat.lose}</span>
                                <span class="td">${(game.home.stat.win / game.home.stat.game_count).toFixed(3)}</span>
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
                    <div class="tr th">
                    ${
                        `
                            
                        ` 
                    }
                    </div>
                </div>
    `;


    gameRowWrap.appendChild(gameRow);


    if (game.sets.length > 0) {
        const tabs = document.createElement('div');
        tabs.classList.add('game-tabs');

        const tabContents = document.createElement('div');
        tabContents.classList.add('game-tab-contents'); // Wrapper for tab contents

        const tabNames = ['1세트', '2세트', '3세트', '4세트', '5세트'];
        const positionsKr = [' ', '탑', '정글', '미드', '원딜', '서포트'];
        const positions = ['TOP', 'JUNGLE', 'MID', 'AD', 'SUPPORT'];

        if (!activeTabs[game.gidx]) {
            activeTabs[game.gidx] = `game-${game.gidx}-set-1`;
        }
        let activeTab = activeTabs[game.gidx];

        tabNames.forEach((tabName, index) => {
            const tab = document.createElement('button');
            tab.classList.add('game-tab-link');
            tab.textContent = tabName;
            tab.setAttribute('data-tab', `game-${game.gidx}-set-${index + 1}`); // Set unique data-tab attribute for each tab


            if (index >= game.sets.length) {
                tab.disabled = true; // Disable tab if the set does not exist
            } else {
                tab.addEventListener('click', (event) => openTab(event, `game-${game.gidx}-set-${index + 1}`));

                if (activeTab === `game-${game.gidx}-set-${index + 1}`) {
                    tab.classList.add('active'); // Restore previously active tab
                }
            }
            tabs.appendChild(tab);

            const tabContent = document.createElement('div');
            tabContent.classList.add('game-tab-content');
            tabContent.setAttribute('data-tab', `game-${game.gidx}-set-${index + 1}`); // Set unique data-tab attribute for each tab content
            
            if (activeTab === `game-${game.gidx}-set-${index + 1}`) {
                tabContent.classList.add('active'); // Restore previously active content
            }

            if (index < game.sets.length) {
                const sortedHomePlayers = game.sets[index].home.players.sort((a, b) => positions.indexOf(a.position) - positions.indexOf(b.position));
                const sortedAwayPlayers = game.sets[index].away.players.sort((a, b) => positions.indexOf(a.position) - positions.indexOf(b.position));

                let startTime = new Date('1970-01-01T00:00:00Z').getTime();
                if (game.sets[index].sstatus === 2 || game.sets[index].sstatus === 1) {
                    startTime = new Date(`1970-01-01T${game.sets[index].startTime}Z`).getTime(); // Assuming startTime is in HH:MM:SS format
                }

                tabContent.innerHTML = `
                    <div class="header-info">
                        <div class="team-info">
                            <div class="team-stats">
                                <span>골드 ${game.sets[index].home.gold}</span>
                                <span>포탑 ${game.sets[index].home.tower}</span>
                                <span>바론 ${game.sets[index].home.baron}</span>
                                <span>용 ${game.sets[index].home.dragon}</span>
                            </div>
                            <div class="first-events">
                                ${game.sets[index].firstBlood === 'b' ? `<span class="firstBtn on">첫 킬</span>` : `<span class="firstBtn off">첫 킬</span>`}
                                ${game.sets[index].first10Kill === 'b' ? `<span class="firstBtn on">첫 10킬</span>` : `<span class="firstBtn off">첫 10킬</span>`}
                                ${game.sets[index].firstTower === 'b' ? `<span class="firstBtn on">첫 타워</span>` : `<span class="firstBtn off">첫 타워</span>`}
                                ${game.sets[index].firstDragon === 'b' ? `<span class="firstBtn on">첫 용</span>` : `<span class="firstBtn off">첫 용</span>`}
                                ${game.sets[index].firstBaron === 'b' ? `<span class="firstBtn on">첫 바론</span>` : `<span class="firstBtn off">첫 바론</span>`}
                            </div>
                        </div>
                        <div class="team-match">
                            <div class="team-logo">
                                <img src="./../../assets/images/named_images/${game.home.img_path.split('/')[4]}" alt="${game.home.name}">
                                <div class="score-info">
                                    <span class="score ${game.sets[index].winner === 'a' ? 'highlight' : ''}">${game.sets[index].home.kill}</span>
                                    <span> - </span>
                                    <span class="score ${game.sets[index].winner === 'a' ? '' : 'highlight'}">${game.sets[index].away.kill}</span>
                                </div>
                                <img src="./../../assets/images/named_images/${game.away.img_path.split('/')[4]}" alt="${game.away.name}">
                            </div>
                            <div class="match-info">
                                <div>
                                    ${game.sets[index].winner
                                        ? `${game.sets[index].winner === 'h' ? '<span class="score-detail-highlight">승</span>' : '<span class="score-detail">패</span>'}
                                            <span>${game.sets[index].totalTime ? game.sets[index].totalTime : '00:00'}</span>
                                            ${game.sets[index].winner === 'a' ? '<span class="score-detail-highlight">승</span>' : '<span class="score-detail">패</span>'}`
                                        : `<span class="dynamic-timer" id="dynamic-time-${game.gidx}-${index}">${game.sets[index].sstatus === 1 ? '벤픽 중' : '진행 중'}</span>`
                                    }
                                </div>
                            </div>
                        </div>
                        <div class="team-info">
                            <div class="team-stats">
                                <span>골드 ${game.sets[index].away.gold}</span>
                                <span>포탑 ${game.sets[index].away.tower}</span>
                                <span>바론 ${game.sets[index].away.baron}</span>
                                <span>용 ${game.sets[index].away.dragon}</span>
                            </div>
                            <div class="first-events">
                                ${game.sets[index].firstBlood === 'r' ? `<span class="firstBtn on">첫 킬</span>` : `<span class="firstBtn off">첫 킬</span>`}
                                ${game.sets[index].first10Kill === 'r' ? `<span class="firstBtn on">첫 10킬</span>` : `<span class="firstBtn off">첫 10킬</span>`}
                                ${game.sets[index].firstTower === 'r' ? `<span class="firstBtn on">첫 타워</span>` : `<span class="firstBtn off">첫 타워</span>`}
                                ${game.sets[index].firstDragon === 'r' ? `<span class="firstBtn on">첫 용</span>` : `<span class="firstBtn off">첫 용</span>`}
                                ${game.sets[index].firstBaron === 'r' ? `<span class="firstBtn on">첫 바론</span>` : `<span class="firstBtn off">첫 바론</span>`}
                            </div>
                        </div>
                    </div>
                    <div class="game-details">
                        <div class="teams">
                            <div class="team">
                                <div class="team-header">${game.home.name_en}</div>
                                ${sortedHomePlayers.map((player, idx) => `
                                    <div class="player ${game.sets[index].mvp == player.player.pid ? 'mvp' : ''}">
                                        <div class="player-kda">${player.kill}/${player.death}/${player.assist}</div>
                                        ${!player.champion && game.sets[index].sstatus === 1 ? `<div class="player-selecting">선택중</div>` : ''}

                                        ${player.champion 
                                            ? `<div class="player-champion"><img src="./../../assets/images/lol_champions/${player.champion?.img_path.split('/')[4]}" alt="${player.champion?.name}" /></div>`
                                            : `<div class="player-champion"><img src="./../../assets/images/lol_champions/League-of-Legends-Game-Logo.jpg" /></div>`
                                        }
                                        <div class="player-name">${player.player.nickname}</div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="positions">
                                ${positionsKr.map(position => `
                                    <div class="position">${position}</div>
                                `).join('')}
                            </div>
                            <div class="team">
                                <div class="team-header">${game.away.name_en}</div>
                                ${sortedAwayPlayers.map((player, idx) => `
                                    <div class="player ${game.sets[index].mvp == player.player.pid ? 'mvp' : ''}">
                                        <div class="player-kda">${player.kill}/${player.death}/${player.assist}</div>
                                        ${!player.champion && game.sets[index].sstatus === 1 ? `<span class="player-selecting">선택중</span>` : ''}

                                        ${player.champion 
                                            ? `<div class="player-champion"><img src="./../../assets/images/lol_champions/${player.champion?.img_path.split('/')[4]}" alt="${player.champion?.name}" /></div>`
                                            : `<div class="player-champion"><img src="./../../assets/images/lol_champions/League-of-Legends-Game-Logo.jpg" /></div>`
                                        }
                                        <div class="player-name">${player.player.nickname}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="bans">
                            <div class="ban-list">
                                ${game.sets[index].home.banPicks.map((ban) => {
                                    if(ban) {
                                        return `<img src="./../../assets/images/lol_champions/${ban?.img_path.split('/')[4]}" alt="${ban?.name}" />`
                                    } else {
                                        return `<img src="./../../assets/images/lol_champions/League-of-Legends-Game-Logo.jpg" />`
                                    }
                                }).join('')}
                                <div class="bans-header">BAN<br>Picks</div>
                                ${game.sets[index].away.banPicks.map((ban) => {
                                    if(ban) {
                                        return `<img src="./../../assets/images/lol_champions/${ban?.img_path.split('/')[4]}" alt="${ban?.name}" />`
                                    } else {
                                        return `<img src="./../../assets/images/lol_champions/League-of-Legends-Game-Logo.jpg" />`
                                    }
                                }).join('')}
                            </div>
                        </div>
                    </div>
                `;

                tabContents.appendChild(tabContent);

                // if (game.sets[index].sstatus === 2 || game.sets[index].sstatus === 1) {
                //     const dynamicTimeElement = tabContent.querySelector(`#dynamic-time-${game.gidx}-${index}`);
                //     if (dynamicTimeElement) {
                //         const updateTime = () => {
                //             const currentTime = new Date().getTime();
                //             const elapsedTime = currentTime - startTime;
                //             const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
                //             const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
                //             const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
                //             const timeString = `${hours > 0 ? hours.toString().padStart(2, '0') + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                //             dynamicTimeElement.innerHTML = `${game.sets[index].sstatus === 1 ? '벤픽중 ' : ''}${timeString}`;
                //         };
                //         gameTimers[`dynamic-time-${game.gidx}-${index}`] = setInterval(updateTime, 1000);
                //     }
                // }
            }
        });

        gameRowWrap.appendChild(tabs);
        gameRowWrap.appendChild(tabContents); // Append tab contents wrapper after tabs
    }

    return gameRowWrap;
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

function openTab(evt, tabName) {
    const gameId = tabName.split('-')[1];
    var i, tabContent, tabLinks;

    // Get all elements with matching data-tab attribute and hide them
    tabContent = document.querySelectorAll(`.game-tab-content[data-tab^="game-${gameId}-"]`);
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
        tabContent[i].classList.remove('active');
    }

    // Get all elements with matching data-tab attribute and remove the class "active"
    tabLinks = document.querySelectorAll(`.game-tab-link[data-tab^="game-${gameId}-"]`);
    for (i = 0; i < tabLinks.length; i++) {
        tabLinks[i].className = tabLinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.querySelector(`.game-tab-content[data-tab="${tabName}"]`).style.display = "block";
    document.querySelector(`.game-tab-content[data-tab="${tabName}"]`).classList.add('active');
    evt.currentTarget.className += " active";

    // 현재 활성 탭을 저장
    activeTabs[gameId] = tabName;
}