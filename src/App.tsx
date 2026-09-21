import { StorePreview } from "./preview/StorePreview";
import { FamilyProvider } from "./store/FamilyProvider";

export default function App() {
  return (
    <FamilyProvider>
      <div className="min-h-screen">
        <div className="h-1.5 bg-clay" />
        <StorePreview />
      </div>
    </FamilyProvider>
  );
}
