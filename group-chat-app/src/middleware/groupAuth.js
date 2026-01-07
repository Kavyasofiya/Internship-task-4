const GroupMember = require('../models/GroupMember');

const isGroupMember = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const member = await GroupMember.findOne({
      group: groupId,
      user: userId
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    req.groupMember = member;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const isGroupAdmin = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const member = await GroupMember.findOne({
      group: groupId,
      user: userId,
      role: 'admin'
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.groupMember = member;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const canSendMessage = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const member = await GroupMember.findOne({
      group: groupId,
      user: userId
    }).populate('group');

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Check if group is admin-only and user is not admin
    if (member.group.isAdminOnly && member.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send messages in this group'
      });
    }

    // Check if member is muted
    if (member.isMuted && member.muteUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: 'You are muted in this group'
      });
    }

    req.groupMember = member;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = { isGroupMember, isGroupAdmin, canSendMessage };