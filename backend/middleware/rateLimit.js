const buckets = new Map();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5minutes
const BUCKET_TTL_MS = 15 * 60 * 1000; // 15 minutes

let bucketCleanupStarted = false;
const tokenBucketLimiter = ({ capacity = 5, refillRate = 1/10 })=>{


    //  bucket cleanup to clear ips that has not make request within 15 minutes

    if (!bucketCleanupStarted) {
    setInterval(() => {
      const now = Date.now();
      for (const [ip, bucket] of buckets.entries()) {
        if (now - bucket.lastSeen > BUCKET_TTL_MS) {
          buckets.delete(ip);
        }
      }
    }, CLEANUP_INTERVAL_MS);
    bucketCleanupStarted = true;
  }


 return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    console.log("Req IP: ", ip);

    if (!buckets.has(ip)) {
      buckets.set(ip, {
        tokens: capacity,
        lastRefill: now,
        lastSeen: now
      });
    }

    const bucket = buckets.get(ip);

    // Refill logic
    const elapsed = (now - bucket.lastRefill) / 1000;
    if (elapsed > 0) {
      const tokensToAdd = elapsed * refillRate;
      bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    bucket.lastSeen = now; // Mark as recently active

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      next();
    } else {
      res.status(429).json({
        message: "Too many requests. Please wait and try again later."
      });
    }
  };
}
export default tokenBucketLimiter;