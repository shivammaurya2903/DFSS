const File = require('../models/File');
const Chunk = require('../models/Chunk');
const CryptoJS = require('crypto-js');
const axios = require('axios');
const { PlacementStrategy } = require('./storageController');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key';

const getFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user.id });
    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getShared = async (req, res) => res.json({ success: true, data: [] });
const getFavorites = async (req, res) => res.json({ success: true, data: [] });
const getRecent = async (req, res) => res.json({ success: true, data: [] });
const getExpired = async (req, res) => res.json({ success: true, data: [] });

const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });
    
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    const fileBuffer = req.file.buffer;
    const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);
    
    const fileDoc = new File({
      filename: req.body.filename || req.file.originalname,
      originalName: req.file.originalname,
      owner: req.user.id,
      size: req.file.size,
      mimeType: req.file.mimetype,
      status: 'UPLOADING'
    });
    
    await fileDoc.save();
    
    const chunkDocs = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkData = fileBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const encryptedData = CryptoJS.AES.encrypt(chunkData.toString('base64'), ENCRYPTION_KEY).toString();
      
      const checksum = CryptoJS.SHA256(encryptedData).toString();
      
      const targetNodes = await PlacementStrategy.getTargets('Adaptive', encryptedData.length, 2);
      
      // Upload to target nodes
      for (const node of targetNodes) {
        await axios.post(`${node.url}/upload`, {
          chunkId: `${fileDoc._id}_${i}`,
          data: encryptedData,
          checksum
        });
      }
      
      const chunkDoc = new Chunk({
        fileId: fileDoc._id,
        sequenceNumber: i,
        size: chunkData.length,
        checksum,
        primaryNode: targetNodes[0].nodeId,
        replicaNodes: targetNodes.slice(1).map(n => n.nodeId)
      });
      
      await chunkDoc.save();
      chunkDocs.push(chunkDoc._id);
    }
    
    fileDoc.chunks = chunkDocs;
    fileDoc.status = 'READY';
    await fileDoc.save();
    
    res.json({ success: true, data: fileDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFileDetails = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, owner: req.user.id }).populate('chunks');
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    res.json({ success: true, data: file });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, owner: req.user.id }).populate('chunks');
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    
    const chunks = file.chunks.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    let fileBuffer = Buffer.alloc(0);
    
    for (const chunk of chunks) {
      // For simplicity, mocking download from node. In real world, we'd fetch from node.url/download/:chunkId
      const targetNodeId = chunk.primaryNode; // Should look up node URL
      // Mock data fetching, here we just show logic.
      // const response = await axios.get(`${nodeUrl}/download/${file._id}_${chunk.sequenceNumber}`);
      // const decryptedData = CryptoJS.AES.decrypt(response.data.data, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      // fileBuffer = Buffer.concat([fileBuffer, Buffer.from(decryptedData, 'base64')]);
    }
    
    res.setHeader('Content-disposition', `attachment; filename=${file.originalName}`);
    res.setHeader('Content-type', file.mimeType);
    res.send(fileBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, owner: req.user.id }).populate('chunks');
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    
    for (const chunk of file.chunks) {
      // Mock delete request to storage nodes
      // await axios.delete(`${nodeUrl}/delete/${file._id}_${chunk.sequenceNumber}`);
      await Chunk.findByIdAndDelete(chunk._id);
    }
    
    await File.findByIdAndDelete(file._id);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getFiles,
  getShared,
  getFavorites,
  getRecent,
  getExpired,
  uploadFile,
  getFileDetails,
  downloadFile,
  deleteFile
};
