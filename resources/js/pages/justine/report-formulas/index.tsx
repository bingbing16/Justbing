import { FormEvent, useMemo, useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import {
    ArrowLeft,
    Calculator,
    CheckCircle2,
    ChevronDown,
    Divide,
    Minus,
    Percent,
    Plus,
    Save,
    Trash2,
    X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

type ReportType = {
    id: number
    code: string
    name: string
}

type Indicator = {
    id: number
    code: string
    name: string
    display_order?: number
    is_active?: boolean
    section?: {
        id: number
        code: string
        name: string
        report_type_id: number
    }
}

type Expression =
    | { type: 'indicator'; indicator_id: number; field: 'male' | 'female' | 'total' }
    | { type: 'constant'; value: number }
    | {
          type: 'add' | 'subtract' | 'multiply' | 'divide'
          left: Expression
          right: Expression
      }

type Formula = {
    id: number
    report_type_id: number
    indicator_id: number
    formula_type: 'percentage' | 'ratio' | 'add' | 'subtract' | 'multiply' | 'divide'
    expression: Expression
    display_formula?: string | null
    decimal_places: number
    is_active: boolean
}

type Props = {
    reportType: ReportType
    reportTypes: ReportType[]
    indicators: Indicator[]
    formulas: Formula[]
}

type Operand = {
    indicator_id: number | null
    field: 'male' | 'female' | 'total'
}

const operators = {
    add: '+',
    subtract: '−',
    multiply: '×',
    divide: '÷',
} as const

const formulaTypeLabels = {
    percentage: 'Percentage',
    ratio: 'Ratio',
    add: 'Addition',
    subtract: 'Subtraction',
    multiply: 'Multiplication',
    divide: 'Division',
} as const

function getIndicator(indicators: Indicator[], id: number | null) {
    return indicators.find((item) => item.id === id)
}

function expressionToCode(expression: Expression | null, indicators: Indicator[]): string {
    if (!expression) return ''

    if (expression.type === 'indicator') {
        const indicator = getIndicator(indicators, expression.indicator_id)
        return `${indicator?.code ?? `INDICATOR_${expression.indicator_id}`}.${expression.field}`
    }

    if (expression.type === 'constant') {
        return String(expression.value)
    }

    return `(${expressionToCode(expression.left, indicators)} ${operators[expression.type]} ${expressionToCode(expression.right, indicators)})`
}

function expressionToReadable(expression: Expression | null, indicators: Indicator[]): string {
    if (!expression) return ''

    if (expression.type === 'indicator') {
        const indicator = getIndicator(indicators, expression.indicator_id)
        return `${indicator?.name ?? `Indicator #${expression.indicator_id}`} (${expression.field})`
    }

    if (expression.type === 'constant') {
        return String(expression.value)
    }

    return `(${expressionToReadable(expression.left, indicators)} ${operators[expression.type]} ${expressionToReadable(expression.right, indicators)})`
}

function makePercentageExpression(
    numerator: Operand,
    denominator: Operand,
    multiplier: number,
): Expression | null {
    if (!numerator.indicator_id || !denominator.indicator_id) return null

    return {
        type: 'multiply',
        left: {
            type: 'divide',
            left: {
                type: 'indicator',
                indicator_id: numerator.indicator_id,
                field: numerator.field,
            },
            right: {
                type: 'indicator',
                indicator_id: denominator.indicator_id,
                field: denominator.field,
            },
        },
        right: {
            type: 'constant',
            value: multiplier,
        },
    }
}

function parsePercentageExpression(expression: Expression) {
    if (
        expression.type !== 'multiply' ||
        expression.right.type !== 'constant' ||
        expression.left.type !== 'divide' ||
        expression.left.left.type !== 'indicator' ||
        expression.left.right.type !== 'indicator'
    ) {
        return null
    }

    return {
        numerator: {
            indicator_id: expression.left.left.indicator_id,
            field: expression.left.left.field,
        } as Operand,
        denominator: {
            indicator_id: expression.left.right.indicator_id,
            field: expression.left.right.field,
        } as Operand,
        multiplier: String(expression.right.value),
    }
}

export default function ReportFormulasIndex({
    reportType,
    reportTypes,
    indicators,
    formulas,
}: Props) {
    const [selectedIndicatorId, setSelectedIndicatorId] = useState<number | null>(
        indicators[0]?.id ?? null,
    )

    const [formulaType, setFormulaType] =
        useState<Formula['formula_type']>('percentage')

    const [numerator, setNumerator] = useState<Operand>({
        indicator_id: null,
        field: 'total',
    })

    const [denominator, setDenominator] = useState<Operand>({
        indicator_id: null,
        field: 'total',
    })

    const [multiplier, setMultiplier] = useState('100')
    const [decimalPlaces, setDecimalPlaces] = useState('2')
    const [displayFormula, setDisplayFormula] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [editingId, setEditingId] = useState<number | null>(null)

    const [advancedMode, setAdvancedMode] = useState(false)
    const [advancedExpression, setAdvancedExpression] = useState('')
    const [advancedError, setAdvancedError] = useState('')

    const selectedIndicator = getIndicator(indicators, selectedIndicatorId)

    const groupedIndicators = useMemo(() => {
        const groups = new Map<string, Indicator[]>()

        indicators.forEach((indicator) => {
            const section = indicator.section?.name ?? 'Indicators'

            if (!groups.has(section)) {
                groups.set(section, [])
            }

            groups.get(section)!.push(indicator)
        })

        return [...groups.entries()]
    }, [indicators])

    const currentFormula = formulas.find(
        (formula) => formula.indicator_id === selectedIndicatorId,
    )

    const visualExpression = useMemo(
        () =>
            makePercentageExpression(
                numerator,
                denominator,
                Number(multiplier) || 0,
            ),
        [numerator, denominator, multiplier],
    )

    const previewCode = expressionToCode(visualExpression, indicators)
    const previewReadable = expressionToReadable(visualExpression, indicators)

    function resetForm() {
        setEditingId(null)
        setFormulaType('percentage')
        setNumerator({ indicator_id: null, field: 'total' })
        setDenominator({ indicator_id: null, field: 'total' })
        setMultiplier('100')
        setDecimalPlaces('2')
        setDisplayFormula('')
        setIsActive(true)
        setAdvancedMode(false)
        setAdvancedExpression('')
        setAdvancedError('')
    }

    function loadFormula(formula: Formula) {
        setSelectedIndicatorId(formula.indicator_id)
        setEditingId(formula.id)
        setFormulaType(formula.formula_type)
        setDecimalPlaces(String(formula.decimal_places))
        setDisplayFormula(formula.display_formula ?? '')
        setIsActive(formula.is_active)

        const parsed = parsePercentageExpression(formula.expression)

        if (parsed) {
            setNumerator(parsed.numerator)
            setDenominator(parsed.denominator)
            setMultiplier(parsed.multiplier)
            setAdvancedMode(false)
            setAdvancedExpression('')
        } else {
            setAdvancedMode(true)
            setAdvancedExpression(JSON.stringify(formula.expression, null, 2))
        }

        setAdvancedError('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function handleIndicatorChange(value: string) {
        const id = Number(value)
        setSelectedIndicatorId(id)

        const formula = formulas.find((item) => item.indicator_id === id)

        if (formula) {
            loadFormula(formula)
        } else {
            resetForm()
            setSelectedIndicatorId(id)
        }
    }

    function handleReportTypeChange(value: string) {
        router.get(
            `/justine/report-formulas?type=${encodeURIComponent(value)}`,
            {},
            { preserveState: false },
        )
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault()
        setAdvancedError('')

        if (!selectedIndicatorId) {
            setAdvancedError('Please select the indicator being calculated.')
            return
        }

        let expression: Expression | null = visualExpression

        if (advancedMode) {
            try {
                expression = JSON.parse(advancedExpression) as Expression
            } catch {
                setAdvancedError('The advanced expression is not valid JSON.')
                return
            }
        }

        if (!expression) {
            setAdvancedError('Select both a numerator and denominator.')
            return
        }

        router.post(
            '/justine/fhsis/formulas',
            {
                report_type_id: reportType.id,
                indicator_id: selectedIndicatorId,
                formula_type: formulaType,
                expression,
                display_formula:
                    displayFormula.trim() ||
                    expressionToCode(expression, indicators),
                decimal_places: Number(decimalPlaces),
                is_active: isActive,
            },
            {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            },
        )
    }

    function handleDelete(formula: Formula) {
        const indicator = getIndicator(indicators, formula.indicator_id)

        if (
            !window.confirm(
                `Remove the formula for "${indicator?.name ?? 'this indicator'}"?`,
            )
        ) {
            return
        }

        router.delete(`/justine/fhsis/formulas/${formula.id}`, {
            preserveScroll: true,
        })
    }

    return (
        <>
            <Head title={`${reportType.name} Formula Builder`} />

            <div className="min-h-screen bg-slate-50">
                <header className="border-b bg-slate-950 text-white">
                    <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-4">
                                <Link
                                    href="/justine/reports/hwpsc"
                                    className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>

                                <div>
                                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                                        <Calculator className="h-4 w-4" />
                                        Reporting Configuration
                                    </div>

                                    <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                                        Formula Builder
                                    </h1>

                                    <p className="mt-1 text-sm text-slate-300">
                                        Create reusable formulas for dashboard indicators without changing PHP code.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Active formulas
                                    </div>
                                    <div className="text-xl font-bold">
                                        {formulas.filter((formula) => formula.is_active).length}
                                    </div>
                                </div>

                                <Select
                                    value={reportType.code}
                                    onValueChange={handleReportTypeChange}
                                >
                                    <SelectTrigger className="w-[230px] border-white/10 bg-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {reportTypes.map((type) => (
                                            <SelectItem
                                                key={type.id}
                                                value={type.code}
                                            >
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl space-y-6 px-6 py-7 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_380px]">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="border-b">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <CardTitle>
                                            {editingId ? 'Edit formula' : 'Create formula'}
                                        </CardTitle>
                                        <CardDescription>
                                            Configure the calculation used for the selected indicator.
                                        </CardDescription>
                                    </div>

                                    {editingId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetForm}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Indicator being calculated</Label>

                                            <Select
                                                value={
                                                    selectedIndicatorId
                                                        ? String(selectedIndicatorId)
                                                        : ''
                                                }
                                                onValueChange={handleIndicatorChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select indicator" />
                                                </SelectTrigger>

                                                <SelectContent className="max-h-[420px]">
                                                    {groupedIndicators.map(
                                                        ([section, sectionIndicators]) => (
                                                            <div key={section}>
                                                                <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                                    {section}
                                                                </div>

                                                                {sectionIndicators.map((indicator) => (
                                                                    <SelectItem
                                                                        key={indicator.id}
                                                                        value={String(indicator.id)}
                                                                    >
                                                                        <span
                                                                            className="block max-w-[250px] truncate"
                                                                            title={indicator.name}
                                                                        >
                                                                            {indicator.name}
                                                                        </span>
                                                                    </SelectItem>
                                                                ))}
                                                            </div>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>

                                            {selectedIndicator && (
                                                <p className="text-xs text-slate-500">
                                                    Code:{' '}
                                                    <span className="font-mono">
                                                        {selectedIndicator.code}
                                                    </span>
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Formula type</Label>

                                            <Select
                                                value={formulaType}
                                                onValueChange={(value) =>
                                                    setFormulaType(
                                                        value as Formula['formula_type'],
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {Object.entries(
                                                        formulaTypeLabels,
                                                    ).map(([value, label]) => (
                                                        <SelectItem
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Separator />

                                    {!advancedMode ? (
                                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
                                            <div className="mb-5 flex items-center gap-3">
                                                <div className="rounded-xl bg-cyan-100 p-2.5">
                                                    <Percent className="h-5 w-5 text-cyan-700" />
                                                </div>

                                                <div>
                                                    <h2 className="font-semibold text-slate-900">
                                                        Percentage / ratio builder
                                                    </h2>
                                                    <p className="text-xs text-slate-600">
                                                        Use this for coverage, rates, percentages and similar calculations.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_130px] xl:items-end">
                                                <div className="space-y-2">
                                                    <Label>Numerator</Label>

                                                    <Select
                                                        value={
                                                            numerator.indicator_id
                                                                ? String(
                                                                      numerator.indicator_id,
                                                                  )
                                                                : ''
                                                        }
                                                        onValueChange={(value) =>
                                                            setNumerator((current) => ({
                                                                ...current,
                                                                indicator_id: Number(value),
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder="Select indicator" />
                                                        </SelectTrigger>

                                                        <SelectContent className="max-h-[360px]">
                                                            {indicators.map((indicator) => (
                                                                <SelectItem
                                                                    key={`num-${indicator.id}`}
                                                                    value={String(indicator.id)}
                                                                >
                                                                    <span
                                                                        className="block max-w-[220px] truncate"
                                                                        title={indicator.name}
                                                                    >
                                                                        {indicator.name}
                                                                    </span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={numerator.field}
                                                        onValueChange={(value) =>
                                                            setNumerator((current) => ({
                                                                ...current,
                                                                field: value as Operand['field'],
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue />
                                                        </SelectTrigger>

                                                        <SelectContent>
                                                            <SelectItem value="male">
                                                                Male
                                                            </SelectItem>
                                                            <SelectItem value="female">
                                                                Female
                                                            </SelectItem>
                                                            <SelectItem value="total">
                                                                Total
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="hidden h-10 items-center justify-center md:flex">
                                                    <Divide className="h-5 w-5 text-slate-400" />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Denominator</Label>

                                                    <Select
                                                        value={
                                                            denominator.indicator_id
                                                                ? String(
                                                                      denominator.indicator_id,
                                                                  )
                                                                : ''
                                                        }
                                                        onValueChange={(value) =>
                                                            setDenominator((current) => ({
                                                                ...current,
                                                                indicator_id: Number(value),
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder="Select indicator" />
                                                        </SelectTrigger>

                                                        <SelectContent className="max-h-[360px]">
                                                            {indicators.map((indicator) => (
                                                                <SelectItem
                                                                    key={`den-${indicator.id}`}
                                                                    value={String(indicator.id)}
                                                                >
                                                                    <span
                                                                        className="block max-w-[250px] truncate"
                                                                        title={indicator.name}
                                                                    >
                                                                        {indicator.name}
                                                                    </span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={denominator.field}
                                                        onValueChange={(value) =>
                                                            setDenominator((current) => ({
                                                                ...current,
                                                                field: value as Operand['field'],
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue />
                                                        </SelectTrigger>

                                                        <SelectContent>
                                                            <SelectItem value="male">
                                                                Male
                                                            </SelectItem>
                                                            <SelectItem value="female">
                                                                Female
                                                            </SelectItem>
                                                            <SelectItem value="total">
                                                                Total
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="hidden h-10 items-center justify-center md:flex">
                                                    <span className="text-xl font-semibold text-slate-400">
                                                        ×
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Multiplier</Label>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={multiplier}
                                                        onChange={(event) =>
                                                            setMultiplier(
                                                                event.target.value,
                                                            )
                                                        }
                                                        className="bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label>Advanced expression JSON</Label>

                                            <Textarea
                                                value={advancedExpression}
                                                onChange={(event) =>
                                                    setAdvancedExpression(
                                                        event.target.value,
                                                    )
                                                }
                                                className="min-h-[300px] font-mono text-sm"
                                                placeholder={`{
  "type": "multiply",
  "left": {
    "type": "divide",
    "left": {
      "type": "indicator",
      "indicator_id": 1,
      "field": "total"
    },
    "right": {
      "type": "indicator",
      "indicator_id": 2,
      "field": "total"
    }
  },
  "right": {
    "type": "constant",
    "value": 100
  }
}`}
                                            />
                                        </div>
                                    )}

                                    {advancedError && (
                                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                            {advancedError}
                                        </div>
                                    )}

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Display formula</Label>

                                            <Input
                                                value={displayFormula}
                                                onChange={(event) =>
                                                    setDisplayFormula(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="e.g. Screened / Target × 100"
                                            />

                                            <p className="text-xs text-slate-500">
                                                Optional human-readable formula shown in the configuration list.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Decimal places</Label>

                                            <Input
                                                type="number"
                                                min="0"
                                                max="6"
                                                value={decimalPlaces}
                                                onChange={(event) =>
                                                    setDecimalPlaces(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 rounded-xl border bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={isActive}
                                                onCheckedChange={setIsActive}
                                            />

                                            <div>
                                                <div className="text-sm font-medium">
                                                    Formula active
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Active formulas are used by the dashboard.
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                setAdvancedMode(
                                                    (current) => !current,
                                                )
                                            }
                                        >
                                            <ChevronDown
                                                className={`mr-2 h-4 w-4 transition-transform ${
                                                    advancedMode
                                                        ? 'rotate-180'
                                                        : ''
                                                }`}
                                            />
                                            {advancedMode
                                                ? 'Use visual builder'
                                                : 'Advanced expression'}
                                        </Button>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetForm}
                                        >
                                            Clear
                                        </Button>

                                        <Button type="submit">
                                            <Save className="mr-2 h-4 w-4" />
                                            {editingId
                                                ? 'Update formula'
                                                : 'Save formula'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="h-fit border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle>Live formula preview</CardTitle>
                                <CardDescription>
                                    Verify the expression before saving.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="rounded-2xl bg-slate-950 p-5 text-white">
                                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Expression
                                    </div>

                                    <div className="break-words font-mono text-sm leading-7 text-cyan-200">
                                        {advancedMode
                                            ? advancedExpression ||
                                              'Enter an expression'
                                            : previewCode ||
                                              'Select numerator and denominator'}
                                    </div>
                                </div>

                                <div className="rounded-xl border p-4">
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Readable
                                    </div>

                                    <p className="text-sm font-medium leading-6 text-slate-800">
                                        {advancedMode
                                            ? 'Advanced expression'
                                            : previewReadable ||
                                              'No formula selected yet.'}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                                        <div>
                                            <div className="font-semibold text-emerald-900">
                                                HWPSC example
                                            </div>

                                            <p className="mt-1 text-sm text-emerald-800">
                                                Screened = 170 and Target = 3,350
                                            </p>

                                            <p className="mt-2 font-mono text-sm font-bold text-emerald-900">
                                                170 ÷ 3,350 × 100 = 5.07%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                                    A missing value stays missing. A zero denominator produces no percentage rather than an invalid result.
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="border-b">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle>Configured formulas</CardTitle>
                                    <CardDescription>
                                        Existing formulas for {reportType.name}.
                                    </CardDescription>
                                </div>

                                <Badge variant="secondary">
                                    {formulas.length} configured
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {formulas.length === 0 ? (
                                <div className="px-6 py-14 text-center">
                                    <Calculator className="mx-auto h-10 w-10 text-slate-300" />
                                    <h3 className="mt-4 font-semibold">
                                        No formulas configured
                                    </h3>
                                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                                        Create your first formula above.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {formulas.map((formula) => {
                                        const indicator = getIndicator(
                                            indicators,
                                            formula.indicator_id,
                                        )

                                        return (
                                            <div
                                                key={formula.id}
                                                className="flex flex-col gap-4 px-6 py-5 hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-semibold">
                                                            {indicator?.name ??
                                                                `Indicator #${formula.indicator_id}`}
                                                        </h3>

                                                        <Badge
                                                            variant={
                                                                formula.is_active
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {formula.is_active
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </Badge>

                                                        <Badge variant="outline">
                                                            {
                                                                formulaTypeLabels[
                                                                    formula.formula_type
                                                                ]
                                                            }
                                                        </Badge>
                                                    </div>

                                                    <div className="mt-2 break-words rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">
                                                        {formula.display_formula ||
                                                            expressionToCode(
                                                                formula.expression,
                                                                indicators,
                                                            )}
                                                    </div>

                                                    <div className="mt-2 text-xs text-slate-500">
                                                        Precision:{' '}
                                                        {formula.decimal_places}{' '}
                                                        decimal places
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() =>
                                                            loadFormula(formula)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() =>
                                                            handleDelete(formula)
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="font-semibold">
                                        Formula patterns
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        These can be configured for future report types.
                                    </p>
                                </div>

                                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                                        <Divide className="h-4 w-4" />
                                        A ÷ B × 100
                                    </div>

                                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                                        <Plus className="h-4 w-4" />
                                        A + B
                                    </div>

                                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                                        <Minus className="h-4 w-4" />
                                        A − B
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </>
    )
}
