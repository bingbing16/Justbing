import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout'
import type { BreadcrumbItem } from '@/types'
import { usePage } from '@inertiajs/react'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

interface FlashProps {
    success?: string
    error?: string
}

interface PageProps {
    [key: string]: unknown
    flash?: FlashProps
}

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[]
    children: React.ReactNode
}) {
    const { flash } = usePage<PageProps>().props

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success)
        }

        if (flash?.error) {
            toast.error(flash.error)
        }
    }, [flash])

    return (
        <>
            <Toaster />

            <AppLayoutTemplate breadcrumbs={breadcrumbs}>
                {children}
            </AppLayoutTemplate>
        </>
    )
}
