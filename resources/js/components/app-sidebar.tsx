import { Link, usePage } from '@inertiajs/react'
import {
    Accessibility,
    BarChart3,
    CalendarDays,
    CalendarRange,
    ClipboardCheck,
    ClipboardList,
    FileCog,
    FileSpreadsheet,
    FileText,
    FolderGit2,
    FolderTree,
    HeartHandshakeIcon,
    LayoutDashboard,
    ListChecks,
    Mail,
    Settings2,
    ShieldCheck,
    UploadCloud,
    UsersRound,
    Eye,
} from 'lucide-react'

import AppLogo from '@/components/app-logo'
import { NavFooter } from '@/components/nav-footer'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'

import { dashboard } from '@/routes'
import type { NavItem } from '@/types'
import type { LucideIcon } from 'lucide-react'

interface ReportType {
    id: number
    code: string
    slug: string
    name: string
}

/*
|--------------------------------------------------------------------------
| Report Type Icons
|--------------------------------------------------------------------------
*/

const reportTypeIcons: Record<string, LucideIcon> = {
    HWPSC: HeartHandshakeIcon,
    PBP: Eye,
    HWPPWD: Accessibility,
}

/*
|--------------------------------------------------------------------------
| Administration / Configuration
|--------------------------------------------------------------------------
|
| Routes are unchanged. Only the display names and icons are improved.
|
*/

const administrationItems: NavItem[] = [
    {
        title: 'LGUs',
        href: '/lgus',
        icon: UsersRound,
    },
    {
        title: 'Report Types',
        href: '/report-types',
        icon: FileText,
    },
    {
        title: 'Report Sections',
        href: '/report-sections',
        icon: FolderTree,
    },
    {
        title: 'Indicators',
        href: '/indicators',
        icon: ListChecks,
    },
    {
        title: 'Quarters',
        href: '/quarters',
        icon: CalendarRange,
    },
    {
        title: 'Reporting Periods',
        href: '/reporting-periods',
        icon: CalendarDays,
    },
    {
        title: 'Import Mappings',
        href: '/report-import-mappings',
        icon: FileSpreadsheet,
    },
    {
        title: 'FHSIS Import Mappings',
        href: '/justine/fhsis-import-mappings',
        icon: FileSpreadsheet,
    },
    {
        title: 'Eto Calculator',
        href: '/justine/report-formulas',
        icon: FileCog,
    },
    {
        title: 'Dashboard Configuration',
        href: '/justine/dashboard-configuration',
        icon: LayoutDashboard,
    },
    {
        title: 'Import Audit Trail',
        href: '/report-imports',
        icon: ClipboardCheck,
    },
]

/*
|--------------------------------------------------------------------------
| System
|--------------------------------------------------------------------------
*/

const systemItems: NavItem[] = [
    {
        title: 'Report Email Configuration',
        href: '/justine/lgu-report-emails',
        icon: Mail,
    },
]

/*
|--------------------------------------------------------------------------
| Footer
|--------------------------------------------------------------------------
*/

const footerNavItems: NavItem[] = [
    ...administrationItems,
    ...systemItems,
]

export function AppSidebar() {
    const { reportTypes } = usePage<{
        reportTypes: ReportType[]
    }>().props

    /*
    |--------------------------------------------------------------------------
    | Dynamic Report Routes
    |--------------------------------------------------------------------------
    */

    const reportRoutes: Record<string, string> = {
        HWPSC: '/justine/reports/hwpsc',
        PBP: '/justine/reports/pbp',
    }

    /*
    |--------------------------------------------------------------------------
    | Report Navigation
    |--------------------------------------------------------------------------
    */

    const reportItems: NavItem[] = reportTypes.map(
        (reportType): NavItem => ({
            title: reportType.name,
            href:
                reportRoutes[reportType.code] ??
                `/justine/reports/${reportType.slug}`,
            icon:
                reportTypeIcons[reportType.code] ??
                FileText,
        }),
    )

    /*
    |--------------------------------------------------------------------------
    | Main Navigation
    |--------------------------------------------------------------------------
    */

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/justine/reports/hwpsc/dashboard',
            icon: LayoutDashboard,
        },

        {
            title: 'Justine',
            href: '#',
            icon: BarChart3,
            items: reportItems,
        },

        {
            title: 'FHSIS Report',
            href: '/justine/fhsis',
            icon: ClipboardList,
        },
    ]

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
        >
            {/* ============================================================
                HEADER
            ============================================================ */}

            <SidebarHeader className="border-b border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="hover:bg-sidebar-accent"
                        >
                            <Link
                                href={dashboard()}
                                prefetch
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* ============================================================
                MAIN NAVIGATION
            ============================================================ */}

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {/* --------------------------------------------------------
                    Configuration / Administration
                -------------------------------------------------------- */}

                <div className="px-3 pt-6">
                    <div className="mb-2 flex items-center gap-2 px-2">
                        <Settings2 className="size-3.5 text-muted-foreground" />

                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Administration
                        </span>
                    </div>

                    <NavMain
                        items={[
                            {
                                title: 'LGUs',
                                href: '/lgus',
                                icon: UsersRound,
                            },
                            {
                                title: 'Report Types',
                                href: '/report-types',
                                icon: FileText,
                            },
                            {
                                title: 'Report Sections',
                                href: '/report-sections',
                                icon: FolderTree,
                            },
                            {
                                title: 'Indicators',
                                href: '/indicators',
                                icon: ListChecks,
                            },
                            {
                                title: 'Quarters',
                                href: '/quarters',
                                icon: CalendarRange,
                            },
                            {
                                title: 'Reporting Periods',
                                href: '/reporting-periods',
                                icon: CalendarDays,
                            },
                            {
                                title: 'Import Mappings',
                                href: '/report-import-mappings',
                                icon: FileSpreadsheet,
                            },
                            {
                                title: 'FHSIS Import Mappings',
                                href: '/justine/fhsis-import-mappings',
                                icon: FileSpreadsheet,
                            },
                            {
                                title: 'Eto Calculator',
                                href: '/justine/report-formulas',
                                icon: FileCog,
                            },
                            {
                                title: 'Dashboard Configuration',
                                href: '/justine/dashboard-configuration',
                                icon: LayoutDashboard,
                            },
                            {
                                title: 'Import Audit Trail',
                                href: '/report-imports',
                                icon: ClipboardCheck,
                            },
                        ]}
                    />
                </div>

                {/* --------------------------------------------------------
                    System
                -------------------------------------------------------- */}

                <div className="px-3 pt-6">
                    <div className="mb-2 flex items-center gap-2 px-2">
                        <ShieldCheck className="size-3.5 text-muted-foreground" />

                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            System
                        </span>
                    </div>

                    <NavMain
                        items={[
                            {
                                title: 'Report Email Configuration',
                                href: '/justine/lgu-report-emails',
                                icon: Mail,
                            },
                        ]}
                    />
                </div>
            </SidebarContent>

            {/* ============================================================
                FOOTER
            ============================================================ */}

            <SidebarFooter className="border-t border-sidebar-border">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}