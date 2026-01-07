const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { isGroupMember, isGroupAdmin } = require('../middleware/groupAuth');
const { body, validationResult } = require('express-validator');

// Create a group
router.post('/create', auth, [
  body('name').notEmpty().withMessage('Group name is required'),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, isAdminOnly } = req.body;

    // Create group
    const group = new Group({
      name,
      description,
      creator: req.user._id,
      isAdminOnly: isAdminOnly || false
    });
    await group.save();

    // Add creator as admin
    const groupMember = new GroupMember({
      group: group._id,
      user: req.user._id,
      role: 'admin'
    });
    await groupMember.save();

    res.status(201).json({
      success: true,
      group,
      message: 'Group created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all groups for user
router.get('/my-groups', auth, async (req, res) => {
  try {
    const groups = await GroupMember.find({ user: req.user._id })
      .populate('group', 'name description isAdminOnly profilePicture')
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get group details
router.get('/:groupId', auth, isGroupMember, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('creator', 'username email');

    const members = await GroupMember.find({ group: req.params.groupId })
      .populate('user', 'username email profilePicture isOnline lastSeen')
      .sort({ role: -1, joinedAt: 1 });

    res.json({
      success: true,
      group,
      members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add member to group
router.post('/:groupId/add-member', auth, isGroupAdmin, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('role').optional().isIn(['admin', 'member'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, role = 'member' } = req.body;
    const groupId = req.params.groupId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already a member
    const existingMember = await GroupMember.findOne({
      group: groupId,
      user: userId
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this group'
      });
    }

    // Add member
    const groupMember = new GroupMember({
      group: groupId,
      user: userId,
      role
    });
    await groupMember.save();

    res.json({
      success: true,
      message: 'Member added successfully',
      member: groupMember
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Remove member from group
router.delete('/:groupId/remove-member/:userId', auth, isGroupAdmin, async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    // Can't remove yourself if you're the only admin
    if (userId === req.user._id.toString()) {
      const adminCount = await GroupMember.countDocuments({
        group: groupId,
        role: 'admin'
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the only admin. Assign another admin first.'
        });
      }
    }

    // Remove member
    const result = await GroupMember.findOneAndDelete({
      group: groupId,
      user: userId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update member role
router.put('/:groupId/update-role/:userId', auth, isGroupAdmin, [
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groupId, userId } = req.params;
    const { role } = req.body;

    // Prevent demoting the only admin
    if (role === 'member') {
      const adminCount = await GroupMember.countDocuments({
        group: groupId,
        role: 'admin'
      });

      const targetUser = await GroupMember.findOne({
        group: groupId,
        user: userId,
        role: 'admin'
      });

      if (targetUser && adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the only admin. Assign another admin first.'
        });
      }
    }

    // Update role
    const member = await GroupMember.findOneAndUpdate(
      { group: groupId, user: userId },
      { role },
      { new: true }
    ).populate('user', 'username email');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Role updated successfully',
      member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Toggle admin-only mode
router.put('/:groupId/toggle-admin-only', auth, isGroupAdmin, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    
    group.isAdminOnly = !group.isAdminOnly;
    await group.save();

    res.json({
      success: true,
      message: `Admin-only mode ${group.isAdminOnly ? 'enabled' : 'disabled'}`,
      isAdminOnly: group.isAdminOnly
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Leave group
router.delete('/:groupId/leave', auth, isGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if user is the last admin
    if (req.groupMember.role === 'admin') {
      const adminCount = await GroupMember.countDocuments({
        group: groupId,
        role: 'admin'
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot leave as the only admin. Assign another admin first.'
        });
      }
    }

    // Remove from group
    await GroupMember.findOneAndDelete({
      group: groupId,
      user: userId
    });

    res.json({
      success: true,
      message: 'Left group successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mute/unmute member
router.put('/:groupId/mute/:userId', auth, isGroupAdmin, [
  body('minutes').optional().isInt({ min: 1, max: 10080 }) // Max 7 days in minutes
], async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { minutes } = req.body;

    const update = { isMuted: true };
    
    if (minutes) {
      update.muteUntil = new Date(Date.now() + minutes * 60000);
    } else {
      // Permanent mute (until unmuted)
      update.muteUntil = null;
    }

    const member = await GroupMember.findOneAndUpdate(
      { group: groupId, user: userId },
      update,
      { new: true }
    ).populate('user', 'username email');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Member muted successfully',
      member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Unmute member
router.put('/:groupId/unmute/:userId', auth, isGroupAdmin, async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const member = await GroupMember.findOneAndUpdate(
      { group: groupId, user: userId },
      { isMuted: false, muteUntil: null },
      { new: true }
    ).populate('user', 'username email');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Member unmuted successfully',
      member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;