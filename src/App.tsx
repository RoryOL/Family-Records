import { BrowserRouter, Navigate, Route, Routes, useParams, useSearchParams } from "react-router";
import { AppUpdateNotice } from "./native/AppUpdateNotice";
import { BirthdaysPage } from "./birthdays/BirthdaysPage";
import { ImportPage } from "./import/ImportPage";
import { CardsPage } from "./cards/CardsPage";
import { DirectoryPage } from "./directory/DirectoryPage";
import { OwnDetailsPage } from "./directory/OwnDetailsPage";
import { MemberDrawer } from "./directory/MemberDrawer";
import { NotFound } from "./directory/NotFound";
import { homeTarget, legacyMemberTarget } from "./directory/paths";
import { AppShell } from "./shell/AppShell";
import { FamilyTreePage } from "./tree/FamilyTreePage";
import { FamilyProvider } from "./store/FamilyProvider";

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <>
      <AppUpdateNotice />
      <FamilyProvider>
        <BrowserRouter basename={routerBasename || undefined}>
          <AppRoutes />
        </BrowserRouter>
      </FamilyProvider>
    </>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<BirthdaysPage />} />
        <Route path="/birthdays" element={<BirthdaysRedirect />} />
        <Route path="/directory" element={<DirectoryPage />}>
          <Route path="members/new" element={<MemberDrawer intent="create" />} />
          <Route path="members/:memberId" element={<MemberDrawer intent="existing" />} />
        </Route>
        <Route path="/members/new" element={<LegacyMemberRedirect />} />
        <Route path="/members/:memberId" element={<LegacyMemberRedirect />} />
        <Route path="/me" element={<OwnDetailsPage />} />
        <Route path="/tree" element={<FamilyTreePage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function BirthdaysRedirect() {
  const [searchParams] = useSearchParams();
  return <Navigate to={homeTarget(searchParams)} replace />;
}

function LegacyMemberRedirect() {
  const { memberId } = useParams();
  const [searchParams] = useSearchParams();
  return <Navigate to={legacyMemberTarget(memberId, searchParams)} replace />;
}
