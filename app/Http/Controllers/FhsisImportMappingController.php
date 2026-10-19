<?php

namespace App\Http\Controllers;

use App\Models\FhsisImportMapping;
use App\Http\Requests\StoreFhsisImportMappingRequest;
use App\Http\Requests\UpdateFhsisImportMappingRequest;
use App\Models\Indicator;
use App\Models\ReportType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FhsisImportMappingController extends Controller
{
    public function index()
    {
        $mappings = FhsisImportMapping::with([
            'reportType:id,code,name,slug',
            'indicator:id,code,name',
        ])
            ->orderBy('report_type_id')
            ->orderBy('id')
            ->paginate(50);

        $reportTypes = ReportType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'code',
                'name',
                'slug',
            ]);

        return Inertia::render('justine/FhsisImportMappings/index', [
            'mappings' => $mappings,
            'reportTypes' => $reportTypes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('justine/FhsisImportMappings/create',[
            'reportTypes'=>ReportType::where('is_active',true)->orderBy('name')->get(['id','code','name']),
            'indicators'=>Indicator::with('section:id,report_type_id,name,code')->where('is_active',true)->orderBy('report_section_id')->orderBy('display_order')->get(['id','report_section_id','code','name','display_order']),
        ]);
    }

    public function store(Request $request)
    {
        $data=$this->validateData($request);
        $this->ensureIndicatorBelongs($data);
        FhsisImportMapping::create($data);
        return redirect()->route('justine.fhsis-mappings.index')->with('success','FHSIS import mapping created successfully.');
    }

    public function edit(FhsisImportMapping $fhsisImportMapping): Response
    {
        return Inertia::render('justine/FhsisImportMappings/edit',[
            'mapping'=>$fhsisImportMapping,
            'reportTypes'=>ReportType::where('is_active',true)->orWhereKey($fhsisImportMapping->report_type_id)->orderBy('name')->get(['id','code','name']),
            'indicators'=>Indicator::with('section:id,report_type_id,name,code')->where('is_active',true)->orWhereKey($fhsisImportMapping->indicator_id)->orderBy('report_section_id')->orderBy('display_order')->get(['id','report_section_id','code','name','display_order']),
        ]);
    }

    public function update(Request $request, FhsisImportMapping $fhsisImportMapping)
    {
        $data=$this->validateData($request,$fhsisImportMapping);
        $this->ensureIndicatorBelongs($data);
        $fhsisImportMapping->update($data);
        return redirect()->route('justine.fhsis-mappings.index')->with('success','FHSIS import mapping updated successfully.');
    }

    public function updateStatus(Request $request, FhsisImportMapping $fhsisImportMapping)
    {
        $data=$request->validate(['is_active'=>['required','boolean']]);
        $fhsisImportMapping->update($data);
        return back()->with('success','FHSIS import mapping status updated successfully.');
    }

    private function validateData(Request $request, ?FhsisImportMapping $current=null): array
    {
        return $request->validate([
            'report_type_id'=>['required','exists:report_types,id'],
            'indicator_id'=>['required','exists:indicators,id',Rule::unique('fhsis_import_mappings','indicator_id')->where(fn($q)=>$q->where('report_type_id',$request->integer('report_type_id')))->ignore($current?->id)],
            'source_label'=>['required','string','max:255'],
            'source_key'=>['nullable','string','max:100'],
            'male_column'=>['nullable','integer','min:1','max:200'],
            'female_column'=>['nullable','integer','min:1','max:200'],
            'is_active'=>['required','boolean'],
        ]);
    }

    private function ensureIndicatorBelongs(array $data): void
    {
        abort_unless(Indicator::whereKey($data['indicator_id'])->whereHas('section',fn($q)=>$q->where('report_type_id',$data['report_type_id']))->exists(),422,'The selected indicator does not belong to the selected report type.');
    }
}
