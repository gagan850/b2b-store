import { EllipsisHorizontal, Eye, PencilSquare, Trash } from "@medusajs/icons";
import { DropdownMenu, IconButton, toast } from "@medusajs/ui";
import { useState } from "react";
import { EmployeesUpdateDrawer } from ".";
import { QueryCompany, QueryEmployee } from "../../../../../types";
import { DeletePrompt } from "../../../../components/common";
import { useDeleteEmployee } from "../../../../hooks/api";
import { sdk } from "../../../../lib/client";

const STOREFRONT_URL =
  (import.meta as any).env?.VITE_STOREFRONT_URL ?? "http://localhost:8000";

export const EmployeesActionsMenu = ({
  company,
  employee,
}: {
  company: QueryCompany;
  employee: QueryEmployee;
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { mutateAsync: mutateDelete, isPending: loadingDelete } =
    useDeleteEmployee(employee.company_id);

  const handleDelete = async () => {
    await mutateDelete(employee.id, {
      onSuccess: () => {
        toast.success(`Employee deleted successfully`);
      },
    });
  };

  // Opens the storefront signed in as this buyer for 30 minutes. The window is
  // opened first so the browser does not treat it as a blocked pop-up.
  const shopAs = async () => {
    const win = window.open("", "_blank");
    try {
      const { code } = await sdk.client.fetch<{ code: string }>(
        `/admin/companies/${employee.company_id}/employees/${employee.id}/impersonate`,
        { method: "POST" }
      );
      const url = `${STOREFRONT_URL}/api/impersonate?code=${code}`;
      if (win) win.location.href = url;
      else window.location.href = url;
    } catch (e: any) {
      win?.close();
      toast.error(e?.message ?? "Could not start a session for this buyer");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <IconButton variant="transparent">
            <EllipsisHorizontal />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item className="gap-x-2" onClick={shopAs}>
            <Eye />
            Shop as this buyer
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            className="gap-x-2"
            onClick={() => setEditOpen(true)}
          >
            <PencilSquare />
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            className="gap-x-2"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash />
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
      <EmployeesUpdateDrawer
        company={company}
        employee={employee}
        open={editOpen}
        setOpen={setEditOpen}
        toast={toast}
      />
      <DeletePrompt
        handleDelete={handleDelete}
        loading={loadingDelete}
        open={deleteOpen}
        setOpen={setDeleteOpen}
      />
    </>
  );
};
