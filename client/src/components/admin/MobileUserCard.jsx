import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { UserActionMenu } from "@/components/admin/UserActionMenu"
import { ChevronDown, ChevronUp, UserPen } from "lucide-react"

function MobileUserCard({ user, onEdit, onToggleRole, onToggleStatus, onResetPassword, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
<div className="flex items-center gap-3">
           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-[var(--bg-subtle)] text-sm font-bold text-[var(--text-primary)]">
             {user.avatar_url ? (
               <img
                 src={user.avatar_url}
                 alt={user.full_name || "Avatar"}
                 className="h-full w-full object-cover"
               />
             ) : (
               user.full_name?.charAt(0)?.toUpperCase() || "?"
             )}
           </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user.full_name}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user.role} className="text-[10px]">{user.role}</Badge>
          <UserActionMenu
            user={user}
            onEdit={onEdit}
            onToggleRole={onToggleRole}
            onToggleStatus={onToggleStatus}
            onResetPassword={onResetPassword}
            onDelete={onDelete}
          />
        </div>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-light)] pt-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[var(--text-muted)]">Student #</span>
              <p className="mt-0.5 font-medium text-[var(--text-primary)]">{user.student_number}</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Status</span>
              <p className="mt-0.5">
                <Badge variant={user.status} className="text-[10px]">{user.status}</Badge>
              </p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Year Level</span>
              <p className="mt-0.5 font-medium text-[var(--text-primary)]">{user.year_level}</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Course/Strand</span>
              <p className="mt-0.5 font-medium text-[var(--text-primary)]">{user.course_or_strand}</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Section</span>
              <p className="mt-0.5 font-medium text-[var(--text-primary)]">{user.section || "—"}</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Profile Status</span>
              <p className="mt-0.5">
                <Badge variant={user.profile_status} className="text-[10px]">{user.profile_status}</Badge>
              </p>
            </div>
            {user.bio && (
              <div className="col-span-2">
                <span className="text-[var(--text-muted)]">Bio</span>
                <p className="mt-0.5 text-xs text-[var(--text-primary)]">{user.bio}</p>
              </div>
            )}
            {user.quote && (
              <div className="col-span-2">
                <span className="text-[var(--text-muted)]">Quote</span>
                <p className="mt-0.5 text-xs italic text-[var(--text-primary)]">“{user.quote}”</p>
              </div>
            )}
          </div>
          <button
            onClick={() => onEdit(user)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-[var(--border-light)] bg-[var(--bg-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]/80"
          >
            <UserPen size={14} />
            Edit User
          </button>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-[var(--text-muted)]"
      >
        {expanded ? (
          <>
            <ChevronUp size={14} />
            Show less
          </>
        ) : (
          <>
            <ChevronDown size={14} />
            Show more
          </>
        )}
      </button>
    </div>
  )
}

export { MobileUserCard }
