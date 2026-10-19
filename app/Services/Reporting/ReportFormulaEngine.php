<?php

namespace App\Services\Reporting;

use Illuminate\Support\Collection;
use InvalidArgumentException;

class ReportFormulaEngine
{
    public function evaluate(?array $expression, Collection $values): ?float
    {
        if (!$expression) return null;
        $result = $this->node($expression, $values);
        return $result === null ? null : (float) $result;
    }

    private function node(array $node, Collection $values): ?float
    {
        return match ($node['type'] ?? null) {
            'constant' => is_numeric($node['value'] ?? null) ? (float) $node['value'] : null,
            'indicator' => $this->indicator($node, $values),
            'add' => $this->binary($node, $values, fn($a,$b) => $a + $b),
            'subtract' => $this->binary($node, $values, fn($a,$b) => $a - $b),
            'multiply' => $this->binary($node, $values, fn($a,$b) => $a * $b),
            'divide' => $this->divide($node, $values),
            default => throw new InvalidArgumentException('Unsupported formula operation.'),
        };
    }

    private function indicator(array $node, Collection $values): ?float
    {
        $value = $values->get((int)($node['indicator_id'] ?? 0));
        if (!$value) return null;
        $field = $node['field'] ?? 'total';
        if (!in_array($field, ['male','female','total'], true)) {
            throw new InvalidArgumentException('Unsupported indicator field.');
        }
        return $value->{$field} === null ? null : (float)$value->{$field};
    }

    private function binary(array $node, Collection $values, callable $op): ?float
    {
        $a = $this->node((array)($node['left'] ?? []), $values);
        $b = $this->node((array)($node['right'] ?? []), $values);
        return $a === null || $b === null ? null : $op($a, $b);
    }

    private function divide(array $node, Collection $values): ?float
    {
        $a = $this->node((array)($node['left'] ?? []), $values);
        $b = $this->node((array)($node['right'] ?? []), $values);
        return $a === null || $b === null || $b == 0.0 ? null : $a / $b;
    }
}
