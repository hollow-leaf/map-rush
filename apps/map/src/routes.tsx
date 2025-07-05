import { RootRoute, Route, Router } from '@tanstack/react-router';
import App from './App';
import Home from './pages/Home';
import KartGarage from './pages/KartGarage';
import About from './pages/About';

// Create a root route
const rootRoute = new RootRoute({
  component: App, // App component will render Navbar and Outlet
});

// Define routes
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const kartGarageRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/kart-garage',
  component: KartGarage,
});

const aboutRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: About,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  kartGarageRoute
]);

// Create the router instance
export const router = new Router({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
