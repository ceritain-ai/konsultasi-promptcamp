const BASE_URL = 'http://localhost:3000';
let cookie = '';

async function run() {
  console.log('--- E2E TESTING START ---');

  console.log('\n[1/6] Testing Admin Login...');
  const loginForm = new URLSearchParams();
  loginForm.append('email', 'admhoscademy@mail.com');
  loginForm.append('password', 'hscdmy26');

  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    body: loginForm,
    redirect: 'manual'
  });

  const cookies = loginRes.headers.get('set-cookie');
  if (!cookies) throw new Error(`Failed login: ${loginRes.status}`);
  cookie = cookies.split(';')[0];
  console.log('Login successful!');

  console.log('\n[2/6] Testing Media Upload to R2...');
  const dummyFile = new Blob(['fake image binary content'], { type: 'image/png' });
  const uploadForm = new FormData();
  uploadForm.append('file', dummyFile, 'test-image.png');
  uploadForm.append('folder', 'test-posters');

  const uploadRes = await fetch(`${BASE_URL}/api/admin/upload`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: uploadForm
  });

  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  const uploadData = await uploadRes.json();
  const posterUrl = uploadData.url;
  console.log('Upload successful!');

  console.log('\n[3/6] Testing Create Event...');
  const eventSlug = 'e2e-test-slug';
  const eventForm = new FormData();
  eventForm.append('slug', eventSlug);
  eventForm.append('title', 'E2E Test Event Title');
  eventForm.append('description', '<strong>E2E Test</strong> description with rich text.');
  eventForm.append('poster_url', posterUrl);
  eventForm.append('bg_image_url', '');
  eventForm.append('bg_color', '#020617');
  eventForm.append('button_text', 'Ikuti Sekarang');
  eventForm.append('whatsapp_link', 'https://chat.whatsapp.com/dummy-group');
  eventForm.append('pixel_id', '1234567890123');

  const saveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: eventForm,
    redirect: 'manual'
  });

  if (![302, 303, 307].includes(saveRes.status)) {
    throw new Error(`Create failed: ${saveRes.status} ${await saveRes.text()}`);
  }
  console.log('Create successful!');

  console.log('\n[4/6] Testing Edit Event...');
  const editForm = new FormData();
  editForm.append('slug', eventSlug);
  editForm.append('title', 'E2E Test Event Title UPDATED');
  editForm.append('description', '<span style="color:#ff0000"><s>Updated rich text</s></span>');
  editForm.append('poster_url', posterUrl);
  editForm.append('bg_image_url', '');
  editForm.append('bg_color', '#111827');
  editForm.append('button_text', 'SAYA MAU BANGET');
  editForm.append('whatsapp_link', 'https://chat.whatsapp.com/dummy-group-updated');
  editForm.append('pixel_id', '999999999999');

  const editRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: editForm,
    redirect: 'manual'
  });

  if (![302, 303, 307].includes(editRes.status)) {
    throw new Error(`Edit failed: ${editRes.status} ${await editRes.text()}`);
  }

  const viewRes = await fetch(`${BASE_URL}/${eventSlug}`);
  const html = await viewRes.text();
  if (!html.includes('E2E Test Event Title UPDATED')) throw new Error('Updated title not rendered');
  if (!html.includes('999999999999')) throw new Error('Updated pixel not rendered');
  if (!html.includes('Updated rich text')) throw new Error('Updated rich text not rendered');
  if (!html.includes('SAYA MAU BANGET')) throw new Error('Updated button text not rendered');
  console.log('Edit successful!');

  console.log('\n[5/6] Testing Public Registration / Lead Submission...');
  const regRes = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: eventSlug,
      email: 'test-e2e-registrant@example.com',
      name: 'E2E Tester Name',
      phoneCode: '+62',
      phone: '899999999'
    })
  });

  if (!regRes.ok) throw new Error(`Registration failed: ${regRes.status} ${await regRes.text()}`);
  const regData = await regRes.json();
  if (regData.redirectUrl !== 'https://chat.whatsapp.com/dummy-group-updated') {
    throw new Error('Updated WhatsApp link not returned in registration');
  }
  console.log('Registration successful!');

  console.log('\n[6/6] Testing Event Deletion...');
  const delRes = await fetch(`${BASE_URL}/api/admin/events/${eventSlug}`, {
    method: 'DELETE',
    headers: { Cookie: cookie }
  });

  if (!delRes.ok) throw new Error(`Delete failed: ${delRes.status} ${await delRes.text()}`);
  console.log('Delete successful!');

  console.log('\n--- E2E TESTING COMPLETED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('\n❌ E2E TESTING FAILED:', err.message);
  process.exit(1);
});
