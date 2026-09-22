import { BrowserRouter, Route, Routes } from "react-router";
import { BirthdaysPage } from "./birthdays/BirthdaysPage";
import { ImportPage } from "./import/ImportPage";
import { CardsPage } from "./cards/CardsPage";
import { DirectoryPage } from "./directory/DirectoryPage";
import { MemberDrawer } from "./directory/MemberDrawer";
import { NotFound } from "./directory/NotFound";
import { AppShell } from "./shell/AppShell";
import { FamilyProvider } from "./store/FamilyProvider";

export default function App() {
  return (
    <FamilyProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DirectoryPage />}>
              <Route path="members/new" element={<MemberDrawer intent="create" />} />
              <Route path="members/:memberId" element={<MemberDrawer intent="existing" />} />
            </Route>
            <Route path="/birthdays" element={<BirthdaysPage />} />
            <Route path="/cards" element={<CardsPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FamilyProvider>
  );
}
