import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardWidgetData } from './DashboardWidget'

export function RankingWidget({ widget }: { widget: DashboardWidgetData }) {
    return (
        <Card>
            <CardHeader><CardTitle>{widget.title}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {(widget.data ?? []).map((row, index) => (
                    <div key={String(row.lgu_id ?? index)} className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <span className="text-sm font-medium">{index + 1}. {String(row.lgu ?? 'Unknown LGU')}</span>
                        <span className="font-semibold">{Number(row.value ?? 0).toLocaleString()}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
