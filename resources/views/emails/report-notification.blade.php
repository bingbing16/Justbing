<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $subjectText }}</title>
</head>

<body style="font-family: Arial, sans-serif; line-height: 1.6;">

    <p>
        {{ $messageText }}
    </p>

    <hr>

    <p>
        <strong>LGU:</strong>
        {{ $submission->lgu->name ?? 'N/A' }}
    </p>

    <p>
        <strong>Report:</strong>
        {{ $submission->reportType->name ?? 'N/A' }}
    </p>

    <p>
        <strong>Year:</strong>
        {{ $submission->reportingPeriod->year ?? 'N/A' }}
    </p>

    <p>
        <strong>Quarter:</strong>
        {{ $submission->reportingPeriod->quarter->name ?? 'N/A' }}
    </p>

    <p>
        This is a notification from the reporting system.
    </p>

</body>
</html>