const express = require('express');
const { body, validationResult } = require('express-validator');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const { sendNewsletterConfirmation } = require('../utils/email');

const router = express.Router();

router.post(
  '/subscribe',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const email = req.body.email;
    await NewsletterSubscriber.findOneAndUpdate(
      { email },
      { email, isActive: true, confirmedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    sendNewsletterConfirmation(email).catch(err => {
      console.error('Newsletter confirmation email failed:', err.message);
    });

    res.status(201).json({ message: 'Newsletter subscription confirmed.' });
  }
);

module.exports = router;
