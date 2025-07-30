// lib/indexnow.ts

const INDEXNOW_API = 'https://api.indexnow.org/indexnow';

export async function submitToIndexNow(urlList: []) {
  const key = process.env.INDEXNOW_KEY; // Use env variable
  const keyLocation = `https://${process.env.NEXT_PUBLIC_APP_URL}/${key}.txt`;

  const payload = {
    host: process.env.NEXT_PUBLIC_APP_URL,
    key,
    keyLocation,
    urlList
  };

  try {
    const res = await fetch(INDEXNOW_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error('IndexNow submission failed', res.status);
    } else {
      console.log('Submitted to IndexNow:', urlList);
    }
  } catch (err) {
    console.error('IndexNow error:', err);
  }
}
