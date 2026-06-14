export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string }>;
}) {
  const { contactId } = await searchParams;

  const conversations = await prisma.conversation.findMany({
    where: { status: "open" },
    orderBy: { lastMessageAt: "desc" },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const active = contactId
    ? conversations.find((c) => c.contactId === contactId)
    : conversations[0];

  return (
    <div className="flex h-full">
      {/* Left: conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Conversations</h2>
          <p className="text-xs text-gray-400 mt-0.5">{conversations.length} open</p>
        </div>
        <div className="divide-y divide-gray-100">
          {conversations.map((conv) => {
            const last = conv.messages[conv.messages.length - 1];
            const unread = conv.messages.filter((m) => m.direction === "inbound" && !m.threadRootId).length;
            return (
              <Link
                key={conv.id}
                href={`/admin/conversations?contactId=${conv.contactId}`}
                className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                  active?.contactId === conv.contactId ? "bg-indigo-50 border-l-2 border-indigo-600" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900">{conv.contact.name}</span>
                  {unread > 0 && (
                    <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5">
                      {unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{last?.body ?? "No messages"}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {last ? formatDistanceToNow(last.createdAt, { addSuffix: true }) : ""}
                </p>
              </Link>
            );
          })}
          {conversations.length === 0 && (
            <p className="p-6 text-sm text-gray-400 text-center">No open conversations</p>
          )}
        </div>
      </div>

      {/* Right: thread view */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {active ? (
          <>
            <div className="h-14 flex items-center px-6 border-b border-gray-200 bg-white">
              <div>
                <p className="font-semibold text-sm">{active.contact.name}</p>
                <p className="text-xs text-gray-400">{active.contact.phone}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {active.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-sm rounded-2xl px-4 py-2.5 text-sm ${
                      msg.direction === "outbound"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                    }`}
                  >
                    <p>{msg.body}</p>
                    <p className={`text-xs mt-1 ${msg.direction === "outbound" ? "text-indigo-200" : "text-gray-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {msg.direction === "outbound" && (
                        <span className="ml-2 capitalize">{msg.status}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
