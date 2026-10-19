import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardWidgetData } from './DashboardWidget'

export function ChartWidget({ widget }: { widget: DashboardWidgetData }) {
    return (
        <Card>
            <CardHeader><CardTitle>{widget.title}</CardTitle></CardHeader>
            <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {(widget.data ?? []).map((row, index) => (
                        <div key={index} className="rounded-lg border p-3">
                            <div className="text-xs font-medium">{String(row.quarter ?? index + 1)}</div>
                            <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                                {JSON.stringify(row, null, 2)}
                            </pre>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
