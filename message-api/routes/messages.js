const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const path = require('path');

const isValidFilePath = (filePath) => {
  const baseDir = '/uploads/';  // Thư mục được phép
  
  // Normalize path nhưng giữ nguyên dạng forward slash
  const normalized = filePath.replace(/\\/g, '/');
  
  // Kiểm tra: phải bắt đầu bằng /uploads/ và không có ../
  return normalized.startsWith(baseDir) && !normalized.includes('..');
};

// Lấy toàn bộ tin nhắn giữa user hiện tại và userID
router.get('/:userID', async (req, res) => {
  try {
    
    const currentUser = req.user.id;
    
    const targetUser = req.params.userID;
    
    if (!targetUser) {
      return res.status(400).json({ 
        error: 'Cần nhập userID trong URL' 
      });
    }
    
    // Kiểm tra không tìm kiếm chính mình
    if (targetUser === currentUser) {
      return res.status(400).json({ 
        error: 'Không thể xem tin nhắn với chính mình' 
      });
    }
    
 
    // Tìm tin nhắn giữa 2 user, sắp xếp theo thời gian tạo
    const messages = await Message.find({
      $or: [
        { from: currentUser, to: targetUser },
        { from: targetUser, to: currentUser }
      ]
    })
    .sort({ createdAt: 1 });  // Sắp xếp từ cũ đến mới
    
    res.json({
      count: messages.length,
      currentUser: currentUser,
      targetUser: targetUser,
      data: messages
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /messages
// Tạo tin nhắn mới
router.post('/', async (req, res) => {
  try {
    // Lấy data từ body request
    const { to, messageContent } = req.body;
    
    // Lấy user hiện tại từ middleware auth
    const from = req.user.id;
    
    if (!to) {
      return res.status(400).json({ 
        error: 'Thiếu trường: to (userID người nhận)' 
      });
    }
    
    if (!messageContent) {
      return res.status(400).json({ 
        error: 'Thiếu trường: messageContent' 
      });
    }
    
    if (!messageContent.type) {
      return res.status(400).json({ 
        error: 'messageContent.type không được rỗng' 
      });
    }
    
    if (!messageContent.text) {
      return res.status(400).json({ 
        error: 'messageContent.text không được rỗng' 
      });
    }
    
    if (!['text', 'file'].includes(messageContent.type)) {
      return res.status(400).json({ 
        error: 'type phải là "text" hoặc "file"' 
      });
    }
    
    //  Không được gửi cho chính mình
    if (from === to) {
      return res.status(400).json({ 
        error: 'Không thể gửi tin nhắn cho chính mình' 
      });
    }
    
    // Nếu loại là file, phải kiểm tra path
    if (messageContent.type === 'file') {
      if (!isValidFilePath(messageContent.text)) {
        return res.status(400).json({ 
          error: 'Đường dẫn file không hợp lệ. Phải bắt đầu bằng /uploads/' 
        });
      }
    }
    
    // TẠO MESSAGE 
    const message = new Message({
      from,
      to,
      messageContent,
      createdAt: new Date()
    });

    await message.save();
    
  
    res.status(201).json({
      success: true,
      message: 'Tin nhắn đã được gửi',
      data: message
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  GET /messages 
// Lấy tin nhắn cuối cùng của mỗi conversation
router.get('/', async (req, res) => {
  try {
    const currentUser = req.user.id;
    
   // Tìm tất cả messages của user hiện tại (cả sender và receiver)
    const allMessages = await Message.find({
      $or: [
        { from: currentUser },  // Tin user gửi
        { to: currentUser }     // Tin gửi cho user
      ]
    })
    .sort({ createdAt: -1 });  // Mới nhất trước
    
   
    // Map có key là "user1-user2" (normalized), value là {otherUser, lastMessage}
    const conversationMap = new Map();
    
    allMessages.forEach(msg => {
      // Xác định người khác (không phải currentUser)
      const otherUser = msg.from === currentUser ? msg.to : msg.from;
      
      // Tạo conversation key (normalize để tránh duplicate)
      const key = [currentUser, otherUser].sort().join('-');
      
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          otherUser,
          lastMessage: msg.messageContent.text,
          lastMessageType: msg.messageContent.type,
          lastMessageFrom: msg.from,
          lastMessageTime: msg.createdAt
        });
      }
    });

    // Convert Map thành Array và sắp xếp lại theo thời gian
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    
    res.json({
      count: conversations.length,
      currentUser: currentUser,
      data: conversations
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
