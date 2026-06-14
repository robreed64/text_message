import Link from "next/link";
import { MessageSquare, Users, UsersRound, Send, Settings, LayoutDashboard } from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/contacts", label: "Contacts", icon: Users },
  { href: "/admin/groups", label: "Groups", icon: UsersRound },
  { href: "/admin/send", label: "Send Message", icon: Send },
  { href: "/admin/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <MessageSquare className="h-5 w-5 text-indigo-600 mr-2" />
          <span className="font-semibold text-gray-900">TextServer</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
