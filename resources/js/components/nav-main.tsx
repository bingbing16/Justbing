import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    useSidebar,
} from '@/components/ui/sidebar';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { state } = useSidebar();

    const isCollapsed = state === 'collapsed';

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>

            <SidebarMenu>
                {items.map((item) => {
                    const hasChildren =
                        item.items && item.items.length > 0;

                    /*
                     * NORMAL ITEM
                     */
                    if (!hasChildren) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                    tooltip={{
                                        children: item.title,
                                    }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }

                    /*
                     * COLLAPSED SIDEBAR
                     *
                     * Show children in a dropdown
                     */
                    if (isCollapsed) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={{
                                                children: item.title,
                                            }}
                                        >
                                            {item.icon && <item.icon />}

                                            <span>{item.title}</span>

                                            <ChevronRight className="ml-auto" />
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                        side="right"
                                        align="start"
                                        className="min-w-48"
                                    >
                                        {item.items?.map((subItem) => (
                                            <DropdownMenuItem
                                                key={subItem.title}
                                                asChild
                                            >
                                                <Link
                                                    href={subItem.href}
                                                    prefetch
                                                >
                                                    {subItem.icon && (
                                                        <subItem.icon />
                                                    )}

                                                    <span>
                                                        {subItem.title}
                                                    </span>
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarMenuItem>
                        );
                    }

                    /*
                     * EXPANDED SIDEBAR
                     *
                     * Keep your existing Collapsible
                     */
                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={{
                                            children: item.title,
                                        }}
                                    >
                                        {item.icon && <item.icon />}

                                        <span>{item.title}</span>

                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items?.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title} >
                                                <SidebarMenuSubButton asChild isActive={isCurrentUrl( subItem.href, )} >
                                                    <Link
                                                        href={subItem.href} prefetch > {subItem.icon && ( <subItem.icon /> )}

                                                        <span> {subItem.title} </span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
