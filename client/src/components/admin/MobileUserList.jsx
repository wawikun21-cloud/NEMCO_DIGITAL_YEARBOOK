import { MobileUserCard } from "@/components/admin/MobileUserCard";

export default function MobileUserList({ users, onEdit, onToggleRole, onToggleStatus, onResetPassword, onDelete }) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center sm:hidden">
        <p className="text-sm font-medium text-[var(--text-muted)]">No users found</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {users.map((user) => (
        <MobileUserCard
          key={user.id}
          user={user}
          onEdit={onEdit}
          onToggleRole={onToggleRole}
          onToggleStatus={onToggleStatus}
          onResetPassword={onResetPassword}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
