export function RecentActivity() {
  const activities = [
    { id: 1, type: "document", person: "John Doe", action: "uploaded", target: "Evidence A", date: "2 hours ago" },
    {
      id: 2,
      type: "comment",
      person: "Jane Smith",
      action: "commented on",
      target: "Motion to Dismiss",
      date: "4 hours ago",
    },
    { id: 3, type: "event", person: "System", action: "scheduled", target: "Client Meeting", date: "Yesterday" },
    { id: 4, type: "document", person: "Alice Johnson", action: "updated", target: "Case Summary", date: "2 days ago" },
  ]

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest updates on the project.</p>
      </div>
      <ul className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <li key={activity.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">{/* Add appropriate icons based on activity type */}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.person} {activity.action} {activity.target}
                </p>
                <p className="text-sm text-gray-500">{activity.date}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

