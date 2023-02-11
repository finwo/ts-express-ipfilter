import { Request, Response } from 'express';
import { Netmask } from 'netmask';
import LRU from 'lru-cache';

export type iplist        = string[];
export type DeniedHandler = (req: Request, res: Response, next: ()=>void) => void;
export type Opts          = {
  deniedHandler     ?: DeniedHandler;
  trustForwardedFor ?: boolean;
  cacheSize         ?: number;
  cacheTTL          ?: number;
  mode              ?: 'allowList' | 'blockList';
};

export const defaultDeniedHandler: DeniedHandler = (_req: Request, res: Response) => {
  res.status(403);
  res.send('Permission denied');
};

export function ipfilter(listedIPs: iplist, options: Opts) {

  // Ensure all options are set
  const opts: Required<Opts> = Object.assign({
    deniedHandler    : defaultDeniedHandler,
    trustForwardedFor: true,
    cacheSize        : 1000,
    cacheTTL         : 1000 * 60 * 5,
    mode             : 'allowList',
  }, options);

  // Initialize cache
  const cache = new LRU({
    max: opts.cacheSize,
    ttl: opts.cacheTTL,
  });

  // Pre-compile ranges
  const ranges = listedIPs.map(cidr => new Netmask(cidr));

  // Return the middleware
  return (req: Request, res: Response, next: () => void) => {
    let clientIP = opts.trustForwardedFor
      ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress)
      : req.socket.remoteAddress;
    if (Array.isArray(clientIP)) clientIP = clientIP.shift();

    // Attempt to fetch from cache
    let allowed = cache.get<boolean>(clientIP);

    // Check against allowedIPs list
    if (allowed === undefined) {

      // Check if the clientIP is in the list
      let inList = false;
      if (clientIP) {
        for(const block of ranges) {
          if (block.contains(clientIP)) {
            inList = true;
            break;
          }
        }
      }

      // Define whether or not the client is allowed
      if (opts.mode == 'blockList') {
        allowed = !inList;
      } else {
        allowed = inList;
      }

      // Store the result in cache
      cache.set(clientIP, allowed);
    }

    // Act upon whether the client is allowed
    if (allowed) return next();

    // Here = not allowed
    return opts.deniedHandler(req, res, next);
  };
}
