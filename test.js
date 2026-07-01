async function test() {
  const res = await fetch('http://localhost:3000/api/groq-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl: 'http://example.com/image.jpg' })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text.substring(0, 100));
}

test();
