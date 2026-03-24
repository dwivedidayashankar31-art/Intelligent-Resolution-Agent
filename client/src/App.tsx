import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import CustomerSupport from "./pages/customer-support";
import CrmPortal from "./pages/crm-portal";
import PaymentPage from "./pages/payment";
import LoginPage from "./pages/login";
import SettingsPage from "./pages/settings";
import { useAuth } from "./hooks/use-auth";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/" component={CustomerSupport} />
      <Route path="/login">
        {!isLoading && user ? <Redirect to="/crm" /> : <LoginPage />}
      </Route>
      <Route path="/crm">
        <ProtectedRoute component={CrmPortal} />
      </Route>
      <Route path="/pricing" component={PaymentPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
