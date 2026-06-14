export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Users, UsersRound, MessageSquare, Send } from "lucide-react";

async function getStats() {
  const [contacts, groups, conversations, campaigns] = await Promise.all([
    prisma.contact.count(),
    prisma.group.count(),
    prisma.conversation.count({ where: { status: "open" } }),
    prisma.campaign.count(),
  ]);
  return { contacts, groups, conversations, campaigns };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total Contacts", value: stats.contacts, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Groups", value: stats.groups, icon: UsersRound, color: "text-violet-600 bg-violet-50" },
    { label: "Open Conversations", value: stats.conversations, icon: MessageSquare, color: "text-emerald-600 bg-emerald-50" },
    { label: "Campaigns Sent", value: stats.campaigns, icon: Send, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`rounded-lg p-2 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
