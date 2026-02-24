const Shop = require('../models/shop');
const Account = require('../models/account');

const ShopController = {
  async getItems(req, res, next) {
    try {
      const items = await Shop.getShopItems();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  },

  async getItemDetail(req, res, next) {
    try {
      const item = await Shop.getShopItemById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Item not found' });

      let harmony = [];
      let sockets = [];

      if (item.use_harmony) {
        harmony = await Shop.getHarmonyOptions(item.exetype, 1);
      }
      if (item.use_sockets) {
        sockets = await Shop.getSocketOptions(item.exetype);
      }

      res.json({ item, harmony, sockets });
    } catch (err) {
      next(err);
    }
  },

  async getCredits(req, res, next) {
    try {
      const credits = await Shop.getCredits(req.user.username);
      res.json(credits);
    } catch (err) {
      next(err);
    }
  },

  async purchaseItem(req, res, next) {
    try {
      const { itemId, options } = req.body;
      const username = req.user.username;

      const isOnline = await Account.isOnline(username);
      if (isOnline) {
        return res.status(400).json({ error: 'You must be offline to purchase items.' });
      }

      const item = await Shop.getShopItemById(itemId);
      if (!item) return res.status(404).json({ error: 'Item not found' });

      const totalPrice = item.price;
      const credits = await Shop.getCredits(username);
      const paymentType = item.payment_type || 1;

      if (paymentType === 1 && credits.credits < totalPrice) {
        return res.status(400).json({ error: 'Not enough credits.' });
      }
      if (paymentType === 2 && credits.credits2 < totalPrice) {
        return res.status(400).json({ error: 'Not enough gold credits.' });
      }

      await Shop.deductCredits(username, totalPrice, paymentType);
      await Shop.updateTotalBought(item.item_id, item.original_item_cat);

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      await Shop.logPurchase(username, '', item.name, totalPrice, paymentType === 1 ? 'Credits' : 'Gold Credits', ip);

      res.json({ message: 'Item purchased successfully!' });
    } catch (err) {
      next(err);
    }
  },

  async getCart(req, res, next) {
    try {
      const items = await Shop.getCartItems(req.user.username, 1, '');
      res.json({ items });
    } catch (err) {
      next(err);
    }
  },

  async addToCart(req, res, next) {
    try {
      const { itemHex, price, priceType, server } = req.body;
      await Shop.addToCart(req.user.username, itemHex, price, priceType, server || '');
      res.json({ message: 'Added to cart' });
    } catch (err) {
      next(err);
    }
  },

  async removeFromCart(req, res, next) {
    try {
      await Shop.removeFromCart(req.user.username, req.params.id, '');
      res.json({ message: 'Removed from cart' });
    } catch (err) {
      next(err);
    }
  },

  async getPurchaseHistory(req, res, next) {
    try {
      const { getPool, getWebDb } = require('../config/database');
      const pool = await getPool(getWebDb());
      const result = await pool.request()
        .input('user', req.user.username)
        .query(`
          SELECT TOP 50 memb___id, server, item_hex, date, price, price_type
          FROM DmN_Shop_Logs
          WHERE memb___id = @user
          ORDER BY date DESC
        `);
      res.json({ history: result.recordset });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ShopController;
