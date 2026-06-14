import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "./pages/HomePage";
import { RealtimeProvider } from "./context/RealtimeProvider";
import PageSkeleton from "./components/ui/PageSkeleton";
import "./App.css";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

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
              path="/admin/dashboard"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <AdminDashboard />
                </Suspense>
              }
            />
          </Routes>
        </main>
      </RealtimeProvider>
    </Router>
  );
}

export default App;
