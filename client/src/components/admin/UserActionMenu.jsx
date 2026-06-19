import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, UserPen, Shield, ShieldOff, KeyRound, Trash2 } from "lucide-react"

export default function UserActionMenu({ user, onEdit, onToggleRole, onToggleStatus, onResetPassword, onDelete }) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="h-8 w-8 shrink-0">
          <MoreHorizontal size={16} />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => { onEdit(user); setOpen(false) }}>
          <UserPen size={14} className="mr-2" />
          Edit User
        </DropdownMenuItem>
        {onToggleRole && (
          <DropdownMenuItem onClick={() => { onToggleRole(user); setOpen(false) }}>
            {user.role === "admin" ? (
              <>
                <ShieldOff size={14} className="mr-2" />
                Remove Admin
              </>
            ) : (
              <>
                <Shield size={14} className="mr-2" />
                Assign Admin
              </>
            )}
          </DropdownMenuItem>
        )}
        {onToggleStatus && (
          <DropdownMenuItem onClick={() => { onToggleStatus(user); setOpen(false) }}>
            {user.status === "active" ? (
              <>
                <ShieldOff size={14} className="mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Shield size={14} className="mr-2" />
                Reactivate
              </>
            )}
          </DropdownMenuItem>
        )}
        {onResetPassword && (
          <DropdownMenuItem onClick={() => { onResetPassword(user.id); setOpen(false) }}>
            <KeyRound size={14} className="mr-2" />
            Reset Password
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {onDelete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => { onDelete(user.id); setOpen(false) }}>
            <Trash2 size={14} className="mr-2" />
            Delete User
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserActionMenu }
