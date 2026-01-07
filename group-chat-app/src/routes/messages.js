const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Group = require('../models/Group');
const { auth } = require('../middleware/auth');
const { canSendMessage, isGroupMember } = require('../middleware/groupAuth');
const { body, validationResult } = require('express-validator');

// Send message
router.post('/:groupId/send', auth, canSendMessage, [
  body('content').notEmpty().withMessage('Message content is required'),
  body('messageType').optional().isIn(['text', 'image', 'file', 'system'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groupId } = req.params;
    const { content, messageType = 'text', fileUrl, fileName } = req.body;

    // Create message
    const message = new Message({
      group: groupId,
      sender: req.user._id,
      content,
      messageType,
      fileUrl,
      fileName,
      readBy: [{
        user: req.user._id
      }]
    });

    await message.save();

    // Populate sender info for response
    await message.populate('sender', 'username email profilePicture');

    res.status(201).json({
      success: true,
      message,
      timestamp: message.createdAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get messages for a group
router.get('/:groupId/messages', auth, isGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50, before } = req.query;

    let query = { group: groupId, deleted: false };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username email profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mark message as read
router.post('/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is member of the group
    const isMember = await require('../models/GroupMember').findOne({
      group: message.group,
      user: req.user._id
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if already read
    const alreadyRead = message.readBy.some(
      read => read.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({ user: req.user._id });
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete message (admin or sender)
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)
      .populate('group');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is sender or group admin
    const isSender = message.sender.toString() === req.user._id.toString();
    
    const isAdmin = await require('../models/GroupMember').findOne({
      group: message.group._id,
      user: req.user._id,
      role: 'admin'
    });

    if (!isSender && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    // Soft delete
    message.deleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user._id;
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get unread message count for a group
router.get('/:groupId/unread-count', auth, isGroupMember, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      group: req.params.groupId,
      deleted: false,
      'readBy.user': { $ne: req.user._id }
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;