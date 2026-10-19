<!DOCTYPE html>
<html>
<head>
    <title>Test Report Submission</title>
</head>

<body>

<h1>Test Report Submission</h1>

<form method="POST" action="{{ route('report-submissions.store') }}">

    @csrf

    <div>
        <label>LGU</label>

        <select name="lgu_id" required>
            <option value="">-- Select LGU --</option>

            @foreach ($lgus as $lgu)
                <option value="{{ $lgu->id }}">
                    {{ $lgu->name }}
                </option>
            @endforeach
        </select>
    </div>

    <br>

    <div>
        <label>Report Type</label>

        <select name="report_type_id" required>
            <option value="">-- Select Report Type --</option>

            @foreach ($reportTypes as $reportType)
                <option value="{{ $reportType->id }}">
                    {{ $reportType->name }}
                    ({{ $reportType->code }})
                </option>
            @endforeach
        </select>
    </div>

    <br>

    <div>
        <label>Reporting Period</label>

        <select name="reporting_period_id" required>
            <option value="">-- Select Period --</option>

            @foreach ($periods as $period)
                <option value="{{ $period->id }}">
                    {{ $period->year }} {{ $period->quarter->code }}
                </option>
            @endforeach
        </select>
    </div>

    <br>

    <div>
        <label>Status</label>

        <select name="status_id" required>
            <option value="">-- Select Status --</option>

            @foreach ($statuses as $status)
                <option value="{{ $status->id }}">
                    {{ $status->name }}
                </option>
            @endforeach
        </select>
    </div>

    <br>

    <div>
        <label>Remarks</label>

        <textarea name="remarks"></textarea>
    </div>

    <br>

    <button type="submit">
        Create Submission
    </button>

</form>

</body>
</html>