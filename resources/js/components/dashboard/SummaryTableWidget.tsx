import type { DashboardSectionData } from './DashboardWidget'

const display = (v: number | null) => v == null ? '—' : v.toLocaleString()

export function SummaryTableWidget({ sections }: { sections: DashboardSectionData[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse">
                <thead>
                    <tr>
                        <th className="sticky left-0 z-10 bg-[#063b6f] p-3 text-left text-xs text-white">
                            Indicator
                        </th>
                        {['Q1', 'Q2', 'Q3', 'Q4', 'Annual'].map((q) => (
                            <th key={q} colSpan={3} className="bg-[#063b6f] p-3 text-center text-xs text-white">
                                {q}
                            </th>
                        ))}
                    </tr>
                    <tr>
                        <th className="sticky left-0 z-10 bg-slate-100" />
                        {Array.from({ length: 5 }).flatMap((_, i) => [
                            <th key={`m${i}`} className="bg-slate-100 px-2 py-2 text-xs">M</th>,
                            <th key={`f${i}`} className="bg-slate-100 px-2 py-2 text-xs">F</th>,
                            <th key={`t${i}`} className="bg-slate-100 px-2 py-2 text-xs">T</th>,
                        ])}
                    </tr>
                </thead>
                <tbody>
                    {sections.map((section) => (
                        <tr key={`section-${section.id}`}>
                            <td colSpan={16} className="bg-slate-100 px-4 py-3 text-xs font-bold uppercase">
                                {section.name}
                            </td>
                        </tr>
                    ))}
                    {sections.flatMap((section) =>
                        section.indicators.map((indicator) => (
                            <tr key={indicator.id} className="border-b">
                                <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium">
                                    {indicator.name}
                                </td>
                                {[1,2,3,4].map((q) => {
                                    const v = indicator.quarters[String(q)] ?? { male: null, female: null, total: null }
                                    return [
                                        <td key={`${indicator.id}-${q}-m`} className="px-3 py-2 text-center">{display(v.male)}</td>,
                                        <td key={`${indicator.id}-${q}-f`} className="px-3 py-2 text-center">{display(v.female)}</td>,
                                        <td key={`${indicator.id}-${q}-t`} className="px-3 py-2 text-center font-semibold">{display(v.total)}</td>,
                                    ]
                                })}
                                {[
                                    <td key={`${indicator.id}-am`} className="px-3 py-2 text-center">{display(indicator.annual.male)}</td>,
                                    <td key={`${indicator.id}-af`} className="px-3 py-2 text-center">{display(indicator.annual.female)}</td>,
                                    <td key={`${indicator.id}-at`} className="px-3 py-2 text-center font-semibold">{display(indicator.annual.total)}</td>,
                                ]}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
