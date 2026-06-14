export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {[
          { label: "Twilio Account SID", key: "TWILIO_ACCOUNT_SID" },
          { label: "Twilio Auth Token", key: "TWILIO_AUTH_TOKEN" },
          { label: "Twilio Phone Number", key: "TWILIO_PHONE_NUMBER" },
          { label: "App URL", key: "NEXT_PUBLIC_APP_URL" },
          { label: "Database URL", key: "DATABASE_URL" },
        ].map(({ label, key }) => (
          <div key={key} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 font-mono">{key}</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-1">
              Set via Vercel env vars
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
