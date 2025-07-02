import { RootRoute, Route, Router } from '@tanstack/react-router';
import App from './App';
import Home from './pages/Home';
import MyKartList from './pages/MyKartList';
import { Login, UserInfo } from '@/components/MagicAuth'; // Assuming Login and UserInfo might be separate routes or handled within App

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

const myKartListRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/my-kart-list',
  component: MyKartList,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  myKartListRoute,
]);

// Create the router instance
export const router = new Router({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
