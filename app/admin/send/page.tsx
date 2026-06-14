"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Contact = { id: string; name: string; phone: string };
type Group = { id: string; name: string; _count: { members: number } };

function SendForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"individual" | "group">("individual");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [contactId, setContactId] = useState("");
  const [groupId, setGroupId] = useState(searchParams.get("groupId") ?? "");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    fetch("/api/contacts?limit=200").then((r) => r.json()).then((d) => setContacts(d.contacts ?? []));
    fetch("/api/groups?limit=200").then((r) => r.json()).then((d) => setGroups(d.groups ?? []));
  }, []);

  const handleSend = async () => {
    if (!body.trim()) return;
    setStatus("sending");
    try {
      const endpoint = mode === "individual" ? "/api/messages/send-individual" : "/api/messages/send-group";
      const payload = mode === "individual" ? { contactId, body } : { groupId, body };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setStatus("success");
      setResult(mode === "group" ? `Campaign started. ID: ${data.campaignId}` : `Sent. SID: ${data.sid}`);
      setBody("");
    } catch (e: unknown) {
      setStatus("error");
      setResult(e instanceof Error ? e.message : "Unknown error");
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Send Message</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Mode toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
          {(["individual", "group"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === m ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {m === "individual" ? "Individual" : "Group / Mass"}
            </button>
          ))}
        </div>

        {/* Recipient */}
        {mode === "individual" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a group…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g._count.members} members)</option>
              ))}
            </select>
          </div>
        )}

        {/* Message body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={1600}
            placeholder="Type your message…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{body.length}/1600</p>
        </div>

        {/* Preview */}
        {body && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 border border-gray-200">
            <p className="text-xs font-medium text-gray-400 mb-1">PREVIEW</p>
            {body}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={status === "sending" || !body.trim() || (mode === "individual" ? !contactId : !groupId)}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "sending" ? "Sending…" : "Send Message"}
        </button>

        {status === "success" && (
          <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg p-3">{result}</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{result}</p>
        )}
      </div>
    </div>
  );
}

export default function SendPage() {
  return (
    <Suspense>
      <SendForm />
    </Suspense>
  );
}
