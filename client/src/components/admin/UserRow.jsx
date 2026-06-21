import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { UserActionMenu } from "@/components/admin/UserActionMenu"

export function UserRow({ user, onEdit, onToggleRole, onToggleStatus, onResetPassword, onDelete }) {
  return (
    <tr className="transition-colors hover:bg-[var(--bg-subtle)]/50">
      <td className="px-3 py-3 sm:px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden bg-[var(--bg-subtle)] text-xs font-bold text-[var(--text-primary)]">
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
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-[var(--text-primary)] sm:px-5">
        {user.student_number}
      </td>
      
      <td className="px-3 py-3 text-sm font-medium text-[var(--text-primary)] sm:px-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block truncate">{user.full_name}</span>
          </TooltipTrigger>
          <TooltipContent>{user.full_name}</TooltipContent>
        </Tooltip>
      </td>
      <td className="whitespace-nowrap px-3 py-3 sm:px-5">
        <Badge variant={user.role}>{user.role}</Badge>
      </td>
      <td className="px-3 py-3 text-sm text-[var(--text-secondary)] sm:px-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block truncate">{user.year_level}</span>
          </TooltipTrigger>
          <TooltipContent>{user.year_level}</TooltipContent>
        </Tooltip>
      </td>
      <td className="px-3 py-3 text-sm text-[var(--text-secondary)] sm:px-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block truncate">{user.course_or_strand}</span>
          </TooltipTrigger>
          <TooltipContent>{user.course_or_strand}</TooltipContent>
        </Tooltip>
      </td>
      <td className="px-3 py-3 text-sm text-[var(--text-secondary)] sm:px-5">
        {user.section ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block truncate">{user.section}</span>
            </TooltipTrigger>
            <TooltipContent>{user.section}</TooltipContent>
          </Tooltip>
        ) : (
          "—"
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-3 sm:px-5">
        <Badge variant={user.status}>{user.status}</Badge>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right sm:px-5">
        <UserActionMenu
          user={user}
          onEdit={onEdit}
          onToggleRole={onToggleRole}
          onToggleStatus={onToggleStatus}
          onResetPassword={onResetPassword}
          onDelete={onDelete}
        />
      </td>
    </tr>
  )
}