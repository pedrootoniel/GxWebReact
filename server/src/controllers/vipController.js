const Vip = require('../models/vip');
const Shop = require('../models/shop');

const VipController = {
  async getPackages(req, res, next) {
    try {
      const server = req.query.server || '';
      const packages = await Vip.getVipPackages(server);
      res.json({ packages });
    } catch (err) {
      next(err);
    }
  },

  async getMyVip(req, res, next) {
    try {
      const server = req.query.server || '';
      const vip = await Vip.getUserVip(req.user.username, server);
      if (!vip) return res.json({ vip: null });

      const pkg = await Vip.getVipPackageById(vip.viptype);
      res.json({ vip: { ...vip, package: pkg } });
    } catch (err) {
      next(err);
    }
  },

  async purchaseVip(req, res, next) {
    try {
      const { packageId, server } = req.body;
      const username = req.user.username;

      const pkg = await Vip.getVipPackageById(packageId);
      if (!pkg) return res.status(404).json({ error: 'VIP package not found' });

      const existingVip = await Vip.getUserVip(username, server || pkg.server);
      if (existingVip) {
        if (existingVip.viptype !== packageId) {
          const now = new Date();
          const expiry = new Date(existingVip.viptime);
          if (expiry > now) {
            return res.status(400).json({ error: 'You already have a different active VIP. Wait for it to expire.' });
          }
        }
      }

      const credits = await Shop.getCredits(username);
      if (pkg.payment_type === 1 && credits.credits < pkg.price) {
        return res.status(400).json({ error: 'Not enough credits.' });
      }
      if (pkg.payment_type === 2 && credits.credits2 < pkg.price) {
        return res.status(400).json({ error: 'Not enough gold credits.' });
      }

      await Shop.deductCredits(username, pkg.price, pkg.payment_type);

      const vipTimeMs = pkg.vip_time * 24 * 60 * 60 * 1000;
      let newVipTime;

      if (existingVip && existingVip.viptype === packageId && pkg.allow_extend) {
        const currentExpiry = new Date(existingVip.viptime).getTime();
        const base = currentExpiry > Date.now() ? currentExpiry : Date.now();
        newVipTime = new Date(base + vipTimeMs);
        await Vip.updateVip(username, server || pkg.server, packageId, newVipTime);
      } else if (existingVip) {
        newVipTime = new Date(Date.now() + vipTimeMs);
        await Vip.updateVip(username, server || pkg.server, packageId, newVipTime);
      } else {
        newVipTime = new Date(Date.now() + vipTimeMs);
        await Vip.insertVip(username, server || pkg.server, packageId, newVipTime);
      }

      res.json({ message: 'VIP activated successfully!', vipTime: newVipTime });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = VipController;
