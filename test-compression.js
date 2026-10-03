const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const crypto = require('crypto');

(async () => {
  try {
    const text = 'A'.repeat(1024 * 1024); // 1 MB of 'A'
    fs.writeFileSync('test-compressible.txt', text);

    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'smoketest_1790997829174@test.com',
      password: 'password123'
    });
    const token = loginRes.data.token;

    const form = new FormData();
    form.append('file', fs.createReadStream('test-compressible.txt'));
    const uploadRes = await axios.post('http://localhost:5000/api/files/upload', form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
    });
    const fileId = uploadRes.data.data._id;
    console.log('Uploaded. File ID:', fileId);
    
    const downloadRes = await axios.get(`http://localhost:5000/api/files/${fileId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });
    
    const downloadedText = downloadRes.data.toString();
    console.log('Downloaded length:', downloadedText.length);
    if (downloadedText === text) {
      console.log('Matches!');
    } else {
      console.log('Mismatch!');
      console.log('First 50 chars:', downloadedText.substring(0, 50));
    }
  } catch (err) {
    console.error(err.response ? err.response.data : err);
  }
})();
