<?php

namespace App\Services\Reporting;

use App\Models\Quarter;
use App\Models\ReportIndicatorFormula;
use App\Models\ReportSubmission;
use App\Models\ReportType;
use Illuminate\Support\Collection;

class ReportDashboardService
{
    public function __construct(private ReportFormulaEngine $engine) {}

    public function build(ReportType $reportType, int $year, ?int $quarterId = null, ?int $lguId = null, string $status = 'all'): array
    {
        $reportType->loadMissing([
            'sections' => fn($q) => $q->where('is_active',true)->whereNull('parent_id')->orderBy('display_order')
                ->with([
                    'indicators' => fn($q) => $q->where('is_active',true)->orderBy('display_order'),
                    'children' => fn($q) => $q->where('is_active',true)->orderBy('display_order')
                        ->with(['indicators' => fn($q) => $q->where('is_active',true)->orderBy('display_order')]),
                ]),
        ]);

        $indicators = $this->flatten($reportType->sections);
        $formulas = ReportIndicatorFormula::where('report_type_id',$reportType->id)
            ->where('is_active',true)->whereIn('indicator_id',$indicators->pluck('id'))->get()->keyBy('indicator_id');

        $submissions = ReportSubmission::with(['lgu:id,name','reportingPeriod.quarter:id,code,name,sort_order','status:id,code,name'])
            ->where('report_type_id',$reportType->id)
            ->whereHas('reportingPeriod',function($q)use($year,$quarterId){$q->where('year',$year);if($quarterId)$q->where('quarter_id',$quarterId);})
            ->when($lguId,fn($q)=>$q->where('lgu_id',$lguId))
            ->when($status!=='all',fn($q)=>$q->whereHas('status',fn($s)=>$s->where('code',$status)))->get();

        $values = $submissions->isEmpty() ? collect() : \App\Models\ReportValue::whereIn('report_submission_id',$submissions->pluck('id'))->get();
        $rows = $submissions->map(fn($s)=>[
            'submission_id'=>$s->id,'lgu_id'=>$s->lgu_id,'lgu'=>$s->lgu?->name,
            'quarter_id'=>$s->reportingPeriod?->quarter_id,'quarter'=>$s->reportingPeriod?->quarter?->code,
            'quarter_name'=>$s->reportingPeriod?->quarter?->name,'status'=>$s->status?->code,
            'validation_status'=>$s->validation_status,
            'values'=>$values->where('report_submission_id',$s->id)->keyBy('indicator_id'),
        ]);

        return [
            'reportType'=>['id'=>$reportType->id,'code'=>$reportType->code,'name'=>$reportType->name],
            'filters'=>compact('year','quarterId','lguId','status'),
            'sections'=>$this->sections($reportType->sections,$rows,$formulas,$indicators),
            'quarters'=>Quarter::where('is_active',true)->orderBy('sort_order')->get(['id','code','name']),
            'kpis'=>['lgu_count'=>$rows->pluck('lgu_id')->unique()->count(),'submission_count'=>$rows->count(),'indicator_count'=>$indicators->count()],
            'lgus'=>$this->lgus($rows,$indicators),
            'submission_status'=>$rows->countBy('status')->all(),
            'validation_status'=>$rows->countBy('validation_status')->all(),
            'generated_at'=>now()->toIso8601String(),
        ];
    }

    private function sections(Collection $sections, Collection $rows, Collection $formulas, Collection $all): array
    {
        return $sections->map(fn($section)=>[
            'id'=>$section->id,'code'=>$section->code,'name'=>$section->name,
            'indicators'=>$section->indicators->map(fn($i)=>$this->indicator($i,$rows,$formulas,$all))->values(),
            'children'=>$section->children->map(fn($child)=>[
                'id'=>$child->id,'code'=>$child->code,'name'=>$child->name,
                'indicators'=>$child->indicators->map(fn($i)=>$this->indicator($i,$rows,$formulas,$all))->values(),
            ])->values(),
        ])->values()->all();
    }

    private function indicator($indicator, Collection $rows, Collection $formulas, Collection $all): array
    {
        $formula=$formulas->get($indicator->id);
        $quarters=[];
        foreach([1,2,3,4] as $qid) $quarters[$qid]=$this->aggregate($indicator->id,$rows->where('quarter_id',$qid),$formula,$all);
        return ['id'=>$indicator->id,'code'=>$indicator->code,'name'=>$indicator->name,'display_order'=>$indicator->display_order,
            'formula'=>$formula?['id'=>$formula->id,'type'=>$formula->formula_type,'display'=>$formula->display_formula,'decimal_places'=>$formula->decimal_places]:null,
            'quarters'=>$quarters,'annual'=>$this->aggregate($indicator->id,$rows,$formula,$all)];
    }

    private function aggregate(int $indicatorId, Collection $rows, $formula, Collection $all): array
    {
        $values=collect(); foreach($all as $i) $values->put($i->id,$this->raw($i->id,$rows));
        $raw=$values->get($indicatorId);
        $percentage=$formula ? $this->engine->evaluate($formula->expression,$values) : null;
        return ['male'=>$raw?->male,'female'=>$raw?->female,'total'=>$raw?->total,'percentage'=>$percentage===null?null:round($percentage,$formula->decimal_places)];
    }

    private function raw(int $id, Collection $rows): ?object
    {
        $known=$rows->map(fn($r)=>$r['values']->get($id))->filter();
        if($known->isEmpty())return null;
        return (object)['male'=>$this->sum($known,'male'),'female'=>$this->sum($known,'female'),'total'=>$this->sum($known,'total')];
    }

    private function sum(Collection $values,string $field):?float
    {
        $v=$values->map(fn($x)=>$x->{$field})->filter(fn($x)=>$x!==null);
        return $v->isEmpty()?null:(float)$v->sum();
    }

    private function lgus(Collection $rows, Collection $indicators): array
    {
        return $rows->groupBy('lgu_id')->map(function($items)use($indicators){$first=$items->first();$metrics=[];foreach($indicators as $i){$v=$this->raw($i->id,$items);$metrics[$i->code]=$v?->total;}return ['lgu_id'=>$first['lgu_id'],'lgu'=>$first['lgu'],'metrics'=>$metrics];})->values()->all();
    }

    private function flatten(Collection $sections): Collection
    {
        return $sections->flatMap(fn($s)=>$s->indicators->concat($s->children->flatMap(fn($c)=>$c->indicators)))->keyBy('id')->values();
    }
}
