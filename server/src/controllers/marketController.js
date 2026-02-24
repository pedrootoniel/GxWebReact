const Market = require('../models/market');
const Shop = require('../models/shop');
const Account = require('../models/account');

const MarketController = {
  async getItems(req, res, next) {
    try {
      const server = req.query.server || '';
      const page = parseInt(req.query.page) || 1;
      const perPage = Math.min(parseInt(req.query.limit) || 20, 50);
      const filters = {
        category: req.query.category,
        search: req.query.search,
        minLevel: req.query.minLevel ? parseInt(req.query.minLevel) : undefined,
        hasLuck: req.query.hasLuck === '1',
        hasSkill: req.query.hasSkill === '1',
        hasExcellent: req.query.hasExcellent === '1',
      };

      const [items, total] = await Promise.all([
        Market.getMarketItems(server, page, perPage, filters),
        Market.getMarketItemCount(server, filters),
      ]);

      res.json({ items, total, page, perPage });
    } catch (err) {
      next(err);
    }
  },

  async getItemDetail(req, res, next) {
    try {
      const server = req.query.server || '';
      const item = await Market.getMarketItemById(req.params.id, server);
      if (!item) return res.status(404).json({ error: 'Item not found or expired' });
      res.json({ item });
    } catch (err) {
      next(err);
    }
  },

  async buyItem(req, res, next) {
    try {
      const { itemId, server } = req.body;
      const username = req.user.username;

      const isOnline = await Account.isOnline(username);
      if (isOnline) {
        return res.status(400).json({ error: 'You must be offline to buy from market.' });
      }

      const item = await Market.getMarketItemById(itemId, server || '');
      if (!item) return res.status(404).json({ error: 'Item not found or expired' });

      if (item.seller === username) {
        return res.status(400).json({ error: 'You cannot buy your own item.' });
      }

      if (item.sold) {
        return res.status(400).json({ error: 'Item already sold.' });
      }

      const credits = await Shop.getCredits(username);
      const totalPrice = item.price;

      if (item.price_type === 1 && credits.credits < totalPrice) {
        return res.status(400).json({ error: 'Not enough credits.' });
      }
      if (item.price_type === 2 && credits.credits2 < totalPrice) {
        return res.status(400).json({ error: 'Not enough gold credits.' });
      }

      await Shop.deductCredits(username, totalPrice, item.price_type);
      await Market.markAsSold(itemId);
      await Market.logMarketPurchase(
        item.seller, username, item.price, item.price_type,
        item.add_date, item.active_till, item.item_name, item.cat, item.char, item.server
      );

      res.json({ message: 'Item purchased successfully!' });
    } catch (err) {
      next(err);
    }
  },

  async removeItem(req, res, next) {
    try {
      const server = req.query.server || '';
      const item = await Market.getMarketItemById(req.params.id, server);
      if (!item) return res.status(404).json({ error: 'Item not found' });

      if (item.seller !== req.user.username) {
        return res.status(403).json({ error: 'You can only remove your own listings.' });
      }

      await Market.markAsRemoved(req.params.id);
      res.json({ message: 'Item removed from market.' });
    } catch (err) {
      next(err);
    }
  },

  async getMyListings(req, res, next) {
    try {
      const server = req.query.server || '';
      const items = await Market.getMyListings(req.user.username, server);
      res.json({ items });
    } catch (err) {
      next(err);
    }
  },

  async getPurchaseHistory(req, res, next) {
    try {
      const server = req.query.server || '';
      const history = await Market.getPurchaseHistory(req.user.username, server);
      res.json({ history });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = MarketController;
