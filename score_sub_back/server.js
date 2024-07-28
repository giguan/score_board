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

  const apiUrl = 'https://24live.com/api/match-list-data/19?lang=ko&type=all&subtournamentIds=121,78701,44034,45,12536,12535&sort=alpha&short=0&from=2024-07-27%2017:00:00&to=2024-07-28%2016:59:59';
  
  try {
    const response = await axios.get(apiUrl);
    const matchList = response.data;

    // for (const match of matchList) {
    //   match.participants.forEach((item) => {
    //     console.log(item)
    //     try {
    //       const imageResponse = axios.get(`https://24live.com${item.image}`, { responseType: 'arraybuffer' });
          
    //       console.log("@@@@@@@@@@",imageResponse)
    //       item.imageResponse = `data:image/jpeg;base64,${Buffer.from(imageResponse.data).toString('base64')}`;

    //     } catch (imageError) {
    //       console.error(`Error fetching image for match ${item.name}:`, imageError.message);
    //       item.imageData = null; // 이미지 로드 실패 시 null로 설정

    //     }

    //   })
    // }

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
