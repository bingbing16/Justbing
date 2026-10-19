<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailLog extends Model
{
    protected $fillable = [
        'report_submission_id',
        'lgu_report_email_id',
        'sent_by',
        'recipient_email',
        'recipient_name',
        'subject',
        'message',
        'status',
        'sent_at',
        'error_message',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(
            ReportSubmission::class,
            'report_submission_id'
        );
    }

    public function lguReportEmail(): BelongsTo
    {
        return $this->belongsTo(
            LguReportEmail::class,
            'lgu_report_email_id'
        );
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'sent_by'
        );
    }
}