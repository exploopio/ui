'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import type { Asset } from '../../types'

export interface AssetDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
  assetTypeName: string
  onConfirm: () => Promise<void>
  isDeleting?: boolean
  // For bulk delete
  bulkCount?: number
}

export function AssetDeleteDialog({
  open,
  onOpenChange,
  asset,
  assetTypeName,
  onConfirm,
  isDeleting = false,
  bulkCount,
}: AssetDeleteDialogProps) {
  const isBulkDelete = bulkCount !== undefined && bulkCount > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulkDelete ? `Delete ${bulkCount} ${assetTypeName}s?` : `Delete ${assetTypeName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulkDelete ? (
              <>
                Are you sure you want to delete <strong>{bulkCount}</strong>{' '}
                {assetTypeName.toLowerCase()}s? This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete <strong>{asset?.name}</strong>? This action cannot
                be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
