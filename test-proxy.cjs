async function test() {
  const url = 'https://drive.google.com/thumbnail?id=1dGo1hDouUsBn3CLQsB5cz-Ji40wzxgAI&sz=w1000';
  const res = await fetch(url);
  console.log('Status', res.status);
  console.log('CORS', res.headers.get('access-control-allow-origin'));
}
test();
