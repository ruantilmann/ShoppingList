import BottomNav from "@/components/bottom-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main className="pb-24">{children}</main>
      <BottomNav />
    </>
  );
}
