function adjustDate(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0]; // "YYYY-MM-DD" 형식으로 반환
}

const MAIN_URL = "https://fleco-api.champscore.com";
const SUB_URL = "https://sports-api.named.com";
const THUMB_URL = "https://thumb.champscore.com";

/** 
 * 현재 날짜 시간 yyyy-mm-dd로 받아온다.
 * 네임드 요청 URL 형식에 맞춤
 * return yyyy-mm-dd
 */
function getCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 1을 더해줍니다.
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * 게임 데이터 중 시간 포맷팅
 */
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getStatusText(status) {
    switch (status) {
        case 'IN_PROGRESS':
            return '진행중';
        case 'READY':
            return '시작전';
        case 'FINAL':
            return '종료';
        case 'CANCEL':
            return '취소';
        case 'POSTPONED':
            return '연기';
        case 'CUT':
            return '중단';
        default:
            return '알 수 없음';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'IN_PROGRESS':
            return 'in-progress';
        case 'READY':
            return 'ready';
        case 'FINAL':
            return 'finished';
        case 'CANCEL':
            return 'cancel';
        case 'POSTPONED':
            return 'postponed';
        case 'CUT':
            return 'cut'
        default:
            return '';
    }
}

function getFullCalendar() {
    // FullCalendar 초기화
    var calendarEl = document.getElementById('calendar');
    var showCalendarBtn = document.getElementById('show-calendar-btn');
    var closeCalendarBtn = document.getElementById('close-calendar-btn');
    var calendarContainer = document.getElementById('calendar-container');

    if (calendarEl) {
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: ''
            },
            height: 600,
            aspectRatio: 1.35,
            locale: 'ko',
            buttonText: {
                today: '오늘'
            },
            dateClick: (info) => {
                requestDate = info.dateStr;
                getGameData();
                calendarContainer.style.display = 'none';
            }
        });

        showCalendarBtn.addEventListener('click', function() {
            if (calendarContainer.style.display === 'none' || calendarContainer.style.display === '') {
                calendarContainer.style.display = 'block';
                calendar.render();
            } else {
                calendarContainer.style.display = 'none';
            }
        });

        closeCalendarBtn.addEventListener('click', function() {
            calendarContainer.style.display = 'none';
        });
    } else {
        console.error('캘린더 요소를 찾을 수 없습니다.');
    }

    
    // 날짜 변경 버튼 초기화
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const todayDayBtn = document.getElementById('today-day');

    if (prevDayBtn && nextDayBtn && todayDayBtn) {
        prevDayBtn.addEventListener('click', () => {
            requestDate = adjustDate(requestDate, -1);
            getGameData();
        });

        nextDayBtn.addEventListener('click', () => {
            requestDate = adjustDate(requestDate, +1);
            getGameData();
        });

        todayDayBtn.addEventListener('click', () => {
            requestDate = getCurrentDate();
            getGameData();
        });
    }
}