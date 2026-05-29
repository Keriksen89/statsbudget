import express from 'express';
const router = express.Router();

// Exposes client-side map tokens to the browser. These are *client* tokens by
// design (Cesium ion access tokens and referer-restricted Google Maps keys are
// meant to ship to the browser), so this is not a secret leak. When the env
// vars are absent the client falls back to token-free OpenStreetMap imagery.
router.get('/config', (req, res) => {
  res.json({
    cesiumIonToken: process.env.CESIUM_ION_TOKEN || '',
    googleTilesKey: process.env.GOOGLE_MAPS_KEY || '',
  });
});

export default router;
