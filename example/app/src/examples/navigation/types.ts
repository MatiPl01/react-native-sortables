import type { RouteCardComponent } from '@/components';

type SharedRouteProps = {
  name: string;
  CardComponent?: RouteCardComponent;
};

export type RouteWithRoutes = SharedRouteProps & {
  flatten?: true;
  routes: Routes;
};

type RouteWithComponent = SharedRouteProps & {
  Component: React.ComponentType;
};

export type Route = RouteWithComponent | RouteWithRoutes;

export type Routes = Record<string, Route>;
