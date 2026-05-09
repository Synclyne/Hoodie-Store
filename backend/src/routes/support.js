const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const SupportMessage = require('../models/SupportMessage');
const { protect, adminOnly, requirePermission } = require('../middleware/auth');
const { sendSupportReply } = require('../utils/email');

const clean = (value) => String(value || '').trim();

const publicTicket = (ticket) => ({
  _id: ticket._id,
  name: ticket.name,
  email: ticket.email,
  phone: ticket.phone,
  orderNumber: ticket.orderNumber,
  subject: ticket.subject,
  status: ticket.status,
  thread: ticket.thread,
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
});

router.post('/', async (req, res) => {
  const payload = {
    name: clean(req.body.name),
    email: clean(req.body.email).toLowerCase(),
    phone: clean(req.body.phone),
    orderNumber: clean(req.body.orderNumber),
    subject: clean(req.body.subject),
    message: clean(req.body.message),
  };

  if (!payload.name || !payload.email || !payload.subject || !payload.message) {
    return res.status(400).json({ error: 'Name, email, subject, and message are required.' });
  }

  const message = await SupportMessage.create({
    ...payload,
    accessToken: crypto.randomBytes(24).toString('hex'),
    lastCustomerReplyAt: new Date(),
    thread: [{
      author: 'customer',
      body: payload.message,
      sentBy: payload.email,
      createdAt: new Date(),
    }],
  });
  res.status(201).json({
    message: 'Support message received.',
    ticket: {
      id: message._id,
      accessToken: message.accessToken,
      status: message.status,
      createdAt: message.createdAt,
    },
  });
});

router.get('/ticket/:id', async (req, res) => {
  const token = clean(req.query.token);
  const ticket = await SupportMessage.findOne({ _id: req.params.id, accessToken: token });
  if (!ticket) return res.status(404).json({ error: 'Support ticket not found.' });
  res.json({ ticket: publicTicket(ticket) });
});

router.post('/ticket/:id/replies', async (req, res) => {
  const token = clean(req.body.token || req.query.token);
  const body = clean(req.body.message);
  if (!body) return res.status(400).json({ error: 'Message is required.' });

  const ticket = await SupportMessage.findOne({ _id: req.params.id, accessToken: token });
  if (!ticket) return res.status(404).json({ error: 'Support ticket not found.' });
  if (ticket.status === 'closed') {
    return res.status(403).json({ error: 'This support chat has been closed.' });
  }

  ticket.thread.push({
    author: 'customer',
    body,
    sentBy: ticket.email,
    createdAt: new Date(),
  });
  if (ticket.status === 'resolved') ticket.status = 'open';
  ticket.lastCustomerReplyAt = new Date();
  await ticket.save();

  res.status(201).json({ ticket: publicTicket(ticket) });
});

router.get('/admin', protect, adminOnly, requirePermission('support'), async (req, res) => {
  const status = clean(req.query.status);
  const query = status && status !== 'all' ? { status } : {};
  const messages = await SupportMessage.find(query).sort({ createdAt: -1 }).limit(200);
  const counts = await SupportMessage.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  res.json({ messages, counts });
});

router.patch('/admin/:id', protect, adminOnly, requirePermission('support'), async (req, res) => {
  const update = {};
  if (req.body.status) {
    update.status = req.body.status;
    update.resolvedAt = ['resolved', 'closed'].includes(req.body.status) ? new Date() : null;
  }
  if (req.body.adminNote !== undefined) update.adminNote = clean(req.body.adminNote);

  const message = await SupportMessage.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!message) return res.status(404).json({ error: 'Support message not found.' });
  res.json({ message });
});

router.post('/admin/:id/replies', protect, adminOnly, requirePermission('support'), async (req, res) => {
  const body = clean(req.body.message);
  const shouldEmail = req.body.emailCustomer !== false;
  if (!body) return res.status(400).json({ error: 'Reply message is required.' });

  const ticket = await SupportMessage.findById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Support message not found.' });

  let emailResult = { sent: false, skipped: true };
  if (shouldEmail) {
    try {
      emailResult = await sendSupportReply(ticket, body);
    } catch (err) {
      console.error('Support reply email failed:', err.message);
      emailResult = { sent: false, error: 'Email could not be sent, but the reply was saved.' };
    }
  }

  ticket.thread.push({
    author: 'admin',
    body,
    sentBy: req.user.email || 'admin',
    emailed: !!emailResult.sent,
    createdAt: new Date(),
  });
  ticket.status = req.body.status || (ticket.status === 'new' ? 'open' : ticket.status);
  ticket.lastAdminReplyAt = new Date();
  await ticket.save();

  res.status(201).json({ message: ticket, email: emailResult });
});

router.delete('/admin/:id', protect, adminOnly, requirePermission('support'), async (req, res) => {
  const message = await SupportMessage.findByIdAndDelete(req.params.id);
  if (!message) return res.status(404).json({ error: 'Support message not found.' });
  res.json({ message: 'Support message deleted.' });
});

module.exports = router;
