import { BrowserRouter, Route, Routes } from "react-router";
import { DirectoryPage } from "./directory/DirectoryPage";
import { MemberDrawer } from "./directory/MemberDrawer";
import { NotFound } from "./directory/NotFound";
import { FamilyProvider } from "./store/FamilyProvider";

export default function App() {
  return (
    <FamilyProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <div className="h-1.5 bg-clay" />
          <Routes>
            <Route path="/" element={<DirectoryPage />}>
              <Route path="members/new" element={<MemberDrawer intent="create" />} />
              <Route path="members/:memberId" element={<MemberDrawer intent="existing" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </FamilyProvider>
  );
}
