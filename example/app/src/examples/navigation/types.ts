export type Route = {
  name: string;
} & (
  | {
      routes: Routes;
    }
  | { component: React.ComponentType<unknown> }
);

export type Routes = Record<string, Route>;
