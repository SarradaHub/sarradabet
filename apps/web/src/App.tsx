import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router";
import HomePage from "./pages/HomePage";
import { RealtimeProvider } from "./context/RealtimeProvider";
import PageSkeleton from "./components/ui/PageSkeleton";
import "./App.css";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminBetsPage = lazy(() => import("./pages/AdminBetsPage"));
const AdminCategoriesPage = lazy(() => import("./pages/AdminCategoriesPage"));

function App() {
  return (
    <Router>
      <RealtimeProvider>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/admin/login"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <AdminLogin />
                </Suspense>
              }
            />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <AdminLayout />
                </Suspense>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminDashboard />
                  </Suspense>
                }
              />
              <Route
                path="bets"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminBetsPage />
                  </Suspense>
                }
              />
              <Route
                path="categories"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <AdminCategoriesPage />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </main>
      </RealtimeProvider>
    </Router>
  );
}

export default App;
