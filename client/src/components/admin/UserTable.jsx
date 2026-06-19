import { UserRow } from "@/components/admin/UserRow";

export default function UserTable({ users, onEdit, onToggleRole, onToggleStatus, onResetPassword, onDelete }) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)]">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-[var(--text-muted)]">No users found</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Try adjusting your search or filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--bg-subtle)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              <th className="px-3 py-3 sm:px-5">Avatar</th>
              <th className="px-3 py-3 sm:px-5">Student #</th>
              <th className="hidden px-3 py-3 sm:table-cell sm:px-5">Email</th>
              <th className="px-3 py-3 sm:px-5">Full Name</th>
              <th className="hidden px-3 py-3 sm:table-cell sm:px-5">Role</th>
              <th className="hidden px-3 py-3 lg:table-cell lg:px-5">Year</th>
              <th className="hidden px-3 py-3 lg:table-cell lg:px-5">Course</th>
              <th className="hidden px-3 py-3 lg:table-cell lg:px-5">Section</th>
              <th className="hidden px-3 py-3 sm:table-cell sm:px-5">Status</th>
              <th className="px-3 py-3 text-right sm:px-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onEdit={onEdit}
                onToggleRole={onToggleRole}
                onToggleStatus={onToggleStatus}
                onResetPassword={onResetPassword}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
