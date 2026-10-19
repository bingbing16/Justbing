<?php

namespace App\Http\Controllers;

use App\Models\Indicator;
use App\Models\ReportIndicatorFormula;
use App\Models\ReportType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ReportFormulaController extends Controller
{
    public function index(Request $request)
    {
        $type=strtoupper($request->input('type','HWPSC'));
        $reportType=ReportType::with(['sections'=>fn($q)=>$q->where('is_active',true)->whereNull('parent_id')->with([
            'indicators'=>fn($q)=>$q->where('is_active',true)->orderBy('display_order'),
            'children'=>fn($q)=>$q->where('is_active',true)->with(['indicators'=>fn($q)=>$q->where('is_active',true)->orderBy('display_order')]),
        ])])->where('code',$type)->where('is_active',true)->firstOrFail();
        $indicators=$reportType->sections->flatMap(fn($s)=>$s->indicators->concat($s->children->flatMap(fn($c)=>$c->indicators)))->values();
        return Inertia::render('justine/report-formulas/index',[
            'reportType'=>$reportType->only(['id','code','name']),
            'reportTypes'=>ReportType::where('is_active',true)->orderBy('name')->get(['id','code','name']),
            'indicators'=>$indicators,
            'formulas'=>ReportIndicatorFormula::where('report_type_id',$reportType->id)->get(),
        ]);
    }

    public function upsert(Request $request)
    {
        $data=$request->validate([
            'report_type_id'=>['required','exists:report_types,id'],'indicator_id'=>['required','exists:indicators,id'],
            'formula_type'=>['required',Rule::in(['percentage','ratio','add','subtract','multiply','divide'])],
            'expression'=>['required','array'],'display_formula'=>['nullable','string','max:1000'],
            'decimal_places'=>['required','integer','min:0','max:6'],'is_active'=>['boolean'],
        ]);
        $indicator=Indicator::with('section')->findOrFail($data['indicator_id']);
        abort_unless($indicator->section?->report_type_id===(int)$data['report_type_id'],422,'Indicator does not belong to this report type.');
        $data['created_by']=auth()->id();$data['updated_by']=auth()->id();
        ReportIndicatorFormula::updateOrCreate(['report_type_id'=>$data['report_type_id'],'indicator_id'=>$data['indicator_id']],$data);
        return back()->with('success','Formula saved.');
    }

    public function destroy(ReportIndicatorFormula $formula){$formula->delete();return back()->with('success','Formula removed.');}
}
