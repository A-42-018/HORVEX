import { Navigate, useLocation } from "react-router";
import { Button } from "../../components/common";
import { strings } from "../../lib/strings";
import AdminStatus from "../components/AdminStatus";
import { useAuth } from "./authContext";

const t = strings.admin;

// Gate for everything under /admin except the login page: signed out → login
// (remembering where they were going), signed in without a staff row → refused.
function RequireAdmin({ children }) {
  const { status, retry, signOut } = useAuth();
  const location = useLocation();

  if (status === "loading") return <AdminStatus loading title={t.checking} />;
  if (status === "signedOut") return <Navigate to="/admin/login" replace state={{ from: location }} />;

  if (status === "error") {
    return (
      <AdminStatus title={t.sessionError.title} body={t.sessionError.body}>
        <Button onClick={() => retry()}>{t.sessionError.retry}</Button>
        <Button variant="secondary" onClick={signOut}>
          {t.signOut}
        </Button>
      </AdminStatus>
    );
  }

  if (status === "denied") {
    return (
      <AdminStatus title={t.denied.title} body={t.denied.body}>
        <Button variant="secondary" onClick={signOut}>
          {t.signOut}
        </Button>
      </AdminStatus>
    );
  }

  return children;
}

export default RequireAdmin;
