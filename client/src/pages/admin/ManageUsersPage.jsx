import { useState, useEffect, useMemo } from "react"
import AdminStatCard from "@/components/admin/AdminStatCard"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, UserX, Clock, UserPlus, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import UserFilters from "@/components/admin/UserFilters"
import UserTable from "@/components/admin/UserTable"
import MobileUserList from "@/components/admin/MobileUserList"
import UserFormModal from "@/components/admin/UserFormModal"
import { getUsers, createUser, updateUser, deleteUser, resetPassword } from "@/services/userService"
import { toast } from "sonner"

export default function ManageUsersPage() {
  const [users, setUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    year_level: "all",
    course_or_strand: "all",
    section: "all",
  })

  useEffect(() => {
    getUsers().then(setUsers).catch((error) => {
      toast.error(error.message || "Failed to load users")
    })
  }, [])

  const filterOptions = useMemo(() => {
    const yearLevels = [...new Set(users.map(u => u.year_level).filter(Boolean))].sort()
    const courses = [...new Set(users.map(u => u.course_or_strand).filter(Boolean))].sort()
    const sections = [...new Set(users.map(u => u.section).filter(Boolean))].sort()

    return {
      yearLevelOptions: [
        { value: "all", label: "All Years" },
        ...yearLevels.map(y => ({ value: y, label: `Grade ${y}` })),
      ],
      courseOptions: [
        { value: "all", label: "All Courses" },
        ...courses.map(c => ({ value: c, label: c })),
      ],
      sectionOptions: [
        { value: "all", label: "All Sections" },
        ...sections.map(s => ({ value: s, label: `Section ${s}` })),
      ],
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const match =
          user.full_name?.toLowerCase().includes(q) ||
          user.email?.toLowerCase().includes(q) ||
          user.student_number?.includes(q)
        if (!match) return false
      }
      if (filters.role !== "all" && user.role !== filters.role) return false
      if (filters.year_level !== "all" && user.year_level !== filters.year_level) return false
      if (filters.course_or_strand !== "all" && user.course_or_strand !== filters.course_or_strand) return false
      if (filters.section !== "all" && user.section !== filters.section) return false
      return true
    })
  }, [users, filters])

   const [currentPage, setCurrentPage] = useState(1)
   const itemsPerPage = 10

   const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage))

  const safePage = Math.min(currentPage, totalPages)

  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage
    return filteredUsers.slice(start, start + itemsPerPage)
  }, [filteredUsers, safePage])

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.status === "active").length
    const inactive = users.filter((u) => u.status === "inactive").length
    const pending = users.filter((u) => u.profile_status === "submitted" || u.profile_status === "draft").length
    return { total, active, inactive, pending }
  }, [users])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({
      search: "",
      role: "all",
      year_level: "all",
      course_or_strand: "all",
      section: "all",
    })
    setCurrentPage(1)
  }

  const handleEdit = (user) => setEditingUser(user)
  const handleCreate = () => setIsCreateModalOpen(true)

  const handleSubmit = async (data) => {
    try {
      if (data.id) {
        const updatedUser = await updateUser(data.id, data)
        setUsers((prev) => prev.map((u) => (u.id === data.id ? updatedUser : u)))
        toast.success("User updated successfully")
      } else {
        const newUser = await createUser(data)
        setUsers((prev) => [...prev, newUser])
        toast.success("User created successfully")
      }
      setEditingUser(null)
      setIsCreateModalOpen(false)
    } catch (error) {
      toast.error(error.message || "Failed to save user")
    }
  }

  const handleToggleRole = async (user) => {
    try {
      const updatedUser = await updateUser(user.id, { role: user.role === "admin" ? "user" : "admin" })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)))
      toast.success(user.role === "admin" ? "Admin role removed" : "Admin role assigned")
    } catch (error) {
      toast.error(error.message || "Failed to update role")
    }
  }

  const handleToggleStatus = async (user) => {
    try {
      const updatedUser = await updateUser(user.id, { status: user.status === "active" ? "inactive" : "active" })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)))
      toast.success(user.status === "active" ? "User deactivated" : "User reactivated")
    } catch (error) {
      toast.error(error.message || "Failed to update status")
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      toast.success("User deleted successfully")
    } catch (error) {
      toast.error(error.message || "Failed to delete user")
    }
  }

  const handleResetPassword = async (id) => {
    try {
      await resetPassword(id)
      toast.success("Password reset link generated")
    } catch (error) {
      toast.error(error.message || "Failed to reset password")
    }
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Manage Users
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            View, create, and manage user accounts and permissions.
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full gap-2 sm:w-auto shrink-0">
          <UserPlus size={16} />
          Create User
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard
          id="total-users"
          label="Total Users"
          value={stats.total}
          icon={Users}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <AdminStatCard
          id="active-users"
          label="Active"
          value={stats.active}
          icon={UserCheck}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <AdminStatCard
          id="inactive-users"
          label="Inactive"
          value={stats.inactive}
          icon={UserX}
          iconBg="bg-slate-50 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
        />
        <AdminStatCard
          id="pending-approvals"
          label="Pending"
          value={stats.pending}
          icon={Clock}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

<UserFilters
         filters={filters}
         onFilterChange={handleFilterChange}
         onClear={handleClearFilters}
         yearLevelOptions={filterOptions.yearLevelOptions}
         courseOptions={filterOptions.courseOptions}
         sectionOptions={filterOptions.sectionOptions}
       />

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">
          Showing {filteredUsers.length > 0 ? (safePage - 1) * itemsPerPage + 1 : 0}–{Math.min(safePage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
        </p>
      </div>

      <div className="hidden sm:block min-w-0">
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
          <UserTable
            users={paginatedUsers}
            onEdit={handleEdit}
            onToggleRole={handleToggleRole}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPassword}
            onDelete={handleDelete}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--border-light)] px-4 py-3">
              <p className="text-xs text-[var(--text-muted)]">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="h-8 w-8"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (safePage <= 3) {
                    pageNum = i + 1
                  } else if (safePage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = safePage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === safePage ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 text-xs"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="h-8 w-8"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="sm:hidden">
        <MobileUserList
          users={paginatedUsers}
          onEdit={handleEdit}
          onToggleRole={handleToggleRole}
          onToggleStatus={handleToggleStatus}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
        />
      </div>

      {filteredUsers.length === 0 && (
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-8 text-center sm:p-12">
          <AlertTriangle size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No users found</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Try adjusting your search or filters to find what you are looking for.
          </p>
          <Button variant="outline" onClick={handleClearFilters} className="mt-4">
            Clear Filters
          </Button>
        </div>
      )}

      {editingUser && (
        <UserFormModal
          open={!!editingUser}
          onOpenChange={(open) => { if (!open) setEditingUser(null) }}
          user={editingUser}
          onSubmit={handleSubmit}
        />
      )}

      <UserFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        user={null}
        onSubmit={handleSubmit}
      />
    </div>
  )
}