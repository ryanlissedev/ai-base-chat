import { Navbar } from './navbar';

export default function ModelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh max-h-dvh grid grid-rows-[auto_1fr]">
      <Navbar />
      <div className="relative flex-1 min-h-0 ">{children}</div>
    </div>
  );
}
