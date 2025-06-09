"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Trash2, Plus, Loader2 } from "lucide-react"
import {
  addAdminEmailAction,
  removeAdminEmailAction
} from "@/actions/admin/admin-role-actions"
import { useToast } from "@/components/ui/use-toast"

interface AdminEmail {
  email: string
  addedBy: string
  addedAt: any
}

interface AdminEmailManagerProps {
  initialEmails: AdminEmail[]
  currentUserEmail?: string
}

export default function AdminEmailManager({
  initialEmails,
  currentUserEmail
}: AdminEmailManagerProps) {
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>(initialEmails)
  const [newEmail, setNewEmail] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAddEmail = async () => {
    if (!newEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an email address"
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address"
      })
      return
    }

    setIsAdding(true)
    console.log("[AdminEmailManager] Adding admin email:", newEmail)

    try {
      const result = await addAdminEmailAction(newEmail, currentUserEmail || "Unknown")
      
      if (result.isSuccess && result.data) {
        console.log("[AdminEmailManager] Admin email added successfully")
        setAdminEmails([...adminEmails, result.data])
        setNewEmail("")
        toast({
          title: "Success",
          description: "Admin email added successfully"
        })
      } else {
        console.error("[AdminEmailManager] Failed to add admin email:", result.message)
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        })
      }
    } catch (error) {
      console.error("[AdminEmailManager] Error adding admin email:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add admin email"
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveEmail = async (email: string) => {
    // Prevent removing your own admin access
    if (email === currentUserEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You cannot remove your own admin access"
      })
      return
    }

    setRemovingEmail(email)
    console.log("[AdminEmailManager] Removing admin email:", email)

    try {
      const result = await removeAdminEmailAction(email)
      
      if (result.isSuccess) {
        console.log("[AdminEmailManager] Admin email removed successfully")
        setAdminEmails(adminEmails.filter(admin => admin.email !== email))
        toast({
          title: "Success",
          description: "Admin email removed successfully"
        })
      } else {
        console.error("[AdminEmailManager] Failed to remove admin email:", result.message)
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        })
      }
    } catch (error) {
      console.error("[AdminEmailManager] Error removing admin email:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove admin email"
      })
    } finally {
      setRemovingEmail(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Email Management</CardTitle>
        <CardDescription>
          Users with these email addresses will have admin access when they sign in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new admin email form */}
        <div className="space-y-2">
          <Label htmlFor="new-email">Add Admin Email</Label>
          <div className="flex gap-2">
            <Input
              id="new-email"
              type="email"
              placeholder="admin@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddEmail()
                }
              }}
              disabled={isAdding}
            />
            <Button
              onClick={handleAddEmail}
              disabled={isAdding || !newEmail}
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Admin
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Admin emails table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead>Added At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminEmails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No admin emails configured
                  </TableCell>
                </TableRow>
              ) : (
                adminEmails.map((admin) => (
                  <TableRow key={admin.email}>
                    <TableCell className="font-medium">{admin.email}</TableCell>
                    <TableCell>{admin.addedBy}</TableCell>
                    <TableCell>
                      {admin.addedAt 
                        ? typeof admin.addedAt === 'string'
                          ? new Date(admin.addedAt).toLocaleDateString()
                          : admin.addedAt.seconds 
                            ? new Date(admin.addedAt.seconds * 1000).toLocaleDateString()
                            : admin.addedAt.toDate 
                              ? admin.addedAt.toDate().toLocaleDateString()
                              : "Unknown"
                        : "Unknown"
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEmail(admin.email)}
                        disabled={removingEmail === admin.email || admin.email === currentUserEmail}
                      >
                        {removingEmail === admin.email ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Users need to sign out and sign back in for admin role changes to take effect.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 