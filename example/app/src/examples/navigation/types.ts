import type { RouteCardComponent } from '@/components';

type SharedRouteProps = {
  name: string;
  CardComponent?: RouteCardComponent;
};

export type RouteWithRoutes = {
  flatten?: true;
  routes: Routes;
} & SharedRouteProps;

type RouteWithComponent = {
  Component: React.ComponentType;
} & SharedRouteProps;

export type Route = RouteWithComponent | RouteWithRoutes;

export type Routes = Record<string, Route>;
