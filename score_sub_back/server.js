const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use(cors({
  origin: 'http://127.0.0.1:5500', // 여기에는 Live Server의 로컬 주소를 입력하세요
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'Content-Type', 'X-Auth-Token']
}));


// 프록시 요청 핸들러
app.get('/proxy/match-list', async (req, res, next) => {

  const {date} = req.query;

  const requestDate = new Date(date);

  // fromDate는 요청한 날짜의 자정 (00:00:00)
  const fromDate = new Date(requestDate);
  fromDate.setHours(0, 0, 0, 0);

  // toDate는 요청한 날짜의 마지막 시간 (23:59:59)
  const toDate = new Date(requestDate);
  toDate.setHours(23, 59, 59, 999);

  const from = fromDate.toISOString().replace('T', ' ').split('.')[0];
  const to = toDate.toISOString().replace('T', ' ').split('.')[0];

  const apiUrl = `https://24live.com/api/match-list-data/19?lang=ko&type=all&subtournamentIds=121,78701,44034,45,12536,12535&sort=alpha&short=0&from=${from}&to=${to}`;
  
  try {
    const response = await axios.get(apiUrl);
    const matchList = response.data;

    res.send(matchList);
  } catch (error) {
      next(error);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack); // 에러 스택을 콘솔에 출력
  res.status(500).json({ message: 'Internal Server Error', error: err.message }); // 클라이언트에 에러 메시지 전송
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
