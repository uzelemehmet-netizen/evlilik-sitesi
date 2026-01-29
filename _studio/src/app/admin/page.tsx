import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockUsers } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ShieldOff } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Admin Dashboard</CardTitle>
          <CardDescription>Manage users, KYC approvals, and system analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4 font-headline">User Management & KYC Approval</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>user{user.id.split('-')[1]}@example.com</TableCell>
                    <TableCell>
                      <Badge variant={user.isVerified ? "default" : "secondary"} className={user.isVerified ? "bg-green-100 text-green-800" : ""}>
                         {user.isVerified ? <ShieldCheck className="mr-2 h-4 w-4"/> : <ShieldOff className="mr-2 h-4 w-4" />}
                        {user.isVerified ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       {!user.isVerified && (
                        <Button size="sm">Approve KYC</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
