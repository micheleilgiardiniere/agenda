import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const pin = cookieStore.get("auth_pin")?.value;

    if (pin !== "2580") {
        redirect("/login");
    }

    return (
        <div className="flex min-h-svh">
            <DesktopSidebar />
            <main className="flex-1 pb-20 md:pb-0">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
