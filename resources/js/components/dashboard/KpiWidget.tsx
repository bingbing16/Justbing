import { Card, CardContent } from '@/components/ui/card'
import type { DashboardWidgetData } from './DashboardWidget'

export function KpiWidget({ widget }: { widget: DashboardWidgetData }) {
    return (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/80">
            <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {widget.title}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                    {widget.value == null ? '—' : widget.value.toLocaleString()}
                </p>
                {widget.description && (
                    <p className="mt-1 text-xs text-slate-500">{widget.description}</p>
                )}
            </CardContent>
        </Card>
    )
}
