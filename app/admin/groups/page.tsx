export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function GroupsPage() {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true, campaigns: true } } },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Link
          href="/admin/groups/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Create Group
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">{g.name}</h2>
            {g.description && <p className="text-sm text-gray-500 mb-3">{g.description}</p>}
            <div className="flex gap-4 text-sm text-gray-600">
              <span><strong>{g._count.members}</strong> members</span>
              <span><strong>{g._count.campaigns}</strong> campaigns</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/admin/groups/${g.id}`}
                className="text-sm text-indigo-600 hover:underline"
              >
                Manage members
              </Link>
              <span className="text-gray-300">·</span>
              <Link
                href={`/admin/send?groupId=${g.id}`}
                className="text-sm text-indigo-600 hover:underline"
              >
                Send message
              </Link>
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="col-span-3 text-center text-gray-400 py-12">No groups yet.</p>
        )}
      </div>
    </div>
  );
}
