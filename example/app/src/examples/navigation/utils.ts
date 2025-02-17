import type { Route, Routes } from './types';

export function hasRoutes(route: Route): route is { routes: Routes } & Route {
  return 'routes' in route;
}

export function getScreenTitle(path: string): string {
  const parts = path.split('/');
  const lastPart = parts[parts.length - 1] ?? '';
  return lastPart.replace(/([A-Z])/g, ' $1').trim();
}
