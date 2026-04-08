import { lazy } from 'react';
import { isLikelyChunkLoadError, recoverFromChunkLoadError } from './chunkLoadRecovery.js';

export function lazyRoute(importer, routeKey = 'route') {
  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      if (isLikelyChunkLoadError(error)) {
        await recoverFromChunkLoadError({
          reason: `lazy_route:${routeKey}`,
          storageKey: `uniqah:lazy_route_recover:${routeKey}`,
        });
        return new Promise(() => {});
      }
      throw error;
    }
  });
}

export default lazyRoute;