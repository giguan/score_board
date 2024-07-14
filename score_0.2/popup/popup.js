
let sportsType = '';
let id = ''
let stats;

function getStatusText(status) {
    switch (status) {
        case 'IN_PROGRESS':
            return '진행중';
        case 'READY':
            return '대기';
        case 'FINAL':
            return '종료';
        case 'CANCEL':
            return '취소';
        default:
            return '알 수 없음';
    }
}

function createBaseballGame(game) {

    // 홈
    const homeLogo = document.querySelector('#homeLogo')
    homeLogo.src = `./../assets/images/large_logo/${game.teams.home.imgPath.split("/")[4]}`
    
    const homeName = document.querySelector('#homeName');
    homeName.innerHTML = game.teams.home.name;

    const homeRanking = document.querySelector('#homeRanking')
    homeRanking.innerHTML = game.season.name + ' ' +game.teams.home.seasonRecord.ranking + '위' ;
    
    const homeScore = game.teams.home.periodData.reduce((total, current) => total + current.score, 0);
    
    const homeScoreEl = document.querySelector('.score-team1');
    homeScoreEl.innerHTML = homeScore;

    //inning
    const inningEl = document.querySelector('.period')

    if(game.gameStatus === 'IN_PROGRESS') {
        inningEl.innerHTML = game.period + '회' + (game.inningDivision === 'TOP' ? '초' : '말');
    } else {
        inningEl.innerHTML = getStatusText(game.gameStatus);
    }

    //어웨이
    const awayLogo = document.querySelector('#awayLogo')
    awayLogo.src = `./../assets/images/large_logo/${game.teams.away.imgPath.split("/")[4]}`

    const awayName = document.querySelector('#awayName');
    awayName.innerHTML = game.teams.away.name;

    const awayRanking = document.querySelector('#awayRanking')
    awayRanking.innerHTML = game.season.name + ' ' +game.teams.away.seasonRecord.ranking + '위' ;

    const awayScore = game.teams.away.periodData.reduce((total, current) => total + current.score, 0);
    
    const awayScoreEl = document.querySelector('.score-team2');
    awayScoreEl.innerHTML = awayScore;

    //스코어 테이블
    const scoreBoard = document.querySelector('.scoreBoard');
    scoreBoard.innerHTML = '';

    const homeTr = document.createElement('tr')
    
    homeTr.innerHTML = `
        <td>${game.teams.home.name}</td>

        ${Array.from({ length: 9 }, (_, index) => {
            const period = game.teams.home.periodData[index] || { period: index+1, score: '' }; // 데이터가 없을 경우 빈 값으로 설정
            if (game.period === index + 1) { // 현재 진행 중인 이닝을 강조
                return `<td class=current>${period.score}</td>`;
            } else {
                return `<td>${period.score}</td>`;
            }
        }).join('') + 
        `
            <td>${homeScore}</td>
            <td>${game.teams.home.hitCount}</td>
            <td>${game.teams.home.errorCount}</td>
            <td>${game.teams.home.baseOnBallCount}</td>
        `
    }`;

    scoreBoard.appendChild(homeTr)

    const awayTr = document.createElement('tr')

    awayTr.innerHTML = `
        <td>${game.teams.away.name}</td>

        ${Array.from({ length: 9 }, (_, index) => {
            const period = game.teams.away.periodData[index] || { period: index+1, score: '' }; // 데이터가 없을 경우 빈 값으로 설정
            if (game.period === index + 1) { // 현재 진행 중인 이닝을 강조
                return `<td class=current>${period.score}</td>`;
            } else {
                return `<td>${period.score}</td>`;
            }
        }).join('') + 
        `
            <td>${awayScore}</td>
            <td>${game.teams.away.hitCount}</td>
            <td>${game.teams.away.errorCount}</td>
            <td>${game.teams.away.baseOnBallCount}</td>
        `
    }`;

    scoreBoard.appendChild(awayTr)

    // 배당 odds - 일반 승 무 패
    const odds_normal = document.querySelector('.odds-record-normal');

    odds_normal.innerHTML = ''

    const odds_normal_tr = document.createElement('tr')
    odds_normal_tr.innerHTML = `
        <td><img src="./../assets/images/proto.png"/></td>
        <td></td>
        <td>${game.odds.domesticWinLoseOdds[0].odds}</td>
        <td> - </td>
        <td>${game.odds.domesticWinLoseOdds[1].odds}</td>
    `
    odds_normal.appendChild(odds_normal_tr);

    // 배당 odds - 핸디캡
    const odds_handi = document.querySelector('.odds-record-handi');
    odds_handi.innerHTML = ''

    const odds_handi_tr = document.createElement('tr')

    odds_handi_tr.innerHTML = `
        <td><img src="./../assets/images/proto.png"/></td>
        <td></td>
        <td>${game.odds.domesticHandicapOdds[0].odds}</td>
        <td> - </td>
        <td>${game.odds.domesticHandicapOdds[1].odds}</td>
    `
    odds_handi.appendChild(odds_handi_tr);

    // 배당 odds - 언/오버
    const odds_unOver = document.querySelector('.odds-record-unOver');
    odds_unOver.innerHTML = ''

    const odds_unOver_tr = document.createElement('tr')

    odds_unOver_tr.innerHTML = `
        <td><img src="./../assets/images/proto.png"/></td>
        <td></td>
        <td>${game.odds.domesticUnderOverOdds[0].odds}</td>
        <td> - </td>
        <td>${game.odds.domesticUnderOverOdds[1].odds}</td>
    `
    odds_unOver.appendChild(odds_unOver_tr);


    // record
    axios.get(`
        https://sports-api.named.com/v1.0/sports/${sportsType.toLowerCase()}/games/${id}/record`
    ).then((res) => {

        const relativeRecord = document.querySelector('.relative-record');

        // 상대 전적
        res.data.vsRecord.forEach((item) => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${item.startDateTime.substring(0,10)}</td>
                <td>${item.home?.name}</td>
                <td>${item.home?.periodData.reduce((total, current) => total + current.score, 0)} : ${item.away?.periodData.reduce((total, current) => total + current.score, 0)} </td>
                <td>${item.away?.name}</td> 
                <td>홈패 핸디승 오버</td>
            `
            
            relativeRecord.appendChild(tr);
        })


        const recentHomeRecord = document.querySelector('.recent-games-home')
        recentHomeRecord.innerHTML = '';
        // 최근 5경기 -홈
        res.data.recentHomeRecord.forEach((item) => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${item.startDateTime.substring(0,10)}</td>
                <td>${item.home?.name}</td>
                <td>${item.home?.periodData.reduce((total, current) => total + current.score, 0)} : ${item.away?.periodData.reduce((total, current) => total + current.score, 0)} </td>
                <td>${item.away?.name}</td> 
                <td>홈패 핸디승 오버</td>
            `
            
            recentHomeRecord.appendChild(tr);
        })

        const recentAwayRecord = document.querySelector('.recent-games-away')
        recentAwayRecord.innerHTML = '';
        // 최근 5경기 -홈
        res.data.recentAwayRecord.forEach((item) => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${item.startDateTime.substring(0,10)}</td>
                <td>${item.home?.name}</td>
                <td>${item.home?.periodData.reduce((total, current) => total + current.score, 0)} : ${item.away?.periodData.reduce((total, current) => total + current.score, 0)} </td>
                <td>${item.away?.name}</td> 
                <td>홈패 핸디승 오버</td>
            `
            
            recentAwayRecord.appendChild(tr);
        })



    })



    axios.get(
        `https://sports-api.named.com/v1.0/sports/${sportsType.toLowerCase()}/games/${id}/lineup`
    ).then((res) => {
        
        console.log("@@@",res.data)

        // 라인업 탭
        const lineupHomePicther = document.querySelector('.lineup-home-picther');
        lineupHomePicther.innerHTML = '';

        const lineupHomePitcherTr = document.createElement('tr');

        res.data.home.pitchings.forEach((item) => {
            lineupHomePitcherTr.innerHTML = `
                <td>${item.player.displayName}</td>
                <td>${item.wins}</td>
                <td>${item.losses}</td>
                <td>${item.saves}</td>
                <td>${item.holds}</td>
                <td>${item.earnedRunAverage}</td>
            `
            lineupHomePicther.appendChild(lineupHomePitcherTr);
        })

        const lineupHomeBetters = document.querySelector('.lineup-home-betters');
        lineupHomeBetters.innerHTML = '';

        res.data.home.batters.forEach((item) => {
            const lineupBettersTr = document.createElement('tr');
            lineupBettersTr.innerHTML = `
                <td>${item.battingSlot}</td>
                <td>${item.player.displayName}</td>
                <td>${item.battingAverage}</td>
                <td>${item.position}</td>
            `
            lineupHomeBetters.append(lineupBettersTr);
        })

        const lineupAwayPicther = document.querySelector('.lineup-away-picther');
        lineupAwayPicther.innerHTML = '';

        const lineupAwayPitcherTr = document.createElement('tr');

        res.data.away.pitchings.forEach((item) => {
            lineupAwayPitcherTr.innerHTML = `
                <td>${item.player.displayName}</td>
                <td>${item.wins}</td>
                <td>${item.losses}</td>
                <td>${item.saves}</td>
                <td>${item.holds}</td>
                <td>${item.earnedRunAverage}</td>
            `
            lineupAwayPicther.appendChild(lineupAwayPitcherTr);
        })

        const lineupAwayBetters = document.querySelector('.lineup-away-betters');
        lineupAwayBetters.innerHTML = '';

        res.data.away.batters.forEach((item) => {
            const lineupBettersTr = document.createElement('tr');
            lineupBettersTr.innerHTML = `
                <td>${item.battingSlot}</td>
                <td>${item.player.displayName}</td>
                <td>${item.battingAverage}</td>
                <td>${item.position}</td>
            `
            lineupAwayBetters.append(lineupBettersTr);
        })


        // 기록 탭
        const recordHomePicther = document.querySelector('.record-home-picther');
        recordHomePicther.innerHTML = '';

        const recordHomePitcherTr = document.createElement('tr');

        res.data.home.pitchings.forEach((item) => {
            recordHomePitcherTr.innerHTML = `
                <td>${item.player.displayName}</td>
                <td>${item.inningPitched}</td>
                <td>${item.pitchCount}</td>
                <td>${item.hit}</td>
                <td>${item.homeRun}</td>
                <td>${item.baseOnBalls}</td>
                <td>${item.strikeOuts}</td>
                <td>${item.run}</td>
                <td>${item.earnedRun}</td>
                <td>${item.todayEarnedRunAverage}</td>
                <td>${item.earnedRunAverage}</td>
            `
            recordHomePicther.appendChild(recordHomePitcherTr);
        })

        const recordHomeBetters = document.querySelector('.record-home-betters');
        recordHomeBetters.innerHTML = '';

        res.data.home.batters.forEach((item) => {
            const recordBettersTr = document.createElement('tr');
            recordBettersTr.innerHTML = `
                <td>${item.battingSlot}</td>
                <td>${item.player.displayName}</td>
                <td>${item.position}</td>
                <td>${item.atBat}</td>
                <td>${item.run}</td>
                <td>${item.hit}</td>
                <td>${item.runBattedIn}</td>
                <td>${item.homeRun}</td>
                <td>${item.baseOnBalls}</td>
                <td>${item.strikeOuts}</td>
                <td>${item.hitByPitchedBall}</td>
                <td>${item.todayBattingAverage}</td>
                <td>${item.seasonBattingAverage}</td>
            `
            recordHomeBetters.append(recordBettersTr);
        })

        const recordAwayPicther = document.querySelector('.record-away-picther');
        recordAwayPicther.innerHTML = '';

        const recordAwayPitcherTr = document.createElement('tr');

        res.data.away.pitchings.forEach((item) => {
            recordAwayPitcherTr.innerHTML = `
                <td>${item.battingSlot}</td>
                <td>${item.player.displayName}</td>
                <td>${item.position}</td>
                <td>${item.atBat}</td>
                <td>${item.run}</td>
                <td>${item.hit}</td>
                <td>${item.runBattedIn}</td>
                <td>${item.homeRun}</td>
                <td>${item.baseOnBalls}</td>
                <td>${item.strikeOuts}</td>
                <td>${item.hitByPitchedBall}</td>
                <td>${item.todayBattingAverage}</td>
                <td>${item.seasonBattingAverage}</td>
            `
            recordAwayPicther.appendChild(recordAwayPitcherTr);
        })

        const recordAwayBetters = document.querySelector('.record-away-betters');
        recordAwayBetters.innerHTML = '';

        res.data.away.batters.forEach((item) => {
            const recordBettersTr = document.createElement('tr');
            recordBettersTr.innerHTML = `
                <td>${item.battingSlot}</td>
                <td>${item.player.displayName}</td>
                <td>${item.battingAverage}</td>
                <td>${item.position}</td>
            `
            recordAwayBetters.append(recordBettersTr);
        })
    })



} 

document.addEventListener('DOMContentLoaded', function () {

    const queryString = window.location.search;

    const urlParams = new URLSearchParams(queryString);

    sportsType = urlParams.get('sportsType');
    id = urlParams.get('id');

    if(sportsType && id) {
        axios.get(`
            https://sports-api.named.com/v1.0/sports/${sportsType.toLowerCase()}/games/${id}`
        ).then((res) => {
           
            const game = res.data

            switch(sportsType) {
                case 'BASEBALL': 
                    createBaseballGame(game);
            }

        })
    }


    // 메인 탭
    const tabs = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function (event) {
            event.preventDefault();

            tabs.forEach(item => item.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });

    // 서브 탭
    const subTabs = document.querySelectorAll('.tab-link-sub');
    const subContents = document.querySelectorAll('.tab-sub-content');

    subTabs.forEach(subTab => {
        subTab.addEventListener('click', function (event) {
            event.preventDefault();

            subTabs.forEach(item => item.classList.remove('active'));
            subContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });

    // 배당 탭
    const oddsTabs = document.querySelectorAll('.tab-link-odds');
    const oddsContents = document.querySelectorAll('.tab-odds-content');

    oddsTabs.forEach(subTab => {
        subTab.addEventListener('click', function (event) {
            event.preventDefault();

            oddsTabs.forEach(item => item.classList.remove('active'));
            oddsContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });

    // 라인업 탭
    const lineupTabs = document.querySelectorAll('.tab-link-lineup');
    const lineupContents = document.querySelectorAll('.tab-lineup-content');

    lineupTabs.forEach(subTab => {
        subTab.addEventListener('click', function (event) {
            event.preventDefault();

            lineupTabs.forEach(item => item.classList.remove('active'));
            lineupContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });

    // 기록 탭
    const recordTabs = document.querySelectorAll('.tab-link-record');
    const recordContents = document.querySelectorAll('.tab-record-content');

    recordTabs.forEach(subTab => {
        subTab.addEventListener('click', function (event) {
            event.preventDefault();

            recordTabs.forEach(item => item.classList.remove('active'));
            recordContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });



});
