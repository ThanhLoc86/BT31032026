const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Người gửi
  from: {
    type: String,
    required: true,  
  },
  
  // Người nhận
  to: {
    type: String,
    required: true,
  },
  
  
  messageContent: {
    type: {
      type: String,
      enum: ['text', 'file'], 
      required: true,
    },
    text: {
      type: String,
      required: true,
    }
  },

  createdAt: {
    type: Date,
    default: () => new Date(),
    index: true 
  }
});

messageSchema.index({ from: 1, to: 1 });
messageSchema.index({ to: 1, from: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
