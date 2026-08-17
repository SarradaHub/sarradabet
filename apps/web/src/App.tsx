import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import UserDashboardPage from "./pages/UserDashboardPage";
import CoinsPage from "./pages/CoinsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import RewardsPage from "./pages/RewardsPage";
import TicketVerifyPage from "./pages/TicketVerifyPage";
import NotFoundPage from "./pages/NotFoundPage";
import { AuthProvider } from "./context/AuthProvider";
import { RealtimeProvider } from "./context/RealtimeProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import PayoutNotification from "./components/PayoutNotification";
import RewardValidatedNotification from "./components/RewardValidatedNotification";
import ProtectedRoute from "./components/ProtectedRoute";
import PageSkeleton from "./components/ui/PageSkeleton";
import "./App.css";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminBetsPage = lazy(() => import("./pages/AdminBetsPage"));
const AdminCategoriesPage = lazy(() => import("./pages/AdminCategoriesPage"));
const AdminCoinPackagesPage = lazy(
  () => import("./pages/AdminCoinPackagesPage"),
);
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminRewardsPage = lazy(() => import("./pages/AdminRewardsPage"));

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <RealtimeProvider>
          <PayoutNotification />
          <RewardValidatedNotification />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coins"
                element={
                  <ProtectedRoute>
                    <CoinsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/rewards" element={<RewardsPage />} />
              <Route path="/tickets/verify/:code" element={<TicketVerifyPage />} />
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
                  <ProtectedRoute requireAdmin>
                    <Suspense fallback={<PageSkeleton />}>
                      <AdminLayout />
                    </Suspense>
                  </ProtectedRoute>
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
                <Route
                  path="coin-packages"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <AdminCoinPackagesPage />
                    </Suspense>
                  }
                />
                <Route
                  path="users"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <AdminUsersPage />
                    </Suspense>
                  }
                />
                <Route
                  path="rewards"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <AdminRewardsPage />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </RealtimeProvider>
      </AuthProvider>
    </Router>
    </ThemeProvider>
  );
}

export default App;
