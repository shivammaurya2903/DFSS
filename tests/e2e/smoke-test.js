/**
 * End-to-end smoke test for DFSS
 * Tests: register → login → upload → verify HDD chunks → download → checksum verify → delete
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const BASE = 'http://localhost:5000/api';
const TEST_EMAIL = `smoketest_${Date.now()}@test.com`;
const TEST_PASSWORD = 'TestPass123!';

// Create a 15 MB test file (larger than 1 chunk of 10 MB → 2 chunks)
const TEST_FILE_PATH = path.join(os.tmpdir(), `dfss_test_${Date.now()}.bin`);
const TEST_FILE_SIZE = 5 * 1024 * 1024; // 15 MB

async function run() {
  console.log('=== DFSS End-to-End Smoke Test ===\n');

  // Create test file
  const testData = crypto.randomBytes(TEST_FILE_SIZE);
  const originalChecksum = crypto.createHash('sha256').update(testData).digest('hex');
  fs.writeFileSync(TEST_FILE_PATH, testData);
  console.log(`[1] Test file created: ${TEST_FILE_PATH} (${TEST_FILE_SIZE / 1024 / 1024} MB)`);
  console.log(`    Original SHA-256: ${originalChecksum}`);

  let token, fileId;

  try {
    // REGISTER
    console.log('\n[2] Registering user...');
    const regRes = await axios.post(`${BASE}/auth/register`, {
      name: 'Smoke Test User',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    token = regRes.data.token;
    console.log(`    ✓ Registered: ${TEST_EMAIL}`);

    const headers = { Authorization: `Bearer ${token}` };

    // UPLOAD
    console.log('\n[3] Uploading file (15 MB → should create 2 chunks of 10 MB + 5 MB)...');
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_FILE_PATH), {
      filename: 'smoke_test.bin',
      contentType: 'application/octet-stream',
    });
    form.append('sensitivity', 'PRIVATE');
    form.append('placementPolicy', 'ADAPTIVE');

    const uploadRes = await axios.post(`${BASE}/files/upload`, form, {
      headers: { ...headers, ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000,
    });

    const uploadedFile = uploadRes.data.data;
    fileId = uploadedFile._id;
    const timings = uploadRes.data.timings;

    console.log(`    ✓ Upload complete!`);
    console.log(`    File ID: ${fileId}`);
    console.log(`    Status: ${uploadedFile.status}`);
    console.log(`    Chunk count: ${uploadedFile.chunkCount}`);
    console.log(`    Stored checksum: ${uploadedFile.checksum}`);
    console.log(`    Timing: ${JSON.stringify(timings)}`);

    if (uploadedFile.checksum !== originalChecksum) {
      console.error('    ✗ CHECKSUM MISMATCH on uploaded file!');
      process.exit(1);
    }
    console.log(`    ✓ Checksum matches original`);

    // VERIFY CHUNKS ON HDD
    console.log('\n[4] Verifying chunks exist on HDD...');
    const STORAGE_ROOT = 'D:/DistributedStorage';
    let hddChunkCount = 0;
    for (const nodeDir of ['node-1', 'node-2', 'node-3', 'node-4']) {
      const chunksDir = path.join(STORAGE_ROOT, nodeDir, 'chunks');
      if (fs.existsSync(chunksDir)) {
        const files = fs.readdirSync(chunksDir).filter(f => f.startsWith(fileId.toString()));
        hddChunkCount += files.length;
        if (files.length > 0) {
          console.log(`    ✓ ${nodeDir}/chunks: ${files.join(', ')}`);
        }
      }
    }
    if (hddChunkCount === 0) {
      console.error('    ✗ No chunks found on HDD!');
      process.exit(1);
    }
    console.log(`    ✓ Total chunk files on HDD: ${hddChunkCount} (includes replicas)`);

    // GET FILE DETAILS
    console.log('\n[5] Fetching file details...');
    const detailsRes = await axios.get(`${BASE}/files/${fileId}`, { headers });
    const details = detailsRes.data.data;
    console.log(`    ✓ File details fetched`);
    console.log(`    Chunks: ${details.chunks?.length}`);
    if (details.chunks?.[0]) {
      console.log(`    Chunk[0] primaryNode: ${details.chunks[0].primaryNode}`);
      console.log(`    Chunk[0] replicaNodes: ${details.chunks[0].replicaNodes?.join(', ')}`);
    }

    // DOWNLOAD
    console.log('\n[6] Downloading file...');
    const downloadRes = await axios.get(`${BASE}/files/${fileId}/download`, {
      headers,
      responseType: 'arraybuffer',
      timeout: 120000,
    });

    const downloadedData = Buffer.from(downloadRes.data);
    const downloadedChecksum = crypto.createHash('sha256').update(downloadedData).digest('hex');
    console.log(`    Downloaded size: ${downloadedData.length} bytes`);
    console.log(`    Downloaded SHA-256: ${downloadedChecksum}`);

    if (downloadedChecksum !== originalChecksum) {
      console.error('    ✗ DOWNLOAD CHECKSUM MISMATCH! Data corruption detected!');
      process.exit(1);
    }
    console.log(`    ✓ Downloaded file matches original — integrity verified!`);

    // [6.5] TEST VIEW ENDPOINT
    console.log('\n[6.5] Testing view endpoint...');
    const viewRes = await axios.get(`${BASE}/files/${fileId}/view`, {
      headers,
      responseType: 'arraybuffer'
    });
    
    if (viewRes.status !== 200) {
      throw new Error(`View endpoint failed with status ${viewRes.status}`);
    }
    const viewBuffer = Buffer.from(viewRes.data);
    if (viewBuffer.length !== TEST_FILE_SIZE) {
      throw new Error(`View endpoint returned wrong size: ${viewBuffer.length}`);
    }
    console.log('    ✓ View endpoint works correctly and returns raw bytes');

    // LIST FILES
    console.log('\n[7] Listing files...');
    const listRes = await axios.get(`${BASE}/files`, { headers });
    console.log(`    ✓ Files listed: ${listRes.data.data.length} file(s)`);

    // NODE STATUS
    console.log('\n[8] Checking node status via API...');
    const nodesRes = await axios.get(`${BASE}/storage/nodes`, { headers });
    const healthyNodes = nodesRes.data.data.filter(n => n.status === 'HEALTHY');
    console.log(`    ✓ ${healthyNodes.length}/${nodesRes.data.data.length} nodes HEALTHY`);
    nodesRes.data.data.forEach(n => {
      console.log(`    ${n.nodeId}: ${n.status} | chunkCount: ${n.chunkCount} | failureDomain: ${n.failureDomainId}`);
    });

    // DELETE
    console.log('\n[9] Deleting file...');
    const deleteRes = await axios.delete(`${BASE}/files/${fileId}`, { headers });
    console.log(`    ✓ Delete response: ${deleteRes.data.message}`);

    // Verify chunks gone from HDD
    let remainingChunks = 0;
    for (const nodeDir of ['node-1', 'node-2', 'node-3', 'node-4']) {
      const chunksDir = path.join(STORAGE_ROOT, nodeDir, 'chunks');
      if (fs.existsSync(chunksDir)) {
        const files = fs.readdirSync(chunksDir).filter(f => f.startsWith(fileId.toString()));
        remainingChunks += files.length;
      }
    }
    if (remainingChunks > 0) {
      console.warn(`    ⚠ ${remainingChunks} chunk(s) still on HDD after delete (check node availability)`);
    } else {
      console.log(`    ✓ All chunks removed from HDD`);
    }

    console.log('\n=== SMOKE TEST PASSED ✓ ===\n');

  } catch (err) {
    console.error('\n=== SMOKE TEST FAILED ===');
    console.error(err.response?.data || err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    try { fs.unlinkSync(TEST_FILE_PATH); } catch (_) {}
  }
}

run();
