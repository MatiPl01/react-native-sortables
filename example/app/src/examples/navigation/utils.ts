import type { Route, Routes } from './types';

export function hasRoutes(route: Route): route is { routes: Routes } & Route {
  return 'routes' in route;
}

export function getScreenTitle(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] ?? '';
}

export function removeScreenHash(path: string = ''): string {
  const parts = path.split('-');
  return parts.slice(0, parts.length - 1).join('-');
}
