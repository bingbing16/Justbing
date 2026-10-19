import { KpiWidget } from './KpiWidget'
import { SummaryTableWidget } from './SummaryTableWidget'
import { ChartWidget } from './ChartWidget'
import { RankingWidget } from './RankingWidget'

export interface DashboardIndicatorData {
    id: number
    code: string
    name: string
    display_order: number
    quarters: Record<string, { male: number | null; female: number | null; total: number | null }>
    annual: { male: number | null; female: number | null; total: number | null }
}

export interface DashboardSectionData {
    id: number
    code: string
    name: string
    description: string | null
    indicators: DashboardIndicatorData[]
}

export interface DashboardWidgetData {
    id: number
    key: string
    type: 'kpi' | 'summary_table' | 'bar_chart' | 'line_chart' | 'ranking'
    title: string
    description: string | null
    value?: number | null
    config?: Record<string, unknown>
    data?: Record<string, unknown>[]
}

export function DashboardWidget({
    widget,
    sections,
}: {
    widget: DashboardWidgetData
    sections: DashboardSectionData[]
}) {
    switch (widget.type) {
        case 'kpi':
            return <KpiWidget widget={widget} />
        case 'summary_table':
            return <SummaryTableWidget sections={sections} />
        case 'bar_chart':
        case 'line_chart':
            return <ChartWidget widget={widget} />
        case 'ranking':
            return <RankingWidget widget={widget} />
        default:
            return null
    }
}
