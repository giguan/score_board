
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

    // 초기화: collapse-content를 모두 숨기기
    document.querySelectorAll('.collapse-content').forEach(content => {
        content.style.display = 'none';
    });

    // 탭 메뉴 및 콘텐츠 토글 기능
    document.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('click', (e) => {
            console.log(item);

            const collapseContent = item.nextElementSibling; // item의 다음 형제 요소로 collapse-content를 찾음
            const isActive = collapseContent.style.display === 'block';

            // 모든 collapse-content를 숨기기
            document.querySelectorAll('.collapse-content').forEach(el => el.style.display = 'none');
            
            if (!isActive) {
                collapseContent.style.display = 'block';

                // 탭 메뉴 버튼 이벤트 설정
                const tabMenu = collapseContent.querySelector('.tab-menu');
                const tabContents = collapseContent.querySelectorAll('.tab-content');

                tabMenu.querySelectorAll('button').forEach((button, index) => {
                    button.addEventListener('click', () => {
                        tabMenu.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                        tabContents.forEach(content => content.classList.remove('active'));

                        button.classList.add('active');
                        tabContents[index].classList.add('active');
                    });
                });

                // 첫 번째 탭을 기본 활성화 상태로 설정
                tabMenu.querySelectorAll('button')[0].click();
            }
        });
    });

});

const statusPriority = {
    'aet': 1,
    'ninth_inning': 2,
    'eighth_inning': 3,
    'seventh_inning': 4,
    'sixth_inning': 5,
    'fifth_inning': 6,
    'fourth_inning': 7,
    'third_inning': 8,
    'second_inning': 9,
    'first_inning': 10,
    'not_started': 11,
    'ended': 12
};

const sortMatches = (a, b) => {
    const priorityA = statusPriority[a.code_state] || 13; // 기본 우선 순위 (모든 상태에 대해 정의되지 않은 경우)
    const priorityB = statusPriority[b.code_state] || 13; // 기본 우선 순위
    
    return priorityA - priorityB;
};

function getActiveButtonId() {
    const activeButton = document.querySelector('.filters span.active');
    return activeButton ? activeButton.id : null;
}

async function getGameData() {
    // 날짜를 변경할때마다 바뀐 날짜 적용 
    document.querySelector('.date-display').innerHTML = requestDate;

    const loadingSpinner = document.getElementById('loading-spinner');
    const tbody = document.getElementById('score-table');

    if(!intervalCheck) {
        loadingSpinner.style.display = 'block'; // 로딩 스피너 표시
    } else {
        loadingSpinner.style.display = 'none';
    }

    const soccerCategory = ["International Club", "International", '일본']

    //야구의 경우 미국 대한민국 일본이 카테고리임
    const res = await axios.get('http://localhost:3000/proxy/soccer/match-list', {
        params: {
            date: requestDate
        }
    })
    .then(response => {

        const data = response.data;

        console.log(data)

        const filteredData = response.data.filter(match => soccerCategory.includes(match.category_name));
        filteredData.sort(sortMatches);
        
        const gameInfo = countEntries(filteredData);
        console.log(gameInfo)

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

            if(gameInfo.sortedGameData.length > 0) {
                gameInfo.sortedGameData.forEach((game, index) => {
                    const row = createTableRow(game, index);
                    fragment.appendChild(row);
                })
            } 

            tbody.innerHTML = ``;
            tbody.appendChild(fragment);
        } else if (getActiveButtonId() === "ready-button") {
            const fragment = document.createDocumentFragment();

            if(gameInfo.sortedGameDataByStatus.READY.length > 0) {
                gameInfo.sortedGameDataByStatus.READY.forEach((game, index) => {
                    const row = createTableRow(game, index);
                    fragment.appendChild(row);
                })
            }

            tbody.innerHTML = ``;
            tbody.appendChild(fragment);
        } else if (getActiveButtonId() === "inprogress-button") {
            const fragment = document.createDocumentFragment();

            if(gameInfo.sortedGameDataByStatus.IN_PROGRESS.length > 0) {
                gameInfo.sortedGameDataByStatus.IN_PROGRESS.forEach((game, index) => {
                    const row = createTableRow(game, index);
                    fragment.appendChild(row);
                })
            }
            
            tbody.innerHTML = ``;
            tbody.appendChild(fragment);
        } else if (getActiveButtonId() === "final-button") {
            const fragment = document.createDocumentFragment();

            if(gameInfo.sortedGameDataByStatus.FINAL.length > 0) {
                gameInfo.sortedGameDataByStatus.FINAL.forEach((game, index) => {
                    const row = createTableRow(game, index);
                    fragment.appendChild(row);
                })
            }

            tbody.innerHTML = ``;
            tbody.appendChild(fragment);
        }


        //not_started, end, ate
        loadingSpinner.style.display = 'none'; // 로딩 스피너 숨김
        intervalCheck = false;
    })
    .catch(error => {
      console.error('Error:', error);
    })
    ;
}

function countEntries(data) {
    
    console.log("@@",data)

    const counts = {};
    let total = 0, ready = 0, inProgress = 0, final =0;
    const sortedGameData = {
        IN_PROGRESS: [],
        READY: [],
        CANCEL: [],
        FINAL: []
    };

    data.forEach((match) => {

        if(match.code_state === 'ended') {
            final++;
            sortedGameData.FINAL.push(match);
        } else if (match.code_state === 'not_started') {
            ready++;
            sortedGameData.READY.push(match);
        } else {
            inProgress++;
            sortedGameData.IN_PROGRESS.push(match);
        }
    })

    counts.total = data.length;
    counts.final = final;
    counts.ready = ready;
    counts.inProgress = inProgress;

    const sortedGameDataArray = [
        ...sortedGameData.IN_PROGRESS,
        ...sortedGameData.READY,
        ...sortedGameData.CANCEL,
        ...sortedGameData.FINAL
    ];

    counts.sortedGameData = sortedGameDataArray;
    counts.sortedGameDataByStatus = sortedGameData; // 상태별 배열 추가

    return counts

}

function getChangeLeagueName(name) {

    if (name === '미국') {
        return 'MLB'
    } else if (name === '대한민국') {
        return 'KBO'
    } else {
        return 'NPB';
    }
    

}

function getStatusClass(state) {
    switch(state) {
        case 'ended':
            return 'final'
        case 'not_started':
            return 'ready'
        case 'postponed':
            return 'postponed'
        default:
            return 'in-progress'
    }
}

function getStatusText(state) {
    switch(state) {
        case 'ended':
            return '종료'
        case 'not_started':
            return '대기'
        case 'postponed':
            return '연기'
        case 'break':
            return '임시중단'
        default:
            return '진행'
    }
}

function getFormmatTime(time) {
    const timePart = time.split('T')[1].split(':00+')[0];
    return timePart;
}

function getStateToPeriod(state) {

    switch(state) {
        case 'first_inning' :
            return '1'
        case 'second_inning' :
            return '2'
        case 'third_inning' :
            return '3'
        case 'fourth_inning' :
            return '4'
        case 'fifth_inning' :
            return '5'
        case 'sixth_inning' :
            return '6'
        case 'seventh_inning' :
            return '7'
        case 'eighth_inning' :
            return '8'
        case 'ninth_inning' :
            return '9'
        case 'extra-time':
            return '연장'
        default :
            return '--'
    }

}

function createTableRow(game, index) {

    const rowWrapper = document.createElement('div');
    rowWrapper.innerHTML = `
        <div class="league-name">${game.category_name} ${game.sub_tournament_name}</div>
    `
    rowWrapper.className = 'list-item-wrapper';
    
    const row = document.createElement('div');
    row.className = 'list-item';
    row.setAttribute('data-id', index+1)

    row.innerHTML = `
        <div class="triangle ${getStatusClass(game.code_state)}">
            <span class="triangle-text">${getStatusText(game.code_state)}</span>
        </div>
        <div class="item-left">
            <div class="image-container">
                ${game.participants ? `<img src=https://24live.com${game.participants[0].countryImage} alt="country logo"/>` : ''}
            </div>
            <div class="league">${game.tournament_name ? game.tournament_name.split(' ')[0] : game.sub_tournament_name.split(' ')[0]}</div>
            <div class="game-time">${getFormmatTime(game.start_date)}</div>
        </div>
        <div class="item-center">
            <div class="home">
                <div class="image-container">
                    <img src="https://24live.com${game.participants[0].image}" alt="home logo"/>
                </div>
                <span>${game.participants[0].name}</span>
                <div class="home-score">
                    ${
                        game.score.periods.map((period) => {
                            if(period.home_team !== null) {
                                if(game.code_state === period.trans_name.split('.')[2]) {
                                    return `<span class="current-period">${period.home_team}</span>` 
                                } else {
                                    return `<span>${period.home_team}</span>`
                                }
                            } else {
                                return `<span>0</span>`
                            }
                        }).join('')
                    }
                </div>
            </div>
            <div class="away">
                <div class="image-container">
                    <img src="https://24live.com${game.participants[1].image}" alt="away logo"/>
                </div>
                <span>${game.participants[1].name}</span>
                <div class="away-score">
                ${
                    game.score.periods.map((period) => {
                        if(period.away_team !== null) {
                            if(game.code_state === period.trans_name.split('.')[2]) {
                                return `<span class="current-period">${period.away_team}</span>` 
                            } else {
                                return `<span>${period.away_team}</span>`
                            }
                        } else {
                            return `<span>0</span>`
                        }
                    }).join('')
                }
                </div>   
            </div>
        </div>
        <div class="item-right">
            <div class="score ${game.score.home_team > game.score.away_team ? "highlight" : ""}">${game.score.home_team !== null | undefined ? game.score.home_team : "-"}</div>
            <div><span class="period ${getStatusClass(game.code_state)}">
                ${game.code_state.indexOf('inning') > -1 ? `${getStateToPeriod(game.code_state)}회`
                    : game.code_state.indexOf('ended') > -1 ? `종료`
                    : game.code_state.indexOf('not_started') > -1 ? `대기`
                    : game.code_state.indexOf('aet') > -1 ? `연장`
                : '연기'
                }
            </span></div>
            <div class="score ${game.score.away_team > game.score.home_team ? "highlight" : ""}">${game.score.away_team !== null | undefined ? game.score.away_team : "-"}</div>
        </div>
    `;

    const collapse = document.createElement('div')
    collapse.className = "collapse-content";

    collapse.innerHTML = `
        <div class="tab-menu">
            <button class="tab-link" data-tab="tab1">Tab 1</button>
            <button class="tab-link" data-tab="tab2">Tab 2</button>
        </div>
        <div class="tab-content" id="tab1">
            <p>Content 1-1</p>
        </div>
        <div class="tab-content" id="tab2">
            <p>Content 1-2</p>
        </div>
    `

    const gameStatus = document.createElement('div')
    gameStatus.className = 'triangle';

    rowWrapper.append(row)
    rowWrapper.append(collapse)
    // rowWrapper.append(gameStatus)


    return rowWrapper;

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
