import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface RecipientEmail {
    id: number
    email: string
    contact_name: string | null
}

interface SubmissionRecipients {
    submission_id: number
    lgu_id: number
    lgu_name: string
    report_type_id: number
    report_type: string
    year: number
    quarter: string
    emails: RecipientEmail[]
}

interface Props {
    open: boolean
    submissionIds: number[]
    onClose: () => void
}

export default function SendReportEmailModal({
    open,
    submissionIds,
    onClose,
}: Props) {

    const [loading, setLoading] = useState(false)

    const [recipients, setRecipients] =
        useState<SubmissionRecipients[]>([])

    const [selectedEmails, setSelectedEmails] =
        useState<Record<number, boolean>>({})

    const [subject, setSubject] =
        useState('')

    const [message, setMessage] =
        useState('')

    useEffect(() => {

        if (!open || submissionIds.length === 0) {
            return
        }

        setLoading(true)

        const params = new URLSearchParams()

        submissionIds.forEach((id) => {
            params.append(
                'submission_ids[]',
                String(id)
            )
        })

        fetch(
            `/justine/reports/hwpsc/email-recipients?${params.toString()}`,
            {
                headers: {
                    Accept: 'application/json',
                },
            }
        )
            .then((response) => response.json())
            .then((data) => {

                setRecipients(data)

                const initial: Record<
                    number,
                    boolean
                > = {}

                data.forEach(
                    (submission: SubmissionRecipients) => {
                        submission.emails.forEach(
                            (email) => {
                                initial[email.id] = true
                            }
                        )
                    }
                )

                setSelectedEmails(initial)

                setSubject(
                    'LGU Report Notification'
                )

                setMessage(
                    'Please be informed regarding the selected LGU report.'
                )
            })
            .finally(() => {
                setLoading(false)
            })

    }, [open, submissionIds])

    if (!open) {
        return null
    }

    const toggleEmail = (id: number) => {

        setSelectedEmails((current) => ({
            ...current,
            [id]: !current[id],
        }))
    }

    const send = () => {

        const payload = {
            recipients: recipients.map(
                (submission) => ({
                    submission_id:
                        submission.submission_id,

                    email_ids:
                        submission.emails
                            .filter(
                                (email) =>
                                    selectedEmails[
                                        email.id
                                    ]
                            )
                            .map(
                                (email) =>
                                    email.id
                            ),
                })
            ).filter(
                (item) =>
                    item.email_ids.length > 0
            ),

            subject,

            message,
        }

        if (
            payload.recipients.length === 0
        ) {
            alert(
                'Please select at least one recipient.'
            )

            return
        }

        router.post(
            '/justine/reports/hwpsc/email',
            payload,
            {
                preserveScroll: true,

                onSuccess: () => {
                    onClose()
                },
            }
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-background p-6 shadow-lg">

                <div className="mb-6">
                    <h2 className="text-xl font-semibold">
                        Send Email
                    </h2>

                    <p className="text-sm text-muted-foreground">
                        Select the LGU report recipients.
                    </p>
                </div>

                {loading ? (
                    <div className="py-10 text-center">
                        Loading recipients...
                    </div>
                ) : (
                    <div className="space-y-6">

                        {recipients.map(
                            (submission) => (
                                <div
                                    key={
                                        submission.submission_id
                                    }
                                    className="rounded-lg border p-4"
                                >

                                    <div className="mb-3">
                                        <div className="font-medium">
                                            {
                                                submission.lgu_name
                                            }
                                        </div>

                                        <div className="text-sm text-muted-foreground">
                                            {
                                                submission.report_type
                                            }
                                            {' — '}
                                            {
                                                submission.quarter
                                            }
                                            {' '}
                                            {
                                                submission.year
                                            }
                                        </div>
                                    </div>

                                    <div className="space-y-2">

                                        {submission.emails.length === 0 ? (
                                            <p className="text-sm text-red-500">
                                                No email configured for this LGU and report type.
                                            </p>
                                        ) : (
                                            submission.emails.map(
                                                (email) => (
                                                    <label
                                                        key={
                                                            email.id
                                                        }
                                                        className="flex cursor-pointer items-center gap-3 rounded-md border p-3"
                                                    >

                                                        <Checkbox
                                                            checked={
                                                                selectedEmails[
                                                                    email.id
                                                                ] ??
                                                                false
                                                            }
                                                            onCheckedChange={() =>
                                                                toggleEmail(
                                                                    email.id
                                                                )
                                                            }
                                                        />

                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                {
                                                                    email.contact_name ||
                                                                    email.email
                                                                }
                                                            </div>

                                                            {email.contact_name && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    {
                                                                        email.email
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>

                                                    </label>
                                                )
                                            )
                                        )}

                                    </div>
                                </div>
                            )
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Subject
                            </label>

                            <Input
                                value={subject}
                                onChange={(e) =>
                                    setSubject(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Message
                            </label>

                            <Textarea
                                value={message}
                                onChange={(e) =>
                                    setMessage(
                                        e.target.value
                                    )
                                }
                                rows={7}
                            />
                        </div>

                    </div>
                )}

                <div className="mt-6 flex justify-end gap-2">

                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={send}
                        disabled={loading}
                    >
                        Send Email
                    </Button>

                </div>

            </div>
        </div>
    )
}