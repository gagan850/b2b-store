import { getFeatures } from "@/lib/data/features"
import { listApprovals } from "@/lib/data/approvals"
import AccountNav from "@/modules/account/components/account-nav"
import { B2BCustomer } from "@/types"
import { ApprovalStatusType, ApprovalType } from "@/types/approval"
import React from "react"

interface AccountLayoutProps {
  customer: B2BCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = async ({
  customer,
  children,
}) => {
  const approvalsOn = (await getFeatures()).approvals
  const { carts_with_approvals } = approvalsOn
    ? await listApprovals({
        type: ApprovalType.ADMIN,
        status: ApprovalStatusType.PENDING,
      })
    : { carts_with_approvals: [] as any[] }

  const numPendingApprovals = carts_with_approvals?.length || 0

  return (
    <div
      className="flex-1 py-6"
      data-testid="account-page"
    >
      <div className="flex-1 content-container h-full flex flex-col">
        <div className="grid grid-cols-1 gap-6 small:grid-cols-[240px_1fr]">
          <div>
            {customer && (
              <AccountNav
                customer={customer}
                numPendingApprovals={numPendingApprovals}
                approvalsEnabled={approvalsOn}
              />
            )}
          </div>
          <div className="flex-1 min-w-0 bg-white p-4 small:p-8">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
