const https = require('https');
const fs = require('fs');
https.get('https://drive.google.com/uc?export=download&id=1dGo1hDouUsBn3CLQsB5cz-Ji40wzxgAI', (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    https.get(res.headers.location, (res2) => {
      res2.pipe(fs.createWriteStream('public/alwin.jpg'));
    });
  } else {
    res.pipe(fs.createWriteStream('public/alwin.jpg'));
  }
});
