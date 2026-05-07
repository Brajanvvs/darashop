const express = require('express');
const { Config } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({});
    }
    res.json(config);
  } catch (error) {
    res.json({ nombre_tienda: 'Dara Maison', titulo_pagina: 'Dara Maison' });
  }
});

router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const config = await Config.findOne();
    if (config) {
      await config.update(req.body);
      res.json(config);
    } else {
      const nuevo = await Config.create(req.body);
      res.json(nuevo);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;